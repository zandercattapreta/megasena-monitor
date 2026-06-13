# Relatório Consolidado: MegaSena Monitor

Este documento apresenta uma visão geral do projeto **MegaSena Monitor**, consolidando as documentações técnicas, requisitos de produto e arquitetura da aplicação.

---

## 1. PRD (Product Requirements Document)

**Objetivo:** Criar um aplicativo desktop ultra-minimalista e *offline-first* para gerenciar apostas da Mega-Sena. O foco absoluto é oferecer **privacidade total** (sem rastreamento ou dados na nuvem) e **automação extrema** no cálculo de acertos.

**Principais Requisitos e Funcionalidades:**
- **Interface Single-View:** Cadastro de novas apostas e visualização do histórico coexistem harmoniosamente na mesma tela (inspirado em calculadoras modernas).
- **Gestão de Apostas Inteligente:** Suporte de 6 a 20 dezenas por jogo, com inserção visual via grid numérico.
- **Suporte à Teimosinha:** Permite configurar a mesma aposta para múltiplos concursos automáticos (1 a 12 concursos).
- **Conferência Automatizada:** Busca automática de resultados oficiais (via internet) com recálculo instantâneo de acertos para os concursos pendentes, sem intervenção humana complexa.
- **Privacidade e Funcionamento Offline:** 100% dos dados devem ser armazenados localmente e, em caso de ausência de rede, a conferência de jogos em cache deve funcionar normalmente.

---

## 2. Backlog de Desenvolvimento (Roadmap)

De acordo com o histórico de *releases* e escopo do projeto, o backlog de próximas evoluções contempla:

* **Versão 1.0.3:**
  * **Notificações Integradas Avançadas:** Alertas de OS mais ricos, detalhando visualmente as dezenas sorteadas na própria notificação nativa.
  * **Exportação de Relatórios:** Geração de históricos de apostas e resultados em formatos `.CSV` e `.PDF`.
* **Versão 1.1.0 e Futuro:**
  * **Estatísticas de Frequência:** Gráficos mostrando a taxa de ocorrência de dezenas mais sorteadas na aba inferior da interface.
  * **Suporte Multi-plataforma Oficial:** Expandir a distribuição oficial (DMG atual no macOS) com builds instaláveis para **Windows** (.exe/.msi) e **Linux** (AppImage).

---

## 3. Design System do Produto

O aplicativo utiliza um Design System focado no minimalismo e usabilidade limpa:

* **Paleta de Cores Temática:**
  * Base: Verde oficial da Mega-Sena (`#00A859`), usado em dezenas sorteadas e botões de destaque.
  * Backgrounds: Interfaces limpas em tons pastéis (`#ffffff` e `#f8f9fa`).
  * Textos e Feedback: Hierarquia baseada no contraste entre `#1a1a1a` (texto primário) e `#6b7280` (texto secundário).
* **Esferas Verdes (Componente Principal):** Bolas estilizadas para dezenas (`40x40px`). Possuem comportamentos visuais como um efeito "brilho/glow" quando o número é sorteado e "cinza inativo" quando errado.
* **Tipografia e Layout:** Uso estrito de *System-Fonts* (como a `-apple-system, Segoe UI`) para preservar a sensação de app nativo. A janela é estruturada verticalmente, possuindo travamento rígido de largura máxima (600px). Interações extras são alocadas em modais com fundo desfocado (*backdrop blur*).

---

## 4. Arquitetura do Produto

O projeto possui uma **arquitetura híbrida desacoplada**:

* **Frontend:** SPA construído com **React 19, TypeScript e Tailwind CSS v4**. O Vite cuida do tooling e agrupamento dos assets.
* **Backend (Camada Nativa):** Implementado no framework **Tauri 2.0 (Rust)**. Responsável pelas requisições HTTP, gerenciamento de threads nativas do OS, menus do sistema e sistema de arquivos. O front e o back se comunicam via comandos **IPC (Inter-Process Communication)** do Tauri.
* **Banco de Dados:** Um banco **SQLite** (`rusqlite`) que reside nativamente no file-system local do usuário (`%APPDATA%`, `~/.local/share`, etc.). Modelado com tabelas de `apostas`, `resultados` (cache) e uma de junção `apostas_resultados`.

---

## 5. Decisões Técnicas

* **Offline-First com Cache Imediato:** Toda requisição bem-sucedida para conferência é armazenada no SQLite permanentemente. Requisições futuras não acionam a rede e utilizam os dados cacheados.
* **Assincronia Absoluta (Rust Async):** Todos os comandos IPC para leitura do disco ou chamadas HTTP são despachados em threads assíncronas do Rust, o que impede a *UI Thread* do navegador interno de congelar, eliminando engasgos visuais e falhas críticas no macOS (beachballs).
* **Exploração de Fronteira Analítica:** Para evitar os atrasos clássicos do site da Caixa em dias de sorteios populares, o Rust utiliza "saltos de duplo avanço". Ele tenta consultar iterativamente concursos posteriores à âncora oficial retornada pela API, extraindo resultados de endpoints individuais isolados antes mesmo do painel central da Caixa ser atualizado.
* **Migrações Não-Destrutivas Nativas:** O sistema opta por gerenciar as evoluções do banco (`ALTER TABLE`) manualmente no startup, garantindo atualizações sem a complexidade de ORMs gigantes.

---

## 6. Integrações

A aplicação baseia sua conferência de sorteios integrando-se via HTTP com agentes externos, contando com uma política de dupla redundância:

1. **Fonte Principal: API Loterias Caixa** (`servicebus2.caixa.gov.br`). Fonte prioritária de dados.
2. **Fonte Fallback: API Guidi Dev** (`api.guidi.dev.br`). Uma solução paralela acionada sempre que a Caixa não responde em tempo hábil (timeout > 10s) ou retorna HTTP 500. A arquitetura de fallback traduz respostas sob a mesma `struct` de deserialização JSON.

---

## 7. Falhas de Segurança do Produto (Riscos e Limitações)

Pelo design da aplicação e políticas abordadas nos documentos internos, há algumas superfícies de risco e potenciais falhas de segurança arquiteturais mapeadas:

1. **Falsificação de Header (User-Agent Spoofing):** Para não ser bloqueado pelos mecanismos WAF/Cloudflare da Caixa Econômica, a integração injeta agressivamente metadados forjados imitando navegadores padrão (`Mozilla/5.0...`). O app está altamente suscetível a bloqueios severos ou *Shadowbans* da infraestrutura da loteria.
2. **Dependência Crítica de Terceiros (Man in The Middle e Dados Falsos):** A API Guidi de Fallback é uma solução mantida ativamente pela comunidade. Em caso de comprometimento da API ou redirecionamento de DNS, a aplicação salvará no seu banco informações e chaves falsificadas irreversivelmente (apesar de não envolver movimentação direta de finanças no app).
3. **Armazenamento em Plain Text:** O banco SQLite `megasena.db` não possui suporte a criptografia local (`SQLCipher`, por exemplo). Qualquer processo em modo de usuário ou malware (ransomware/spyware) acessando as pastas nativas da conta pode ler inteiramente o escopo de apostas financeiras do perfil de uso.
4. **Ausência de Rate Limit Cautelar:** Apesar de possuir limiares de *timeouts* e silenciar erros, o disparo para a API Caixa não possui regulação estrita de *Rate Limit*. Cliques sucessivos abusivos no frontend para "Verificar" acionam paralelismo de concorrência que enxergará o IP do cliente como gerador de ataque DoS, com risco contínuo de bloqueio temporário do link por firewalls de rede públicos.