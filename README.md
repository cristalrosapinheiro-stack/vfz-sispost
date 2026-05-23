# vfz-sispost

Sistema de Postagens dos Reels do **Prof. Vinícius Ferraz** — Fluência Contábil.

## O que é

Um site estático único (`docs/index.html`) que serve como **painel de controle** para o gerenciamento dos 30 Reels (22 Práticos + 8 Motivacionais):

- **Status automático** de cada vídeo via leitura das pastas do Google Drive (POSTADO / GRAVADO / NÃO GRAVADO)
- **Botão COPIAR LEGENDA** otimizado para iOS Safari e Android (clipboard API + fallbacks)
- **Botão MARCAR COMO POSTADO NO INSTAGRAM** com persistência no localStorage do celular
- **Dashboard reativo**: contadores e barra de progresso atualizam em tempo real ao marcar
- **Preview embutido** dos vídeos via iframe do Drive
- **Responsivo** para uso majoritário em iPhone e Android

## Como funciona a atualização diária

1. `update.js` baixa as duas pastas do Drive (todos + postados) via `curl`
2. Mapeia cada arquivo `.mp4` para uma chave (`P1..P22`, `M1..M8`) pelo nome
3. Lê `source/headlines.html` (versão final dos textos das legendas) como template
4. Injeta CSS, dashboard, video-cards, copy-buttons, checkbox manual e JS
5. Grava em `docs/index.html` (servido pelo GitHub Pages)

## Estrutura

```
.
├── .github/workflows/daily-update.yml  ← cron 1x/dia + botão manual
├── source/headlines.html                ← texto-fonte das 30 legendas
├── update.js                            ← gerador
├── docs/index.html                      ← saída (servida pelo Pages)
├── drive_files.json                     ← snapshot da pasta principal do Drive
├── drive_postados.json                  ← snapshot da subpasta "postados"
└── diff_check.js                        ← verifica fidelidade textual vs source
```

## Como rodar localmente

```bash
npm run update          # baixa Drive + gera HTML
npm run update:cached   # usa os JSONs em cache (não baixa Drive)
```

Abra `docs/index.html` no navegador para ver o resultado.

## Automação

O workflow `.github/workflows/daily-update.yml`:

- Roda diariamente às **10:00 UTC** (07:00 BRT)
- Pode ser disparado manualmente em **Actions → Daily update → Run workflow**
- Se o Drive mudou, commita as alterações em `docs/index.html` e o GitHub Pages serve a nova versão automaticamente
- Se nada mudou, não commita (mantém histórico limpo)

## Tecnologia

- Node.js (sem dependências externas — só `child_process`, `fs`, `crypto`)
- `curl` para scraping do Drive (mais confiável que `https.get` para o HTML do Drive)
- HTML/CSS/JS vanilla — zero build, zero dependências runtime
- Hospedagem: GitHub Pages (grátis)
