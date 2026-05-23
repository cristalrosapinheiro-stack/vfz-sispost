// diff_check.js — Compara textos das legendas entre FINAL_DOC1 e deploy/index.html
const fs = require('fs');

const src    = fs.readFileSync('_MARKETING/HTML/22_legendas_FINAL_DOC1.html', 'utf8');
const deploy = fs.readFileSync('deploy/index.html', 'utf8');

// Extrai cada bloco .legenda (texto + estrutura, sem CSS/JS injetados)
function extractBlocks(html) {
  const blocks = {};
  // Match each <div class="legenda..."> ... </div> (até o próximo <!-- ============ ou final)
  // Captura tudo dentro do bloco
  const re = /<span class="num">(PR[ÁA]TICO|MOTIVACIONAL)\s+(\d+)<\/span>[\s\S]*?(?=<!-- =|<div class="section-title|<footer|$)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const type = m[1].toUpperCase().startsWith('PR') ? 'P' : 'M';
    const key  = type + m[2];
    // Para comparar, pega apenas o texto dentro de .headline, .opening, .block-title, .block, .closing, .cta-final
    const chunk = m[0];
    const fields = {};
    const fieldRe = /<div class="(headline|opening|block-title|closing|cta-final)">([\s\S]*?)<\/div>/g;
    let f;
    let blockIdx = 0;
    while ((f = fieldRe.exec(chunk)) !== null) {
      let label = f[1];
      if (label === 'block-title') label = 'BT_' + (blockIdx++);
      // Normaliza espaços
      const text = f[2].replace(/\s+/g, ' ').trim();
      fields[label] = text;
    }
    // Captura também o conteúdo do .block (parágrafo logo após cada block-title)
    const blockRe = /<div class="block">\s*<div class="block-title">([\s\S]*?)<\/div>([\s\S]*?)<\/div>/g;
    let b;
    let i = 0;
    while ((b = blockRe.exec(chunk)) !== null) {
      fields['B_' + i + '_title'] = b[1].replace(/\s+/g, ' ').trim();
      fields['B_' + i + '_text']  = b[2].replace(/\s+/g, ' ').trim();
      i++;
    }
    // tag
    const tagM = chunk.match(/<span class="tag">([\s\S]*?)<\/span>/);
    if (tagM) fields.tag = tagM[1].replace(/\s+/g, ' ').trim();
    blocks[key] = fields;
  }
  return blocks;
}

const srcBlocks    = extractBlocks(src);
const deployBlocks = extractBlocks(deploy);

const allKeys = [...new Set([...Object.keys(srcBlocks), ...Object.keys(deployBlocks)])]
  .sort((a,b) => {
    if (a[0] !== b[0]) return a[0] === 'P' ? -1 : 1;
    return parseInt(a.slice(1)) - parseInt(b.slice(1));
  });

let totalDiffs = 0;
let missingInDeploy = 0;
let missingInSrc = 0;

for (const key of allKeys) {
  const s = srcBlocks[key]    || {};
  const d = deployBlocks[key] || {};
  if (!srcBlocks[key])    { console.log(`❌ ${key}: AUSENTE no FINAL_DOC1`);    missingInSrc++; continue; }
  if (!deployBlocks[key]) { console.log(`❌ ${key}: AUSENTE no deploy/index.html`); missingInDeploy++; continue; }

  const fieldKeys = [...new Set([...Object.keys(s), ...Object.keys(d)])];
  const diffs = [];
  for (const fk of fieldKeys) {
    if (s[fk] !== d[fk]) {
      diffs.push({ field: fk, src: s[fk], deploy: d[fk] });
    }
  }
  if (diffs.length) {
    totalDiffs += diffs.length;
    console.log(`\n⚠️  ${key} — ${diffs.length} diferença(s):`);
    for (const dif of diffs) {
      console.log(`  Campo: ${dif.field}`);
      console.log(`    FINAL_DOC1: "${(dif.src || '').slice(0, 200)}${(dif.src||'').length>200?'...':''}"`);
      console.log(`    DEPLOY    : "${(dif.deploy || '').slice(0, 200)}${(dif.deploy||'').length>200?'...':''}"`);
    }
  }
}

console.log(`\n=== RESUMO ===`);
console.log(`Blocos no FINAL_DOC1: ${Object.keys(srcBlocks).length}`);
console.log(`Blocos no deploy   : ${Object.keys(deployBlocks).length}`);
console.log(`Total de diferenças textuais: ${totalDiffs}`);
console.log(`Ausentes no deploy: ${missingInDeploy}`);
console.log(`Ausentes no FINAL_DOC1: ${missingInSrc}`);

if (totalDiffs === 0 && missingInDeploy === 0 && missingInSrc === 0) {
  console.log(`\n✅ TODOS OS TEXTOS BATEM EXATAMENTE!`);
}
