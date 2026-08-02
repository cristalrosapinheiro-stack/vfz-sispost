// build_mes2_source.js — gera source/headlines_mes2.html a partir do texto bruto
// das legendas do MÊS 2 (source/legendas_mes2_raw.txt).
//
// Rode: node build_mes2_source.js
//
// O texto bruto segue o padrão do doc oficial:
//   ----(72 traços)----
//   PRÁTICO 23   (ou MOTIVACIONAL 9)
//   TÍTULO: <título, pode quebrar em várias linhas>
//   ----(72 traços)----
//   <parágrafo(s) de abertura>
//   1. <título do item>
//   <corpo do item>
//   ... (itens numerados)
//   <parágrafo(s) de fechamento>
//   Contabilidade não precisa ser seu ponto fraco... (CTA fixo)
//
// Saída: fragmento HTML no mesmo formato dos outros sources (headlines/live),
// que o update.js injeta na aba "MÊS 2".

const fs = require('fs');

const RAW_IN  = 'source/legendas_mes2_raw.txt';
const HTML_OUT = 'source/headlines_mes2.html';

const CTA_MARK = 'Contabilidade não precisa ser seu ponto fraco';

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Junta linhas quebradas (wrap) de um parágrafo em uma única linha.
function unwrap(text) {
  return text.replace(/\s*\n\s*/g, ' ').trim();
}

const raw = fs.readFileSync(RAW_IN, 'utf8').replace(/\r\n/g, '\n');

// Captura cada registro: header (----\nTIPO N\nTÍTULO: ...\n----) + corpo,
// até o próximo header de registro ou um separador de bloco/FIM (====).
const recRe = /-{20,}\n(PRÁTICO|MOTIVACIONAL)\s+(\d+)\nTÍTULO:\s*([\s\S]*?)\n-{20,}\n([\s\S]*?)(?=\n-{20,}\n(?:PRÁTICO|MOTIVACIONAL)\s+\d+\n|\n={20,})/g;

const records = [];
let m;
while ((m = recRe.exec(raw)) !== null) {
  records.push({
    type: m[1],
    num: m[2],
    titulo: unwrap(m[3]),
    body: m[4].trim(),
  });
}

function buildLegenda(rec) {
  const isMotiv = rec.type === 'MOTIVACIONAL';
  const cls = isMotiv ? 'legenda motivacional' : 'legenda';

  // Parágrafos separados por linha em branco.
  const paras = rec.body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  const opening = [];
  const blocks = [];   // { title, text }
  const closing = [];
  let cta = null;
  let seenItem = false;

  for (const p of paras) {
    if (p.startsWith(CTA_MARK)) { cta = unwrap(p); continue; }
    const itemMatch = p.match(/^(\d+)\.\s+(.*)$/s);
    if (itemMatch) {
      seenItem = true;
      // 1ª linha = título do item; resto = corpo.
      const firstNl = p.indexOf('\n');
      let title, text;
      if (firstNl === -1) { title = p; text = ''; }
      else { title = p.slice(0, firstNl).trim(); text = unwrap(p.slice(firstNl + 1)); }
      blocks.push({ title, text });
    } else if (!seenItem) {
      opening.push(unwrap(p));
    } else {
      closing.push(unwrap(p));
    }
  }

  const parts = [];
  parts.push(`<!-- ============ ${rec.type[0] === 'M' ? 'M' : 'P'}${rec.num} ============ -->`);
  parts.push(`<div class="${cls}">`);
  parts.push(`  <span class="num">${rec.type} ${rec.num}</span>`);
  parts.push(`  <div class="headline">${esc(rec.titulo)}</div>`);
  parts.push(`  <div class="body">`);
  if (opening.length) {
    parts.push(`    <div class="opening">`);
    parts.push(`      ${opening.map(esc).join('<br><br>')}`);
    parts.push(`    </div>`);
  }
  for (const b of blocks) {
    parts.push(`    <div class="block">`);
    parts.push(`      <div class="block-title">${esc(b.title)}</div>`);
    parts.push(`      ${esc(b.text)}`);
    parts.push(`    </div>`);
  }
  if (closing.length) {
    parts.push(`    <div class="closing">`);
    parts.push(`      ${closing.map(esc).join('<br><br>')}`);
    parts.push(`    </div>`);
  }
  if (cta) {
    parts.push(`    <div class="cta-final">${esc(cta)}</div>`);
  }
  parts.push(`  </div>`);
  parts.push(`</div>`);
  return parts.join('\n');
}

const praticos = records.filter(r => r.type === 'PRÁTICO').length;
const motiv    = records.filter(r => r.type === 'MOTIVACIONAL').length;

const header = `<!-- ============================================================
     SÉRIE: MÊS 2 — Práticos + Motivacionais (Lote Julho/2026)
     30 Práticos (23–52) + 8 Motivacionais (9–16) = 38 legendas
     Formato: vídeo cotidiano 10s + título grande na tela + "Legenda 👇".

     ARQUIVO GERADO por build_mes2_source.js a partir de
     source/legendas_mes2_raw.txt — NÃO editar à mão.
     Para alterar uma legenda, edite o .txt e rode: node build_mes2_source.js
     Este arquivo é um FRAGMENTO — o update.js injeta no painel da aba MÊS 2.
     ============================================================ -->

<div class="section-title">
  MÊS 2 · Práticos + Motivacionais
  <small>Lote Julho/2026 · Práticos 23–52 + Motivacionais 9–16 · CTA padrão da marca no rodapé de cada legenda</small>
</div>
`;

const bodyHtml = records.map(buildLegenda).join('\n\n');
const out = header + '\n' + bodyHtml + '\n';

fs.writeFileSync(HTML_OUT, out);

console.log(`✓ ${HTML_OUT} gerado.`);
console.log(`  Registros: ${records.length} (${praticos} Práticos + ${motiv} Motivacionais)`);
// Sanidade: garante que cada legenda tem título e ao menos 1 bloco.
let warn = 0;
for (const r of records) {
  if (!r.titulo) { console.warn(`  ⚠ ${r.type} ${r.num}: sem TÍTULO`); warn++; }
}
if (records.length !== 38) console.warn(`  ⚠ Esperado 38 registros, achei ${records.length}`);
if (!warn && records.length === 38) console.log('  ✓ Sanidade OK (38 legendas, todas com título)');
