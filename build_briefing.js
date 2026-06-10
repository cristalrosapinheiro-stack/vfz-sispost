// build_briefing.js
// Gera um HTML único `briefing.html` que combina:
//   1) Um briefing visual completo para o Claude Design (contexto da marca,
//      o que manter intacto, o que melhorar, restrições técnicas)
//   2) O sistema atual `docs/index.html` embarcado integralmente
//
// Rode sempre que `docs/index.html` mudar:
//   node build_briefing.js

const fs = require('fs');

const DOCS = 'docs/index.html';
const OUT  = 'briefing.html';

if (!fs.existsSync(DOCS)) {
  console.error(`✗ Não encontrei ${DOCS}. Rode "node update.js --cached" antes.`);
  process.exit(1);
}

const docsHtml = fs.readFileSync(DOCS, 'utf8');

// Extrai <style> e o conteúdo do <body> do sistema atual
const styleMatch = docsHtml.match(/<style>([\s\S]*?)<\/style>/);
const bodyMatch  = docsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);

if (!styleMatch || !bodyMatch) {
  console.error('✗ Não consegui extrair <style> ou <body> de docs/index.html');
  process.exit(1);
}

const systemCss  = styleMatch[1];
const systemBody = bodyMatch[1];

const briefingCss = `
/* ====== ESTILO DO BRIEFING (parte de cima do arquivo) ====== */
.briefing-doc {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 32px 64px;
  background: #fff;
  color: #1B2A4A;
  line-height: 1.65;
  font-size: 15px;
}
.briefing-doc h1 {
  color: #C8A84B;
  border-bottom: 4px solid #C8A84B;
  padding-bottom: 12px;
  margin: 0 0 8px;
  font-size: 26px;
  letter-spacing: 0.5px;
}
.briefing-doc h2 {
  color: #1B2A4A;
  margin: 36px 0 14px;
  font-size: 19px;
  border-left: 5px solid #C8A84B;
  padding: 4px 0 4px 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.briefing-doc h3 {
  color: #1B2A4A;
  margin: 22px 0 10px;
  font-size: 15px;
  letter-spacing: 0.5px;
}
.briefing-doc p, .briefing-doc li { color: #2c3450; }
.briefing-doc ul, .briefing-doc ol { margin: 10px 0 16px 22px; }
.briefing-doc li { margin-bottom: 6px; }
.briefing-doc code {
  background: #f4f1e3;
  color: #1B2A4A;
  padding: 2px 7px;
  border-radius: 3px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}
.briefing-doc pre {
  background: #1B2A4A;
  color: #FBF6E9;
  padding: 16px 18px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 12px 0 18px;
}
.briefing-doc .meta {
  background: #FBF6E9;
  padding: 16px 20px;
  border-left: 4px solid #C8A84B;
  margin: 20px 0 28px;
  font-size: 14px;
  border-radius: 0 3px 3px 0;
}
.briefing-doc .meta strong { color: #1B2A4A; }
.briefing-doc .keep {
  background: #fff5e6;
  border: 1px solid #f0a020;
  border-left: 4px solid #f0a020;
  border-radius: 0 3px 3px 0;
  padding: 16px 20px;
  margin: 14px 0;
}
.briefing-doc .keep .label {
  display: inline-block;
  background: #f0a020;
  color: #fff;
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}
.briefing-doc .improve {
  background: #e8f5e9;
  border: 1px solid #2e7d32;
  border-left: 4px solid #2e7d32;
  border-radius: 0 3px 3px 0;
  padding: 16px 20px;
  margin: 14px 0;
}
.briefing-doc .improve .label {
  display: inline-block;
  background: #2e7d32;
  color: #fff;
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}
.briefing-doc .swatches {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0 18px;
}
.briefing-doc .swatch {
  width: 130px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  font-size: 12px;
}
.briefing-doc .swatch .color { height: 56px; }
.briefing-doc .swatch .info { padding: 8px 10px; background: #fff; }
.briefing-doc .swatch .info strong { display: block; }
.briefing-doc .swatch .info code { font-size: 11px; padding: 1px 4px; }
.briefing-divider {
  background: linear-gradient(90deg, #1B2A4A 0%, #2a3d6b 100%);
  color: #C8A84B;
  text-align: center;
  padding: 28px 20px;
  margin: 60px 0 0;
  font-weight: 700;
  letter-spacing: 4px;
  font-size: 13px;
  font-family: 'Segoe UI', sans-serif;
  border-top: 4px solid #C8A84B;
  border-bottom: 4px solid #C8A84B;
}
.briefing-divider .sub {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 400;
  opacity: 0.7;
  color: #FBF6E9;
}
.briefing-toc {
  background: #FBF6E9;
  padding: 16px 22px;
  border-radius: 4px;
  margin: 20px 0 30px;
  font-size: 14px;
}
.briefing-toc ol { margin: 8px 0 0 22px; }
`;

const briefingBody = `
<div class="briefing-doc">

<h1>BRIEFING — Redesenho do Sistema de Postagens (vfz-sispost)</h1>

<div class="meta">
<strong>PARA:</strong> Claude Design<br>
<strong>DE:</strong> Renan (operador) + Prof. Vinícius Ferraz (autoridade técnica)<br>
<strong>PROJETO:</strong> Sistema de Postagens — Fluência Contábil<br>
<strong>STACK:</strong> HTML + CSS + JS vanilla, single-file, GitHub Pages<br>
<strong>OBJETIVO:</strong> redesenhar visualmente este sistema sem quebrar funcionalidade.
</div>

<div class="briefing-toc">
<strong>ÍNDICE</strong>
<ol>
  <li>O que eu preciso de você</li>
  <li>Contexto da marca (Fluência Contábil)</li>
  <li>O que o sistema faz hoje</li>
  <li>O que MANTER intacto (contratos)</li>
  <li>O que MELHORAR (direção criativa)</li>
  <li>Restrições técnicas</li>
  <li>Como entregar</li>
  <li>Sistema atual embarcado (logo abaixo deste briefing)</li>
</ol>
</div>

<h2>1. O que eu preciso de você</h2>
<p>
Pegue o sistema atual (anexado abaixo neste mesmo arquivo, totalmente
funcional — pode interagir) e faça um <strong>redesenho visual/UX completo</strong>,
mantendo TODA a funcionalidade intacta, mas elevando para padrão
"premium / Apple-like". O usuário final é o próprio Prof. Vinícius
e o operador (Renan), que usam diariamente no celular para gerenciar
postagens dos Reels.
</p>

<h2>2. Contexto da marca — Fluência Contábil</h2>

<h3>Quem é o Prof. Vinícius Ferraz</h3>
<ul>
  <li>Auditor Fiscal do ISS-RJ</li>
  <li>Analista do Senado Federal</li>
  <li>3.000+ alunos formados em contabilidade para concursos fiscais</li>
  <li>Método autoral "Fluência Contábil" (entender em vez de decorar)</li>
</ul>

<h3>Público-alvo dos Reels</h3>
<p>
Candidatos a concursos fiscais (Receita Federal, Sefazes, TCs, Senado,
TRTs) que se sentem reféns da contabilidade — em geral travam em
lançamentos, CPCs e DRE.
</p>

<h3>Tom de voz</h3>
<p>
Provocativo, autoridade, polarização cirúrgica, "capital erótico",
FOMO, gancho de curiosidade no final. <strong>Sempre técnico e fiel à
norma</strong> — nunca sensacionalista. Lê o slide e a aula como um
auditor fiscal lendo um lançamento errado.
</p>

<h3>Paleta oficial</h3>
<div class="swatches">
  <div class="swatch">
    <div class="color" style="background:#1B2A4A"></div>
    <div class="info"><strong>Navy primário</strong><code>#1B2A4A</code></div>
  </div>
  <div class="swatch">
    <div class="color" style="background:#C8A84B"></div>
    <div class="info"><strong>Dourado mostarda</strong><code>#C8A84B</code></div>
  </div>
  <div class="swatch">
    <div class="color" style="background:#FBF6E9"></div>
    <div class="info"><strong>Creme (fundo)</strong><code>#FBF6E9</code></div>
  </div>
  <div class="swatch">
    <div class="color" style="background:#CC0000"></div>
    <div class="info"><strong>Vermelho institucional</strong><code>#CC0000</code><br><em>só motivacionais</em></div>
  </div>
  <div class="swatch">
    <div class="color" style="background:#2e7d32"></div>
    <div class="info"><strong>Verde POSTADO</strong><code>#2e7d32</code></div>
  </div>
</div>

<h3>Tipografia</h3>
<p>
Sans-serif moderna. Hoje usa Segoe UI / Helvetica Neue (system fonts).
Você pode propor Inter, SF Pro, ou outra system font — desde que NÃO
adicione web fonts externos (restrição: arquivo único, zero rede).
</p>

<h2>3. O que o sistema FAZ hoje</h2>
<ol>
  <li><strong>Status automático de cada Reel</strong> via leitura das duas pastas do
    Google Drive — POSTADO (subpasta "postados"), GRAVADO (pasta principal),
    NÃO GRAVADO (ausente).</li>
  <li><strong>Botão "COPIAR LEGENDA"</strong> que copia a legenda formatada para a
    área de transferência (compatível com iOS Safari, Android, desktop).</li>
  <li><strong>Botão "MARCAR COMO POSTADO NO INSTAGRAM"</strong> — checkbox manual
    que o Vinícius marca pelo celular ao postar. Persiste em <code>localStorage</code>.</li>
  <li><strong>Dashboard reativo POR ABA</strong>: cada aba tem seu próprio dashboard
    no topo (título "PROGRESSO — [SÉRIE]") com 4 contadores da série (POSTADOS,
    GRAVADOS aguardando, NÃO GRAVADOS, % CONCLUÍDO) + barra de progresso +
    contador de marcações manuais + botão LIMPAR MARCAÇÕES que limpa só aquela série.</li>
  <li><strong>Preview embutido</strong> do vídeo via iframe do Drive (lazy load).</li>
  <li><strong>Sincronização badge ↔ checkbox</strong>: ao marcar manual, o badge
    "GRAVADO" (dourado) vira "POSTADO" (verde) na hora. Ao desmarcar, volta
    pro estado do Drive.</li>
</ol>

<h2>4. O que NÃO MUDAR (contratos críticos)</h2>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.1 — Textos dos 30 blocos.</strong>
São os 22 Práticos + 8 Motivacionais. Vêm de <code>source/headlines.html</code>
e são injetados pelo <code>update.js</code>. Estrutura: <code>&lt;div class="legenda"&gt;</code>
(ou <code>"legenda motivacional"</code>) contendo:
<code>.num</code>, <code>.tag</code>, <code>.headline</code>, <code>.body</code> (com <code>.opening</code>,
múltiplos <code>.block</code> > <code>.block-title</code>, <code>.closing</code>, <code>.cta-final</code>).</p>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.2 — Funções JS por nome:</strong></p>
<pre>copyLegenda(btn)              togglePreview(id)
toggleManualStatus(btn)       resetManualStatus(seriesId)
updateDashboardFromManual()   syncVideoCardWithManual(legenda, isManual)
buildLegendaText(block)       copyViaTextarea(text)
loadManualState()             saveManualState(state)
applyManualState(btn, state)  fmtManualDate(iso)
flash(btn, label, cls)        switchTab(id)</pre>
<p>Pode refatorar internamente, mas mantenha os nomes públicos e contratos.</p>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.2b — Sistema de ABAS (3 séries).</strong>
O sistema tem 3 abas: <code>#tab-main</code> (22 Práticos + 8 Motivacionais),
<code>#tab-dicio</code> (8 Práticos do Dicionário) e <code>#tab-live</code>
(Cortes da Live — placeholder "em preparação" por enquanto). Contratos:</p>
<ul>
  <li>Painéis: <code>&lt;section class="tab-panel" id="tab-{id}" data-series="{id}" data-total="{N}"&gt;</code> — o JS lê <code>data-series</code> e <code>data-total</code> para recalcular os dashboards.</li>
  <li>Botões: <code>.tab-btn[data-tab="{id}"]</code> com filho <code>.tab-count</code> (contagem ao vivo).</li>
  <li>Aba ativa persiste em localStorage na chave <code>vfz_active_tab</code>.</li>
  <li><strong>Cada aba tem seu próprio dashboard</strong>: <code>.dashboard[data-dash="{id}"]</code> DENTRO do painel da série, com células <code>.dash-cell .dash-num</code>, barra <code>.dash-bar-fill</code> e contador <code>.dash-manual-count</code>. O JS atualiza por painel.</li>
  <li>Visual das abas é seu playground — estrutura/atributos não.</li>
</ul>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.3 — Chave localStorage:</strong> <code>vfz_manual_posted_v1</code>
(formato: <code>{ "P1": "2026-05-22T14:30:00.000Z", ... }</code>).
Não renomear nem mudar formato — usuários já têm estado salvo.</p>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.4 — Cascata de cópia (3 estratégias):</strong></p>
<ol>
  <li><code>navigator.clipboard.writeText</code> (modern API)</li>
  <li><code>document.execCommand('copy')</code> via textarea + Range API (iOS Safari)</li>
  <li><code>navigator.share</code> (Web Share API — fallback final)</li>
</ol>
<p>Já validado em iPhone Safari 13.4+ e Android Chrome. Não simplifique.</p>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.5 — Atributo <code>data-drive-status</code></strong> em cada
<code>.video-card</code> (valores: <code>postado</code>, <code>gravado</code>,
<code>pendente</code>). É a fonte da verdade do Drive — o JS lê dele, não
da classe CSS (que muda visualmente quando o usuário marca manual).</p>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.6 — Pontos de injeção no template <code>source/headlines.html</code>:</strong>
o <code>update.js</code> usa regex para substituir cada <code>&lt;div class="legenda..."&gt;&lt;span class="num"&gt;PRÁTICO N&lt;/span&gt;</code>
inserindo o copy-btn, video-card e checkbox. Se você mudar drasticamente a
estrutura HTML, vai quebrar o update.js — me avise no resultado quais ajustes
preciso fazer no update.js (ou comente os pontos de injeção com
<code>&lt;!-- INJECT:CARD --&gt;</code> e <code>&lt;!-- INJECT:DASHBOARD --&gt;</code>).</p>
</div>

<div class="keep">
<span class="label">⚠ MANTER INTACTO</span>
<p><strong>4.7 — Seletores CSS usados pelo JS:</strong></p>
<pre>.legenda, .legenda.motivacional
.video-card, .video-card.postado, .video-card.gravado, .video-card.pendente
.copy-btn, .copy-btn.ok, .copy-btn.err
.manual-status, .manual-status.checked
.legenda.manual-checked
.dashboard[data-dash], .dash-cell, .dash-num, .dash-bar-fill, .dash-manual-count
.preview-iframe, .preview-iframe.open
.preview-toggle, .badge, .drive-link
.num, .tag, .headline, .body, .opening, .block, .block-title, .closing, .cta-final
.ms-check, .ms-label, .ms-date</pre>
<p>Pode adicionar classes novas, mas mantenha essas (o JS faz <code>querySelector</code>).</p>
</div>

<h2>5. O que MELHORAR (direção criativa, liberdade total aqui)</h2>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.1 — Hierarquia visual.</strong> Hoje todo bloco tem peso parecido.
Destaque o que importa: status (badge), ação principal (copiar legenda + marcar
postado), e o dashboard.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.2 — Microinterações.</strong> Hover, toque, transição entre
estados (gravado → postado, com easing). Feedback visual claro ao copiar
(hoje muda só texto do botão). Considere micro-animações tipo confete
discreto, scale up momentâneo, etc — sem virar carnaval.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.3 — Tipografia.</strong> Variar pesos (300/400/600/700), escala
mais marcada entre h1/h2/headline/body. Hoje é tudo meio achatado.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.4 — Espaçamento.</strong> Mais ar, melhor ritmo vertical entre
blocos. Hoje tá um pouco apertado, principalmente no mobile.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.5 — Dashboards (um por aba).</strong> Reimagine visualmente. Cada
aba tem o seu, com os 4 contadores da série (POSTADOS, AGUARDANDO, NÃO GRAVADO, %)
+ barra + linha de marcações manuais + LIMPAR MARCAÇÕES da série. O visual pode
mudar totalmente (donuts radiais, ring charts SVG, etc.), desde que continue um
dashboard por aba e os seletores do item 4.2b funcionem. Mantenha responsivo.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.6 — Dark mode</strong> (opcional). Toggle no header.
Considera que a paleta é muito navy/dourado — vai ficar lindo em dark.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.7 — Iconografia.</strong> Use SVG inline (não emoji) para
precisão visual. Hoje uso ⬜/✅ — substitua por checkboxes desenhados.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.8 — Botões mobile.</strong> Mais "tactile feel" — toque grande
(min 44pt iOS), feedback visual claro, anti-double-tap, sem highlight azul
padrão do mobile (<code>-webkit-tap-highlight-color: transparent</code>).</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.9 — Acessibilidade.</strong> <code>aria-label</code> nos botões,
foco visível, contraste WCAG AA, <code>role</code> apropriados, navegação
por teclado.</p>
</div>

<div class="improve">
<span class="label">✓ MELHORAR</span>
<p><strong>5.10 — Filtros/busca (opcional).</strong> Hoje a página é uma
lista longa. Pode adicionar filtros sticky (Todos / Postados / Aguardando)
e busca por texto. Mas só se não comprometer simplicidade.</p>
</div>

<h2>6. Restrições técnicas</h2>
<ul>
  <li><strong>HTML/CSS/JS vanilla puro.</strong> Zero frameworks (React, Vue, jQuery, Tailwind CDN — nada).</li>
  <li><strong>Single-file:</strong> tudo num único <code>index.html</code> (servido pelo GitHub Pages).</li>
  <li><strong>Compatibilidade:</strong> iOS Safari 13.4+, Android Chrome modernos, Edge/Firefox/Chrome desktop.</li>
  <li><strong>Tamanho:</strong> idealmente abaixo de 200 KB.</li>
  <li><strong>Sem chamadas de rede externas</strong> (exceto os iframes do Drive — esses já existem).</li>
  <li><strong>Sem web fonts externos</strong> (use system fonts ou base64 inline se quiser muito).</li>
  <li><strong>Sem build step:</strong> abriu no navegador, funciona.</li>
</ul>

<h2>7. Como entregar</h2>
<p>Devolva UM ÚNICO HTML com todas as melhorias aplicadas. Eu vou:</p>
<ol>
  <li>Trocar <code>docs/index.html</code> do repo pelo seu output</li>
  <li>Atualizar o <code>update.js</code> se você sinalizou mudanças nos pontos de injeção</li>
  <li>Commitar e o GitHub Pages atualiza automaticamente</li>
</ol>
<p>Se você precisar que eu mude algo no <code>update.js</code> (gerador Node que
preenche este HTML com dados do Drive), liste claramente no fim do seu output:
quais regex/templates eu preciso ajustar.</p>

<h2>8. Sistema atual embarcado (abaixo deste briefing)</h2>
<p>
A partir do divisor abaixo, você verá o sistema atual rodando integralmente.
Pode tocar nos botões, marcar/desmarcar, abrir previews, copiar legendas —
está tudo funcional. Use como referência viva de comportamento.
</p>
<p>
<strong>Quando entregar o redesenho, mantenha:</strong> os 30 blocos (texto exato),
todas as funções JS, todos os seletores CSS, e a lógica de localStorage.
<strong>Tudo o resto é seu playground criativo.</strong>
</p>

</div>

<div class="briefing-divider">
═══════ FIM DO BRIEFING ═══════
<span class="sub">A PARTIR DAQUI: SISTEMA ATUAL FUNCIONANDO INTEGRALMENTE</span>
</div>

${systemBody}
`;

const out = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BRIEFING + Sistema vfz-sispost — para Claude Design</title>
<style>
${briefingCss}
/* ====== ESTILO DO SISTEMA ATUAL (extraído de docs/index.html) ====== */
${systemCss}
</style>
</head>
<body>
${briefingBody}
</body>
</html>
`;

fs.writeFileSync(OUT, out);
const sizeKB = (out.length / 1024).toFixed(1);
console.log(`✓ Gerado: ${OUT}  (${sizeKB} KB)`);
console.log(`  → Anexe este arquivo no Claude Design.`);
