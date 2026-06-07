# 📜 Changelog - MegaSena Monitor

Todas as alterações técnicas, correções e melhorias importantes deste projeto serão registradas aqui de forma transparente.

---

## [1.0.2] - 2026-06-07

### ✨ Novidades & Recursos
* **Modal de Nova Aposta**: O formulário estático `FormCadastro` foi migrado para um modal flutuante com fundo desfocado (*backdrop blur*), tornando o layout principal mais enxuto.
* **Atalho e Menu de Nova Aposta**: Configuração do atalho nativo `Cmd+N` e do item de menu macOS para abrir instantaneamente o modal de cadastro de apostas.
* **Botão "+ Nova Aposta"**: Adicionado botão estético e verde no topo de "Minhas Apostas" para disparar a adição de jogos.
* **Indicador de Sincronização em Background**: Adicionado badge discreto de carregamento flutuante de rede (*sincronizando...*) no cabeçalho.

### ⚡ Otimizações (Fim de Travamentos e Telas Brancas)
* **Comandos Assíncronos no Rust Backend**: Os comandos `carregar_ultimos_resultados`, `obter_ultimo_concurso` e `verificar_resultados` foram migrados para assinaturas assíncronas em Rust. Isso resolve de vez o bloqueio da *UI Thread* do sistema e elimina a *Rainbow Wheel (beachball)* no macOS.
* **Inicialização Não-Bloqueante (< 50ms)**: Modificado ciclo de carregamento no React para exibir as apostas locais instantaneamente em vez de travar o app em tela branca aguardando chamadas de rede lentas da Caixa.

### 🐛 Correções de Bugs (Bug Fixes)
* **Correção Definitiva do Sair/Quit**: Substituído o menu nativo da Apple por um comando customizado ID `"quit"` acionado por `std::process::exit(0)`. Isso resolve o travamento de deadlock no fechamento do app causado por interceptores de fechar janela.
* **Seleção de Dezenas**: Aumentado o limite padrão de seleção numérico no grid (`maxSelecao`) de 15 para 20 números, alinhando com a validação oficial do backend.
* **Clique Fora da Splash**: Implementado fechamento da splash screen inicial ao clicar em qualquer lugar fora do modal (clique no backdrop cinza).

### 📐 Ajustes de Layout & Pasta
* **Reorganização de "Minhas Apostas"**: Alterada a ordem das seções para que as apostas feitas fiquem no topo absoluto da página, e as estatísticas unificadas abaixo.
* **Simplificação de Métricas**: Removido o bloco "Investimento" (total gasto), mantendo apenas as métricas de "Premiações" e "Dezenas Quentes" em um grid limpo e responsivo.
* **Janela Travada Horizontalmente**: Travado o limite de redimensionamento horizontal nativo em `600px` em `tauri.conf.json`, permitindo o ajuste estritamente vertical.
* **Destino de Builds em `release/`**: Configuradas as etapas de build para gerenciar os arquivos `.dmg` organizados dentro da pasta `release/` na raiz do projeto.
