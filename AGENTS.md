# MegaSena Monitor — AGENTS.md

## Overview

App desktop offline-first para gerenciar apostas da Mega-Sena com privacidade total (dados 100% locais).
Stack: React 19 + TypeScript + Tailwind v4 (Vite 7) no frontend; Tauri 2 (Rust) + SQLite (`rusqlite`) no backend; `reqwest` para a API da Caixa, com fallback para `api.guidi.dev.br`.

Documentação: [`_docs/INDEX.md`](_docs/INDEX.md). Estado factual: [`_docs/arquitetura/AS_IS.md`](_docs/arquitetura/AS_IS.md). Regras: [`_docs/POLITICA_DOCS.md`](_docs/POLITICA_DOCS.md).

**`docs/design/UI_figma/` não é documentação** — é protótipo React exportado do Figma Make. Não editar como se fosse o app.

## Setup / Build / Test

```bash
npm install              # deps do frontend
npm run dev              # frontend em dev (Vite)
npm run tauri dev        # app completo (frontend + backend Rust)
npm run build            # tsc && vite build
npm run tauri build      # executável nativo (macOS/Windows/Linux)
```

Rust: `cd src-tauri && cargo build` / `cargo test` para o backend.

> **`cargo` não está instalado nesta máquina.** Build e teste do backend não rodam até que Rust seja instalado — [`_docs/BACKLOG.md` item 4](_docs/BACKLOG.md).

Versão: `package.json`, `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml` devem andar juntos. **Hoje não andam** — 1.0.2, 1.0.2 e 0.1.0.

## Code style

- TypeScript no frontend; Rust no `src-tauri/`.
- Tailwind v4 é o padrão de estilo deste projeto (diferente de outros do workspace que banem Tailwind).
- IPC frontend↔Rust via `@tauri-apps/api`. Acesso a SQLite só pelo backend Rust.

## Testing

- Rust: `cd src-tauri && cargo test`.
- Sem suite de teste de frontend definida — validar via `npm run tauri dev`.

## Security & Boundaries

**Permitido:** editar frontend/backend no escopo, rodar dev/build, `cargo test`.
**Confirmar (APAE):** mudanças de schema SQLite/migrações, `npm run tauri build` p/ release, mudança estrutural.
**Proibido:** enviar dados de apostas para fora da máquina (offline-first é requisito); commitar secrets; `force push` em `main`.

## Commit & PR

- EN-US, Conventional Commits (`feat:`, `fix:`, `chore:`).

## Comunicação

Resultado primeiro. Pouco técnico. Uma decisão por vez. SIM/NÃO ou A/B/C.
SSOT: `~docs/~work_guidelines/protocols/COMMUNICATION.md`.

## Workflows universais

`/sod` `/eod` `/eow` `/query` `/ideacao` `/dev` `/uat` `/bug` — `~docs/~work_guidelines/`.
Modos: `~docs/~work_guidelines/protocols/WORK_MODES.md`.

## Regras universais (herdadas)

APAE, modos, Golden Rules, DoD, idiomas PT-BR/EN-US, fail-fast: `~docs/~work_guidelines/` (SSOT). Padrão: `~docs/~work_guidelines/AGENTS_FRAMEWORK.md`.

## Definition of Done

- [ ] `npm run build` limpo e `cargo build` sem erros.
- [ ] `cargo test` passando (quando tocar backend).
- [ ] App abre e funciona via `npm run tauri dev`.
- [ ] Dados permanecem 100% locais (nenhuma exfiltração).
- [ ] `bash "../~scripts/docs/check-docs.sh" .` verde (quando tocar `_docs/`).
- [ ] Sem secrets no diff. DoD universal: `~docs/~work_guidelines/protocols/DOD.md`.
