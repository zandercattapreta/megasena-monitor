# 🧪 Plano de Testes e Homologação - MegaSena Monitor

Este plano de testes garante a estabilidade, integridade referencial do banco de dados SQLite local, a resiliência de conexão de rede e a aderência visual do **MegaSena Monitor** perante atualizações na aplicação.

---

## 🤖 1. Testes Automatizados no Backend (Rust)

O backend do aplicativo possui testes de unidade embarcados que podem ser validados a qualquer momento.

### Executar Testes de Unidade locais:
A partir do diretório raiz, rode:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Os testes cobertos validam:
1. **Regra de Negócio de Acertos (`src-tauri/src/commands.rs`)**:
   * `test_calcular_acertos_sena`: Valida acerto total (6 dezenas).
   * `test_calcular_acertos_quadra`: Valida acerto parcial de 4 dezenas.
   * `test_calcular_acertos_zero`: Valida acerto de zero dezenas.
2. **Persistência local do SQLite (`src-tauri/src/database.rs`)**:
   * `test_db_adicionar_listar_apostas`: Valida inserção, codificação de JSON e recuperação de listas no banco em memória.
   * `test_db_processar_acertos`: Simula um fluxo de jogo simulado, persiste resultados, dispara o cruzamento de dados e certifica que as contagens de acertos foram salvas perfeitamente.

---

## 🔌 2. Testes de Integração de API (Mocks de Rede)

Durante desenvolvimentos offline ou testes de resiliência, você pode simular instabilidade ou payload customizado da API externa de resultados:

### Mockando a API com Servidor Local
Usando ferramentas como o **Mockoon** ou simplesmente subindo um servidor Express simples em localhost na porta `4000`, simule as seguintes respostas de rede:

1. **Cenário de Conexão Offline**:
   * Force a API a retornar um status de erro `500 Internal Server Error` ou cause um timeout artificial maior que 10 segundos.
   * **Resultado esperado**: O MegaSena Monitor deve tentar buscar imediatamente na API Guidi de Fallback. Se ambas falharem, deve exibir a mensagem amigável *"Não foi possível obter resultado do concurso..."* sem quebrar a tela de controle do usuário.
2. **Cenário de Acumulação**:
   * Retorne um JSON fictício com o campo `"acumulado": true`.
   * **Resultado esperado**: O app deve renderizar o badge em destaque em laranja "ACUMULOU!" ao abrir os detalhes.
3. **Cenário de Sorteio com Ganhador**:
   * Retorne um JSON fictício com o campo `"acumulado": false` e `"listaRateioPremio"` detalhado.
   * **Resultado esperado**: O app deve renderizar em verde "SAIU O PRÊMIO!" e listar corretamente a quantidade de ganhadores e o valor pago para a Sena.

---

## 📋 3. Checklist de Homologação Manual (Pré-Release)

Antes de aprovar e publicar uma nova versão final do MegaSena Monitor, execute o checklist completo de homologação manual em ambiente de homologação:

### A. Cadastro de Apostas
* [ ] Cadastrar uma aposta simples de 6 dezenas.
* [ ] Cadastrar uma aposta máxima de 20 dezenas (certificando que o grid numérico não bloqueie após o 15º item).
* [ ] Tentar submeter uma aposta inválida sem selecionar nenhuma dezena (o botão de confirmar deve estar desabilitado).
* [ ] Cadastrar uma aposta utilizando múltiplos concursos (Teimosinha de 8 repetições).

### B. Conferência e Interface Visual
* [ ] Clicar no botão "Verificar" e certificar que o balão de carregamento flutuante ("toast") apareça durante a consulta.
* [ ] Expandir um card de aposta e verificar se a data de criação e as informações de concurso estão formatadas em formato pt-BR.
* [ ] Confirmar se dezenas sorteadas que coincidem com a aposta estão animadas com a borda brilhante `.winning-sphere` de cor verde.
* [ ] Testar alternar de filtro para "Todas", "Ativas", "Vencidas" e "Premiadas" e garantir que as contagens de cards estejam coerentes.

### C. Sistema Operacional & Recursos Nativos
* [ ] **Gerenciamento de Preferências**: Abrir o painel de preferências e testar a troca de temas (Claro, Escuro e Automático). O fundo do app deve responder instantaneamente com transição suave.
* [ ] **Inicialização com o Sistema**: Ativar o switch de inicialização automática, fechar o app, reiniciar o computador e verificar se o app reabre minimizado na bandeja.
* [ ] **Fechar janela para Bandeja (Tray)**: Clicar no botão "Fechar" (X) da janela principal. A janela deve sumir da tela, mas o processo deve continuar rodando em segundo plano.
* [ ] **Bandeja do Sistema**: Clicar no ícone do trevo de 4 folhas na barra de status superior (macOS) ou na área de notificação do Windows e clicar em "Mostrar Monitor". A tela principal deve ser reexibida com foco.
* [ ] **Disparo de Notificações**: Cadastrar uma aposta com números conhecidos que darão prêmio (ex: Quadra) em um concurso antigo, verificar resultados e checar se o sistema operacional exibe a notificação nativa flutuante: *"MegaSena Monitor - Você Ganhou! 🍀"* acompanhada do efeito sonoro do sistema.
