// update.js — Sistema de Postagens Fluência Contábil
// Roda: node update.js
// Faz: 1) baixa as 2 pastas do Drive via curl  2) gera HTML atualizado

const { execSync } = require('child_process');
const fs = require('fs');

// ── Série 1: Práticos + Motivacionais ──
const FOLDER_TODOS    = '1ZXq4tc08ezjnnC-t8gRbbYslWVIkDhh0';
const FOLDER_POSTADOS = '1jyQlAmuIQnPwu2CE3qP9hyYH-yFl_Uyl';
// ── Série 2: Práticos do Dicionário ──
const FOLDER_DICIO          = '1aoKnGLdlQCAXN6TAhCUnASEtMtRC0IfQ';
const FOLDER_DICIO_POSTADOS = null; // TODO: quando a subpasta "postados" do dicionário existir, colocar o ID aqui
// ── Série 3: Cortes da Live (aguardando pasta + legendas) ──
const FOLDER_LIVE = null;

const HTML_IN   = 'source/headlines.html';
const DICIO_IN  = 'source/dicionario.html';
const HTML_OUT  = 'docs/index.html';

function fetchFolder(id, outFile) {
  execSync(`curl -sL "https://drive.google.com/drive/folders/${id}" -A "Mozilla/5.0" -o "${outFile}"`, { stdio: 'inherit' });
  return fs.readFileSync(outFile, 'utf8');
}

function parseFiles(html) {
  const decoded = html.replace(/&quot;/g, '"');
  const re = /\[null,"([a-zA-Z0-9_-]{25,})"\],null,null,null,"video\/mp4"/g;
  const hits = [];
  let m;
  while ((m = re.exec(decoded)) !== null) hits.push({ id: m[1], pos: m.index });
  const out = [];
  const seen = new Set();
  for (const { id, pos } of hits) {
    if (seen.has(id)) continue;
    const nameMatch = decoded.slice(pos, pos + 5000).match(/"([^"]+\.mp4)"/);
    if (nameMatch) { out.push({ id, name: nameMatch[1] }); seen.add(id); }
  }
  return out;
}

function keyOf(name) {
  let m = name.match(/^PR[ÁA]TICO\s+(\d+)/i);
  if (m) return 'P' + m[1];
  m = name.match(/^MOTIVACIONAL\s+M?(\d+)/i);
  if (m) return 'M' + m[1];
  m = name.match(/^DICIO\s*(\d+)/i);   // aceita "DICIO 2- ..." (hífen colado)
  if (m) return 'D' + m[1];
  return null;
}

const SKIP_FETCH = process.argv.includes('--cached');
let allFiles, postFiles, dicioFiles, dicioPostFiles;
if (SKIP_FETCH && fs.existsSync('drive_files.json') && fs.existsSync('drive_postados.json') && fs.existsSync('drive_dicio.json')) {
  console.log('[1-3/4] Usando cache (drive_files.json / drive_postados.json / drive_dicio.json)');
  allFiles   = JSON.parse(fs.readFileSync('drive_files.json', 'utf8'));
  postFiles  = JSON.parse(fs.readFileSync('drive_postados.json', 'utf8'));
  dicioFiles = JSON.parse(fs.readFileSync('drive_dicio.json', 'utf8'));
  dicioPostFiles = fs.existsSync('drive_dicio_postados.json')
    ? JSON.parse(fs.readFileSync('drive_dicio_postados.json', 'utf8')) : [];
} else {
  console.log('[1/4] Baixando pasta principal...');
  const htmlAll  = fetchFolder(FOLDER_TODOS,    'drive_folder.html');
  console.log('[2/4] Baixando subpasta postados...');
  const htmlPost = fetchFolder(FOLDER_POSTADOS, 'drive_postados.html');
  console.log('[3/4] Baixando pasta do dicionário...');
  const htmlDicio = fetchFolder(FOLDER_DICIO,   'drive_dicio.html');
  allFiles   = parseFiles(htmlAll);
  postFiles  = parseFiles(htmlPost);
  dicioFiles = parseFiles(htmlDicio);
  dicioPostFiles = [];
  if (FOLDER_DICIO_POSTADOS) {
    console.log('[3b/4] Baixando subpasta postados do dicionário...');
    const htmlDicioPost = fetchFolder(FOLDER_DICIO_POSTADOS, 'drive_dicio_postados.html');
    dicioPostFiles = parseFiles(htmlDicioPost);
  }
  fs.writeFileSync('drive_files.json',    JSON.stringify(allFiles,  null, 2));
  fs.writeFileSync('drive_postados.json', JSON.stringify(postFiles, null, 2));
  fs.writeFileSync('drive_dicio.json',    JSON.stringify(dicioFiles, null, 2));
  fs.writeFileSync('drive_dicio_postados.json', JSON.stringify(dicioPostFiles, null, 2));
}

// ── Série 1 (P/M) ──
const gravado = {}, postado = {};
for (const f of allFiles)  { const k = keyOf(f.name); if (k && k[0] !== 'D') gravado[k]  = f; }
for (const f of postFiles) { const k = keyOf(f.name); if (k && k[0] !== 'D') postado[k] = f; }

// ── Série 2 (DICIO) ──
const gravadoD = {}, postadoD = {};
for (const f of dicioFiles)     { const k = keyOf(f.name); if (k && k[0] === 'D') gravadoD[k]  = f; }
for (const f of dicioPostFiles) { const k = keyOf(f.name); if (k && k[0] === 'D') postadoD[k] = f; }

const TOTAL_MAIN  = 30;
const TOTAL_DICIO = 8;

const allRecorded = new Set([...Object.keys(gravado), ...Object.keys(postado)]);
const aguardando  = [...Object.keys(gravado)].filter(k => !postado[k]).length;
const naoGravados = TOTAL_MAIN - allRecorded.size;

const allRecordedD = new Set([...Object.keys(gravadoD), ...Object.keys(postadoD)]);
const aguardandoD  = [...Object.keys(gravadoD)].filter(k => !postadoD[k]).length;
const naoGravadosD = TOTAL_DICIO - allRecordedD.size;

console.log('[4/4] Gerando HTML...');
console.log(`  [P+M]   POSTADOS: ${Object.keys(postado).length} → ${Object.keys(postado).sort().join(', ')}`);
console.log(`  [P+M]   AGUARDANDO: ${aguardando} | NÃO GRAVADOS: ${naoGravados}`);
console.log(`  [DICIO] POSTADOS: ${Object.keys(postadoD).length} → ${Object.keys(postadoD).sort().join(', ')}`);
console.log(`  [DICIO] AGUARDANDO: ${aguardandoD} | NÃO GRAVADOS: ${naoGravadosD}`);

let html = fs.readFileSync(HTML_IN, 'utf8');
let dicioHtml = fs.readFileSync(DICIO_IN, 'utf8');

// Inject viewport meta if missing (essential for mobile rendering)
if (!/<meta\s+name=["']viewport["']/i.test(html)) {
  html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">');
}

// === EXTRAIR HEADLINES OFICIAIS DOS SOURCES ===
// O nome do arquivo no Drive pode ficar defasado — o source é a fonte da verdade
// dos textos; o card exibe a headline do source, não o nome do arquivo.
function typeToKeyPrefix(type) {
  const tu = type.toUpperCase();
  if (tu.startsWith('PR')) return 'P';
  if (tu.startsWith('DICIO')) return 'D';
  return 'M';
}

function extractHeadlines(htmlStr) {
  const out = {};
  const re = /<div class="legenda(?: motivacional)?">\s*<span class="num">(PR[ÁA]TICO|MOTIVACIONAL|DICIO)\s+(\d+)<\/span>[\s\S]*?<div class="headline">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(htmlStr)) !== null) {
    out[typeToKeyPrefix(m[1]) + m[2]] = m[3]
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return out;
}

const headlines  = extractHeadlines(html);
const headlinesD = extractHeadlines(dicioHtml);
console.log(`  Headlines extraídas: ${Object.keys(headlines).length} (P+M) + ${Object.keys(headlinesD).length} (DICIO)`);

const cssInject = `
  /* === SISTEMA DE POSTAGENS === */
  .video-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    margin: -4px 0 14px;
    border-radius: 6px;
    font-size: 13px;
    border: 1px solid #ccc;
  }
  .video-card.postado  { background: #e8f5e9; border-color: #2e7d32; }
  .video-card.gravado  { background: #fff8e6; border-color: #C8A84B; }
  .video-card.pendente { background: #f5f5f5; border-color: #bbb; }

  .video-card .badge {
    color: #fff;
    padding: 4px 10px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .video-card.postado  .badge { background: #2e7d32; }
  .video-card.gravado  .badge { background: #C8A84B; color: #1B2A4A; }
  .video-card.pendente .badge { background: #999; }

  .video-card a.drive-link {
    font-weight: 700;
    text-decoration: none;
    border-bottom: 1px dashed;
    flex: 1;
    word-break: break-word;
    line-height: 1.35;
  }
  .video-card.postado a.drive-link { color: #2e7d32; border-color: #2e7d32; }
  .video-card.gravado a.drive-link { color: #8a6d1f; border-color: #C8A84B; }
  .video-card.postado a.drive-link:hover { color: #1b5e20; }
  .video-card.gravado a.drive-link:hover { color: #5e4910; }

  .video-card .preview-toggle {
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    letter-spacing: 1px;
    font-weight: 700;
  }
  .video-card.postado .preview-toggle { background: #2e7d32; }
  .video-card.gravado .preview-toggle { background: #C8A84B; color: #1B2A4A; }
  .video-card.postado .preview-toggle:hover { background: #1b5e20; }
  .video-card.gravado .preview-toggle:hover { background: #a98c34; }

  .preview-iframe {
    display: none;
    width: 100%;
    height: 480px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: -8px 0 14px;
  }
  .preview-iframe.open { display: block; }

  .legenda { position: relative; }
  .copy-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: #1B2A4A;
    color: #C8A84B;
    border: 1px solid #C8A84B;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    z-index: 5;
  }
  .copy-btn:hover { background: #C8A84B; color: #1B2A4A; }
  .copy-btn.ok { background: #2e7d32 !important; color: #fff !important; border-color: #2e7d32 !important; }
  .copy-btn.err { background: #c62828 !important; color: #fff !important; border-color: #c62828 !important; }

  /* === DASHBOARD === */
  .dashboard {
    background: #fff;
    border: 1px solid #C8A84B;
    border-top: 4px solid #C8A84B;
    padding: 18px 20px;
    margin: 12px 0 28px;
    border-radius: 4px;
  }
  .dash-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 6px;
  }
  .dash-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #1B2A4A;
    text-transform: uppercase;
  }
  .dash-ts { font-size: 11px; color: #888; font-style: italic; }
  .dash-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .dash-cell {
    background: #FBF6E9;
    padding: 12px 8px;
    text-align: center;
    border-radius: 3px;
    border: 1px solid #eee;
  }
  .dash-num {
    font-size: 28px;
    font-weight: 700;
    color: #1B2A4A;
    line-height: 1;
  }
  .dash-of { font-size: 14px; color: #999; font-weight: 400; }
  .dash-label {
    font-size: 9px;
    letter-spacing: 1.2px;
    color: #666;
    text-transform: uppercase;
    margin-top: 6px;
    line-height: 1.3;
  }
  .dash-bar {
    height: 8px;
    background: #f0eadc;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .dash-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #2e7d32 0%, #4caf50 100%);
    transition: width 0.6s ease;
  }
  .dash-list {
    font-size: 12px;
    color: #444;
    line-height: 1.8;
  }
  .dash-list strong { color: #1B2A4A; margin-right: 6px; }
  .dash-pill {
    display: inline-block;
    background: #e8f5e9;
    border: 1px solid #2e7d32;
    color: #2e7d32;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-right: 2px;
  }

  .last-updated {
    text-align: right;
    font-size: 11px;
    color: #888;
    margin: 12px 0 -4px;
    font-style: italic;
  }

  /* === MARCAÇÃO MANUAL (checkbox do Vinícius) === */
  .manual-status {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    margin: 0 0 14px;
    background: #fff;
    border: 2px dashed #C8A84B;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #1B2A4A;
    letter-spacing: 0.5px;
    text-align: left;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .manual-status:hover {
    background: #FBF6E9;
    border-style: solid;
  }
  .manual-status:active {
    transform: scale(0.98);
  }
  .manual-status .ms-check {
    font-size: 22px;
    line-height: 1;
    flex-shrink: 0;
  }
  .manual-status .ms-label {
    flex: 1;
    line-height: 1.3;
  }
  .manual-status .ms-date {
    font-size: 11px;
    font-weight: 400;
    color: #2e7d32;
    font-style: italic;
    letter-spacing: 0;
    flex-shrink: 0;
  }
  .manual-status.checked {
    background: #e8f5e9;
    border: 2px solid #2e7d32;
    border-style: solid;
    color: #1b5e20;
  }
  .manual-status.checked:hover {
    background: #d8ebdb;
  }
  .manual-status.checked .ms-date {
    color: #1b5e20;
    font-weight: 600;
  }

  /* Visual extra quando o bloco está marcado como postado */
  .legenda.manual-checked {
    background: linear-gradient(to right, #f0f9f1 0%, #fff 12%);
    border-left-color: #2e7d32;
  }
  .legenda.motivacional.manual-checked {
    background: linear-gradient(to right, #f0f9f1 0%, #fff 12%);
    border-left-color: #2e7d32;
  }

  /* Tag no dashboard mostrando contagem manual */
  .dash-manual {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #e8f5e9;
    border: 1px solid #2e7d32;
    border-radius: 4px;
    padding: 10px 14px;
    margin-top: 10px;
    font-size: 12px;
    color: #1b5e20;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .dash-manual-count {
    font-size: 16px;
    font-weight: 800;
  }
  .dash-manual-reset {
    background: transparent;
    border: 1px solid #2e7d32;
    color: #1b5e20;
    padding: 4px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 10px;
    letter-spacing: 1px;
    font-weight: 700;
    font-family: inherit;
  }
  .dash-manual-reset:hover {
    background: #2e7d32;
    color: #fff;
  }

  /* === MOBILE === */
  @media (max-width: 720px) {
    body { padding: 12px 8px; line-height: 1.5; }
    .wrap { max-width: 100%; }
    header { padding: 16px 14px; }
    header h1 { font-size: 18px; }
    header p { font-size: 12px; }
    .dashboard { padding: 14px; }
    .dash-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .dash-num { font-size: 22px; }
    .dash-of { font-size: 12px; }
    .dash-label { font-size: 8px; letter-spacing: 1px; }
    .dash-list { font-size: 11px; }
    .dash-pill { font-size: 9px; padding: 2px 6px; }
    .section-title { padding: 12px 14px; font-size: 12px; letter-spacing: 2px; margin: 24px 0 14px; }
    .last-updated { font-size: 10px; text-align: left; }
    .cta-box { padding: 14px 14px; }
    .cta-box h2 { font-size: 12px; }
    .cta-option { font-size: 13px; }

    .legenda { padding: 14px 14px; }
    .legenda .headline { font-size: 14px; padding-bottom: 10px; }
    .legenda .body { font-size: 13px; }
    .legenda .block-title { font-size: 11px; }

    /* Copy button no longer absolute on mobile — stacks at top */
    .copy-btn {
      position: static;
      display: block;
      width: 100%;
      padding: 12px;
      font-size: 13px;
      margin-bottom: 10px;
      box-sizing: border-box;
    }

    /* Video card: stacks badge / link / preview on its own row */
    .video-card {
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 12px;
      font-size: 12px;
    }
    .video-card .badge { font-size: 10px; padding: 4px 8px; }
    .video-card a.drive-link {
      flex: 1 1 100%;
      order: 2;
      font-size: 12px;
      line-height: 1.4;
    }
    .video-card .preview-toggle {
      flex: 0 0 auto;
      order: 3;
      padding: 8px 14px;
      font-size: 11px;
    }
    .video-card .badge { order: 1; }
    .video-card.pendente > span { flex: 1 1 100%; font-size: 12px; }

    .preview-iframe { height: 280px; }

    /* Manual status — botão grande no mobile */
    .manual-status {
      padding: 16px 14px;
      font-size: 13px;
      gap: 10px;
      flex-wrap: wrap;
    }
    .manual-status .ms-check { font-size: 24px; }
    .manual-status .ms-label { font-size: 12px; }
    .manual-status .ms-date {
      flex: 1 1 100%;
      font-size: 10px;
      padding-left: 34px;
    }
    .dash-manual { font-size: 11px; padding: 10px 12px; flex-wrap: wrap; gap: 8px; }
    .dash-manual-count { font-size: 14px; }
  }

  @media (max-width: 420px) {
    .legenda .num { font-size: 10px; padding: 4px 10px; }
    .legenda .tag { display: block; margin: 6px 0 0; }
    .preview-iframe { height: 220px; }
  }

  /* === ABAS (séries) === */
  .tab-bar {
    display: flex;
    gap: 8px;
    position: sticky;
    top: 0;
    z-index: 60;
    background: #FBF6E9;
    padding: 10px 0;
    margin: 0 0 22px;
    border-bottom: 2px solid #C8A84B;
  }
  .tab-btn {
    flex: 1;
    padding: 13px 8px;
    background: #fff;
    border: 1px solid #C8A84B;
    border-radius: 4px;
    color: #1B2A4A;
    font-family: inherit;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 1px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .tab-btn:hover { background: #f4ecd7; }
  .tab-btn.active {
    background: #1B2A4A;
    color: #C8A84B;
    border-color: #1B2A4A;
  }
  .tab-btn .tab-count {
    display: block;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.5px;
    margin-top: 3px;
    opacity: 0.75;
    text-transform: none;
  }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  .coming-soon {
    background: #fff;
    border: 2px dashed #C8A84B;
    border-radius: 6px;
    padding: 48px 24px;
    text-align: center;
    color: #1B2A4A;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1px;
    margin: 10px 0 30px;
  }
  .coming-soon small {
    display: block;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 400;
    color: #888;
    letter-spacing: 0.3px;
    line-height: 1.6;
  }

  /* Breakdown por série no dashboard */
  .dash-series {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #e3d9c2;
  }
  .dash-series-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    letter-spacing: 0.8px;
    color: #555;
    text-transform: uppercase;
    font-weight: 600;
  }
  .dash-series-row b {
    color: #1B2A4A;
    font-size: 13px;
    letter-spacing: 0.5px;
  }

  @media (max-width: 720px) {
    .tab-bar { gap: 5px; padding: 8px 0; }
    .tab-btn { padding: 11px 4px; font-size: 10px; letter-spacing: 0.5px; }
    .tab-btn .tab-count { font-size: 9px; }
    .coming-soon { padding: 36px 16px; font-size: 14px; }
    .dash-series-row { font-size: 10px; }
    .dash-series-row b { font-size: 12px; }
  }
`;
html = html.replace('</style>', cssInject + '\n</style>');

const now = new Date();
const ts = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// === DASHBOARD (agregado das séries + breakdown) ===
function keyLabel(k) {
  if (k[0] === 'P') return 'PRÁTICO ' + k.slice(1);
  if (k[0] === 'M') return 'MOTIVACIONAL ' + k.slice(1);
  return 'DICIO ' + k.slice(1);
}
const seriesOrder = { P: 0, M: 1, D: 2 };
function sortKeys(keys) {
  return keys.sort((a, b) => {
    if (a[0] !== b[0]) return seriesOrder[a[0]] - seriesOrder[b[0]];
    return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
  });
}

const postMain  = Object.keys(postado).length;
const postDicio = Object.keys(postadoD).length;
const totalPostados = postMain + postDicio;
const totalPecas    = TOTAL_MAIN + TOTAL_DICIO;
const aguardandoAgg  = aguardando + aguardandoD;
const naoGravadosAgg = naoGravados + naoGravadosD;
const pctPostados    = Math.round((totalPostados / totalPecas) * 100);

const postadosBadges = sortKeys([...Object.keys(postado), ...Object.keys(postadoD)])
  .map(k => `<span class="dash-pill">${keyLabel(k)}</span>`).join(' ');

const dashboard = `
<div class="dashboard">
  <div class="dash-head">
    <span class="dash-title">PROGRESSO DA POSTAGEM</span>
    <span class="dash-ts">Atualizado em ${ts}</span>
  </div>
  <div class="dash-grid">
    <div class="dash-cell">
      <div class="dash-num">${totalPostados}<span class="dash-of">/${totalPecas}</span></div>
      <div class="dash-label">POSTADOS</div>
    </div>
    <div class="dash-cell">
      <div class="dash-num">${aguardandoAgg}</div>
      <div class="dash-label">GRAVADOS<br>aguardando</div>
    </div>
    <div class="dash-cell">
      <div class="dash-num">${naoGravadosAgg}</div>
      <div class="dash-label">NÃO GRAVADOS</div>
    </div>
    <div class="dash-cell">
      <div class="dash-num">${pctPostados}<span class="dash-of">%</span></div>
      <div class="dash-label">CONCLUÍDO</div>
    </div>
  </div>
  <div class="dash-bar"><div class="dash-bar-fill" style="width:${pctPostados}%"></div></div>
  ${totalPostados > 0 ? `<div class="dash-list"><strong>Já postados (Drive):</strong> ${postadosBadges}</div>` : ''}
  <div class="dash-series">
    <div class="dash-series-row"><span>Práticos + Motivacionais</span><b data-series-val="main">${postMain}/${TOTAL_MAIN}</b></div>
    <div class="dash-series-row"><span>Dicionário Contábil</span><b data-series-val="dicio">${postDicio}/${TOTAL_DICIO}</b></div>
    <div class="dash-series-row"><span>Cortes da Live</span><b data-series-val="live">em preparação</b></div>
  </div>
  <div class="dash-manual">
    <span>✓ MARCADOS POR VOCÊ NO CELULAR: <span class="dash-manual-count" id="manual-count">0</span><span style="opacity:.6;font-weight:600;"> / ${totalPecas}</span></span>
    <button class="dash-manual-reset" onclick="resetManualStatus()" type="button">LIMPAR MARCAÇÕES</button>
  </div>
</div>
`;

const tabBar = `
<div class="tab-bar" role="tablist">
  <button class="tab-btn active" data-tab="main" onclick="switchTab('main')" type="button">Práticos + Motiv.<span class="tab-count">${postMain}/${TOTAL_MAIN} postados</span></button>
  <button class="tab-btn" data-tab="dicio" onclick="switchTab('dicio')" type="button">Dicionário<span class="tab-count">${postDicio}/${TOTAL_DICIO} postados</span></button>
  <button class="tab-btn" data-tab="live" onclick="switchTab('live')" type="button">Cortes da Live<span class="tab-count">em breve</span></button>
</div>
`;

function injectCards(srcHtml, postadoMap, gravadoMap, headlinesMap) {
  return srcHtml.replace(
  /(<div class="legenda(?: motivacional)?">\s*)<span class="num">(PR[ÁA]TICO|MOTIVACIONAL|DICIO)\s+(\d+)<\/span>/g,
  (full, prefix, type, num) => {
    const key = typeToKeyPrefix(type) + num;
    const post = postadoMap[key];
    const grav = gravadoMap[key];
    const cardId = 'iframe_' + key;
    let card;
    // Texto exibido no link do card = headline oficial do source (não o nome do arquivo do Drive)
    const officialHeadline = headlinesMap[key] || `${type} ${num}`;
    const displayText = officialHeadline.length > 110 ? officialHeadline.slice(0, 107) + '...' : officialHeadline;
    const labelPrefix = `${type} ${num} — `;

    if (post) {
      const viewUrl = `https://drive.google.com/file/d/${post.id}/view`;
      const previewUrl = `https://drive.google.com/file/d/${post.id}/preview`;
      card = `<div class="video-card postado" data-drive-status="postado">
        <span class="badge">POSTADO</span>
        <a class="drive-link" href="${viewUrl}" target="_blank" rel="noopener" title="Abrir no Google Drive — arquivo: ${post.name.replace(/"/g, '&quot;')}">${labelPrefix}${displayText}</a>
        <button class="preview-toggle" onclick="togglePreview('${cardId}')">PREVIEW</button>
      </div>
      <iframe class="preview-iframe" id="${cardId}" data-src="${previewUrl}" loading="lazy"></iframe>`;
    } else if (grav) {
      const viewUrl = `https://drive.google.com/file/d/${grav.id}/view`;
      const previewUrl = `https://drive.google.com/file/d/${grav.id}/preview`;
      card = `<div class="video-card gravado" data-drive-status="gravado">
        <span class="badge">GRAVADO</span>
        <a class="drive-link" href="${viewUrl}" target="_blank" rel="noopener" title="Abrir no Google Drive — arquivo: ${grav.name.replace(/"/g, '&quot;')}">${labelPrefix}${displayText}</a>
        <button class="preview-toggle" onclick="togglePreview('${cardId}')">PREVIEW</button>
      </div>
      <iframe class="preview-iframe" id="${cardId}" data-src="${previewUrl}" loading="lazy"></iframe>`;
    } else {
      card = `<div class="video-card pendente" data-drive-status="pendente">
        <span class="badge">NÃO GRAVADO</span>
        <span style="flex:1;color:#888;font-style:italic;">Aguardando aprovação da headline e gravação do vídeo.</span>
      </div>`;
    }
    // Botão de marcação manual (Vinícius marca pelo celular após postar no Instagram)
    const manualBtn = `<button class="manual-status" data-key="${key}" onclick="toggleManualStatus(this)" type="button">
        <span class="ms-check">⬜</span>
        <span class="ms-label">MARCAR COMO POSTADO NO INSTAGRAM</span>
        <span class="ms-date"></span>
      </button>`;
    return `${prefix}<button class="copy-btn" data-key="${key}" onclick="copyLegenda(this)">COPIAR LEGENDA</button><span class="num">${type} ${num}</span>\n      ${card}\n      ${manualBtn}\n      `;
  }
  );
}

// Injeta os cards em cada série (cada uma com seus mapas do Drive)
html      = injectCards(html,      postado,  gravado,  headlines);
dicioHtml = injectCards(dicioHtml, postadoD, gravadoD, headlinesD);

// === MONTAGEM DAS ABAS ===
// Painel 1 (main): envolve o conteúdo existente entre o header e o footer.
// Painéis 2 e 3: inseridos antes do footer.
const painelDicio = `
<section class="tab-panel" id="tab-dicio" data-series="dicio" data-total="${TOTAL_DICIO}" role="tabpanel">
${dicioHtml}
</section>`;

const painelLive = `
<section class="tab-panel" id="tab-live" data-series="live" data-total="0" role="tabpanel">
  <div class="coming-soon">
    🎬 CORTES DA LIVE
    <small>Em preparação — os vídeos e legendas desta série serão adicionados em breve.<br>
    Assim que a pasta do Drive e as legendas estiverem prontas, esta aba será preenchida automaticamente.</small>
  </div>
</section>`;

html = html.replace(/(<\/header>)/, '$1\n' + dashboard + tabBar +
  `<section class="tab-panel active" id="tab-main" data-series="main" data-total="${TOTAL_MAIN}" role="tabpanel">`);
html = html.replace('<footer', '</section>\n' + painelDicio + '\n' + painelLive + '\n<footer');

const jsInject = `
<script>
function togglePreview(id) {
  const f = document.getElementById(id);
  if (!f.src) f.src = f.dataset.src;
  f.classList.toggle('open');
}

// === ABAS (séries) ===
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'tab-' + id);
  });
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === id);
  });
  try { localStorage.setItem('vfz_active_tab', id); } catch (e) {}
  window.scrollTo(0, 0);
}

// === MARCAÇÃO MANUAL (persistência local no celular do Vinícius) ===
var MANUAL_STORE = 'vfz_manual_posted_v1';

function loadManualState() {
  try { return JSON.parse(localStorage.getItem(MANUAL_STORE) || '{}'); }
  catch (e) { return {}; }
}

function saveManualState(state) {
  try { localStorage.setItem(MANUAL_STORE, JSON.stringify(state)); } catch (e) {}
}

function fmtManualDate(iso) {
  try {
    var d = new Date(iso);
    return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
  } catch (e) { return ''; }
}

// Sincroniza o badge/cor do video-card com o estado manual.
// Regra: o card mostra POSTADO se (Drive=postado OU marcado manualmente). Senão, volta ao estado do Drive.
function syncVideoCardWithManual(legenda, isManualChecked) {
  if (!legenda) return;
  var card = legenda.querySelector('.video-card');
  if (!card) return;
  var driveStatus = card.getAttribute('data-drive-status') || 'pendente';
  var finalStatus = (driveStatus === 'postado' || isManualChecked) ? 'postado'
                  : (driveStatus === 'gravado') ? 'gravado'
                  : 'pendente';
  // Atualiza classe (o CSS já cuida das cores)
  card.classList.remove('postado', 'gravado', 'pendente');
  card.classList.add(finalStatus);
  // Atualiza texto do badge
  var badge = card.querySelector('.badge');
  if (badge) {
    if (finalStatus === 'postado')      badge.textContent = 'POSTADO';
    else if (finalStatus === 'gravado') badge.textContent = 'GRAVADO';
    else                                badge.textContent = 'NÃO GRAVADO';
  }
}

function applyManualState(btn, state) {
  var key = btn.dataset.key;
  var entry = state[key];
  var check = btn.querySelector('.ms-check');
  var label = btn.querySelector('.ms-label');
  var date  = btn.querySelector('.ms-date');
  var legenda = btn.closest('.legenda');
  if (entry) {
    btn.classList.add('checked');
    if (legenda) legenda.classList.add('manual-checked');
    if (check) check.innerText = '✅';
    if (label) label.innerText = 'POSTADO NO INSTAGRAM';
    if (date)  date.innerText  = '— em ' + fmtManualDate(entry);
    syncVideoCardWithManual(legenda, true);
  } else {
    btn.classList.remove('checked');
    if (legenda) legenda.classList.remove('manual-checked');
    if (check) check.innerText = '⬜';
    if (label) label.innerText = 'MARCAR COMO POSTADO NO INSTAGRAM';
    if (date)  date.innerText  = '';
    syncVideoCardWithManual(legenda, false);
  }
}

// Recalcula TODOS os números do dashboard considerando Drive + marcações manuais.
// Regras:
//   POSTADOS    = (postados via Drive) ∪ (marcados manualmente)   — sem duplicar
//   AGUARDANDO  = gravados no Drive que ainda NÃO foram marcados como postados (Drive nem manual)
//   NÃO GRAVADO = lê direto do DOM (não muda em tempo real — só muda quando o Drive é re-sincronizado)
//   % CONCLUÍDO = postados / total
function updateDashboardFromManual() {
  var manualState = loadManualState();
  var manualKeys  = Object.keys(manualState);

  // Lê status do Drive a partir do data-drive-status (imutável — ≠ da classe, que muda visualmente)
  var drivePosted   = new Set();
  var driveGravado  = new Set();
  var driveNaoGrav  = new Set();
  document.querySelectorAll('.legenda').forEach(function(leg) {
    var btn  = leg.querySelector('.manual-status');
    var card = leg.querySelector('.video-card');
    if (!btn || !card) return;
    var key = btn.dataset.key;
    var ds  = card.getAttribute('data-drive-status') || 'pendente';
    if (ds === 'postado')      drivePosted.add(key);
    else if (ds === 'gravado') driveGravado.add(key);
    else                       driveNaoGrav.add(key);
  });

  var total = drivePosted.size + driveGravado.size + driveNaoGrav.size; // 30
  if (!total) total = 30;

  // União: postado-no-Drive OU marcado-manualmente
  var postadosSet = new Set();
  drivePosted.forEach(function(k) { postadosSet.add(k); });
  manualKeys.forEach(function(k)  { postadosSet.add(k); });

  // Aguardando = gravado no Drive E não está em "postados" (nem Drive nem manual)
  var aguardando = 0;
  driveGravado.forEach(function(k) { if (!postadosSet.has(k)) aguardando++; });

  var postados = postadosSet.size;
  var naoGravados = driveNaoGrav.size;
  // Se marcou manualmente algo que era "não gravado", deve sair de "não gravado"
  manualKeys.forEach(function(k) { if (driveNaoGrav.has(k)) naoGravados--; });

  var pct = total > 0 ? Math.round((postados / total) * 100) : 0;

  // Atualiza as 4 células do dashboard
  var cells = document.querySelectorAll('.dashboard .dash-cell');
  if (cells[0]) {
    var n0 = cells[0].querySelector('.dash-num');
    if (n0) n0.innerHTML = postados + '<span class="dash-of">/' + total + '</span>';
  }
  if (cells[1]) {
    var n1 = cells[1].querySelector('.dash-num');
    if (n1) n1.textContent = aguardando;
  }
  if (cells[2]) {
    var n2 = cells[2].querySelector('.dash-num');
    if (n2) n2.textContent = naoGravados;
  }
  if (cells[3]) {
    var n3 = cells[3].querySelector('.dash-num');
    if (n3) n3.innerHTML = pct + '<span class="dash-of">%</span>';
  }
  // Barra de progresso
  var bar = document.querySelector('.dash-bar-fill');
  if (bar) bar.style.width = pct + '%';
  // Contador inline da linha de marcações
  var el = document.getElementById('manual-count');
  if (el) el.innerText = manualKeys.length;

  // Breakdown por série (uma linha por aba no dashboard + contagem no botão da aba)
  document.querySelectorAll('.tab-panel[data-series]').forEach(function(panel) {
    var sTotal = parseInt(panel.getAttribute('data-total'), 10) || 0;
    if (!sTotal) return; // série ainda sem conteúdo (ex.: live)
    var sPosted = 0;
    panel.querySelectorAll('.legenda').forEach(function(leg) {
      var mBtn  = leg.querySelector('.manual-status');
      var mCard = leg.querySelector('.video-card');
      if (!mBtn || !mCard) return;
      var ds = mCard.getAttribute('data-drive-status') || 'pendente';
      if (ds === 'postado' || manualState[mBtn.dataset.key]) sPosted++;
    });
    var sName = panel.getAttribute('data-series');
    var valEl = document.querySelector('[data-series-val="' + sName + '"]');
    if (valEl) valEl.textContent = sPosted + '/' + sTotal;
    var tabCount = document.querySelector('.tab-btn[data-tab="' + sName + '"] .tab-count');
    if (tabCount) tabCount.textContent = sPosted + '/' + sTotal + ' postados';
  });
}

function toggleManualStatus(btn) {
  var key = btn.dataset.key;
  var state = loadManualState();
  if (state[key]) { delete state[key]; }
  else { state[key] = new Date().toISOString(); }
  saveManualState(state);
  applyManualState(btn, state);
  updateDashboardFromManual();
}

function resetManualStatus() {
  if (!confirm('Tem certeza que deseja apagar TODAS as marcações manuais? Isso não afeta o Drive — só apaga o que você marcou no celular.')) return;
  saveManualState({});
  document.querySelectorAll('.manual-status').forEach(function(btn) {
    applyManualState(btn, {});
  });
  updateDashboardFromManual();
}

document.addEventListener('DOMContentLoaded', function() {
  var state = loadManualState();
  document.querySelectorAll('.manual-status').forEach(function(btn) {
    applyManualState(btn, state);
  });
  updateDashboardFromManual();
  // Restaura a última aba ativa (salva no celular)
  var savedTab = null;
  try { savedTab = localStorage.getItem('vfz_active_tab'); } catch (e) {}
  if (savedTab && document.getElementById('tab-' + savedTab)) switchTab(savedTab);
});

function buildLegendaText(block) {
  // Iterate direct children of .legenda, skipping UI chrome.
  // Uses the already-rendered DOM so innerText is layout-aware.
  const skipSelector = '.copy-btn, .video-card, .preview-iframe, .num, .tag, .manual-status';
  const parts = [];
  for (const child of block.children) {
    if (child.matches(skipSelector)) continue;
    const t = (child.innerText || child.textContent || '').trim();
    if (t) parts.push(t);
  }
  return parts.join('\\n\\n').replace(/\\n{3,}/g, '\\n\\n').trim();
}

function flash(btn, label, cls) {
  const old = btn.innerText;
  btn.innerText = label;
  btn.classList.add(cls);
  setTimeout(() => { btn.innerText = old; btn.classList.remove(cls); }, 2000);
}

var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function copyViaTextarea(text) {
  // Robust cross-browser fallback. Works on iOS Safari (Range API),
  // Android Chrome, desktop browsers, and file:// origins.
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.contentEditable = 'true';
  ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;font-size:16px;';
  document.body.appendChild(ta);

  if (isIOS) {
    var range = document.createRange();
    range.selectNodeContents(ta);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    ta.setSelectionRange(0, text.length);
  } else {
    ta.focus();
    ta.select();
  }

  var ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

function copyLegenda(btn) {
  // Immediate visual feedback so the user knows the click was received
  var original = btn.innerText;
  btn.innerText = '...';

  var text = buildLegendaText(btn.closest('.legenda'));
  if (!text) { btn.innerText = original; flash(btn, 'ERRO — legenda vazia', 'err'); return; }

  function ok(label)  { btn.innerText = original; flash(btn, label || 'COPIADO ✓', 'ok'); }
  function fail(why)  { btn.innerText = original; flash(btn, 'ERRO ' + (why || ''), 'err'); }

  // Strategy 2: execCommand fallback
  function tryExec() {
    try { if (copyViaTextarea(text)) return ok(); } catch (e) { console.warn('[2/3] exec failed:', e); }
    // Strategy 3: Web Share (opens native share sheet — has "Copy" option)
    if (navigator.share) {
      navigator.share({ text: text }).then(
        function() { ok('ENVIADO ✓'); },
        function(e) { console.warn('[3/3] share failed:', e); fail('— toque longo p/ selecionar'); }
      );
    } else {
      fail('— toque longo p/ selecionar');
    }
  }

  // Strategy 1: Modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      function() { ok(); },
      function(err) { console.warn('[1/3] clipboard failed:', err); tryExec(); }
    );
  } else {
    tryExec();
  }
}
</script>
`;
html = html.replace('</body>', jsInject + '\n</body>');

// === CHANGE DETECTION ===
// Hash content excluding the timestamp (which would change every run)
const crypto = require('crypto');
const contentForHash = html.replace(/Atualizado em [\d/, :-]+/, '').replace(/Última atualização: [\d/, :-]+/, '');
const newHash = crypto.createHash('sha256').update(contentForHash).digest('hex');
const stateFile = '.last_state_hash';
const prevHash = fs.existsSync(stateFile) ? fs.readFileSync(stateFile, 'utf8').trim() : '';

if (!fs.existsSync('docs')) fs.mkdirSync('docs');
fs.writeFileSync(HTML_OUT, html);
console.log('\n✓ HTML gerado em:', HTML_OUT);

const changed = newHash !== prevHash;
fs.writeFileSync(stateFile, newHash);

if (changed) {
  console.log('● Conteúdo mudou desde a última geração (hash diferente)');
} else {
  console.log('○ Conteúdo sem mudanças (hash igual)');
}
// No CI quem decide se commita é o `git status --porcelain`, não o exit code.
// Localmente, exit 0 também é mais simples — basta olhar a saída.
process.exit(0);
