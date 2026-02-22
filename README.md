# 🍀 MegaSena Monitor

O **MegaSena Monitor** é um aplicativo desktop ultra-minimalista, offline-first, desenvolvido para gerenciar apostas da Mega-Sena com interface limpa, inspirada em calculadoras modernas e no visual icônico das esferas verdes de sorteio.

![Licença MIT](https://img.shields.io/badge/license-MIT-green)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![React](https://img.shields.io/badge/React-19-cyan)
![SQLite](https://img.shields.io/badge/SQLite-Bundled-blue)

---

## 🎯 Visão do Projeto

O objetivo deste projeto foi criar uma ferramenta que oferecesse **privacidade total** e **automação extrema**. Diferente de sites de apostas, o MegaSena Monitor armazena 100% dos seus dados localmente e automatiza a busca de resultados diretamente da API oficial da Caixa, calculando acertos instantaneamente.

### O Processo de Desenvolvimento

O aplicativo foi concebido com uma filosofia de "tela única" (single-view), onde o cadastro de novas apostas e a visualização do histórico coexistem harmoniosamente. O desafio principal foi equilibrar a complexidade da "Teimosinha" (múltiplos concursos) com uma interface que não sobrecarregasse o usuário.

---

## ✨ Principais Recursos

- ✅ **Gestão de Apostas**: Cadastro intuitivo de 6 a 15 números via grid visual.
- ✅ **Suporte a Teimosinha**: Gerencia de 1 a 12 concursos consecutivos para cada aposta.
- ✅ **Verificação Automática**: Busca resultados históricos e atuais via API oficial com fallback para web scraping.
- ✅ **Offline-First**: Banco de dados SQLite local garante que seus dados nunca saiam do seu computador.
- ✅ **Cálculo de Acertos**: Identificação visual imediata de números sorteados com efeito "glow" (brilho) nas esferas.
- ✅ **Design Minimalista**: Interface limpa, tipografia nativa e paleta de cores harmoniosa (#00A859).

---

## 🛠️ Stack Tecnológica

O MegaSena Monitor utiliza o que há de mais moderno no desenvolvimento de aplicações desktop:

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS v4](https://tailwindcss.com/).
- **Backend (Core)**: [Tauri 2.0](https://tauri.app/) (Rust) para segurança e performance.
- **Banco de Dados**: [SQLite](https://www.sqlite.org/) via `rusqlite` no Rust.
- **Build System**: [Vite 7.0](https://vitejs.dev/).
- **API Client**: `reqwest` (Rust) para comunicações seguras e assíncronas.

---

## 🏗️ Arquitetura e Fluxo

O sistema opera em uma arquitetura desacoplada onde o frontend React se comunica com o backend Rust via comandos IPC (Inter-Process Communication).

### Fluxo de Verificação de Resultados

1. O usuário aciona a sincronização.
2. O Backend Rust identifica concursos pendentes no SQLite.
3. Requisições paralelas são feitas à API das Loterias Caixa.
4. Os resultados são cacheados localmente.
5. Um processador de regras cruza cada aposta ativa com os novos resultados.
6. O frontend reflete os acertos em tempo real.

### Banco de Dados (Schema)

O banco de dados local utiliza três tabelas principais:

- `apostas`: Armazena as dezenas e o período de validade.
- `resultados`: Cache de todos os sorteios oficiais baixados.
- `apostas_resultados`: Tabela de junção otimizada para consulta rápida de acertos por concurso.

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (Cargo)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/zandercpzed/megasena-monitor.git
cd megasena-monitor/megasena-app

# Instale as dependências
npm install

# Inicie em modo desenvolvimento
npm run tauri dev
```

### Build

Para gerar o executável para seu sistema operacional:

```bash
npm run tauri build
```

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes. A mudança da GPL para MIT visa incentivar a colaboração e o uso livre por parte da comunidade.

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Se você tem uma ideia de recurso, correção de bug ou melhoria no design:

1. Faça um Fork do projeto.
2. Crie uma Branch para sua feature (`git checkout -b feature/AmazingFeature`).
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`).
4. Push para a Branch (`git push origin feature/AmazingFeature`).
5. Abra um Pull Request.

---

_Desenvolvido com 🍀 por [Zander Catta Preta](https://github.com/zandercpzed)_
