# Plano de Testes e Homologação - MegaSena Monitor

Este documento serve como o guia oficial do desenvolvedor para a execução, manutenção e homologação de testes no **MegaSena Monitor**. Ele descreve os testes unitários do backend (Rust), as estratégias de mocks de rede e o fluxo manual de testes para pré-release.

---

## 🧪 1. Testes Unitários e de Integração locais (Rust Backend)

O backend do aplicativo utiliza o framework integrado de testes do Rust (`cargo test`) para certificar as regras de negócio cruciais e a persistência de banco de dados de maneira offline-first.

### Execução de Testes Unitários
Para rodar todos os testes unitários offline padrão a partir do diretório raiz:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### O que está sendo testado:

#### A. Regras de Negócio e Cálculos (`src-tauri/src/commands.rs`)
Testa o cálculo matemático puro que confere quantos acertos a aposta obteve contra as dezenas oficiais:
* **`test_calcular_acertos_sena`**: Garante que o acerto de todas as 6 dezenas do sorteio retorne classificação máxima.
* **`test_calcular_acertos_quadra`**: Valida a detecção de acerto parcial de 4 dezenas (Quadra).
* **`test_calcular_acertos_zero`**: Certifica que a pontuação é calculada corretamente como zero quando nenhum número coincide.

#### B. Persistência de Dados e SQLite (`src-tauri/src/database.rs`)
Para evitar poluir o disco do desenvolvedor com arquivos temporários ou dados de teste, o banco de dados é inicializado em **memória do processo** (`:memory:`):
* **`test_db_adicionar_listar_apostas`**: Cria o banco em memória, insere jogos convertendo vetores de números para JSON e valida se o retorno possui integridade de tipos e listagem coerente.
* **`test_db_processar_acertos`**: Simula o recebimento de dezenas oficiais, executa a query SQL de vinculação muitos-para-muitos (`apostas_resultados`) e confere se a contagem foi atualizada no banco.

---

## 📡 2. Testes de Integração de Rede e APIs (`src-tauri/src/api.rs`)

O arquivo `api.rs` contém testes que realizam chamadas HTTP reais aos servidores da Caixa Econômica Federal e servidores de fallback alternativos (Guidi API).

Como essas requisições exigem conexão ativa com a internet e dependem da disponibilidade de serviços de terceiros, elas são marcadas com a anotação `#[ignore]` no código. Isso evita que falhas temporárias de rede quebrem builds automatizadas de CI/CD.

### Executando Testes Ignorados (Requer Internet):
Para forçar a execução de todos os testes ignorados de integração de API:
```bash
cargo test --manifest-path src-tauri/Cargo.toml -- --ignored
```

Para rodar especificamente um dos testes de API:
```bash
cargo test --manifest-path src-tauri/Cargo.toml test_fetch_caixa_api -- --ignored
```

---

## 🛠️ 3. Como Criar Novos Testes Unitários

Ao estender as funcionalidades do MegaSena Monitor, siga estas diretrizes para criar novos testes unitários:

### Estrutura Padrão
Escreva os testes dentro do módulo `tests` marcado com `#[cfg(test)]` no final do arquivo de código que deseja testar:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meu_novo_teste_unitario() {
        // Preparação
        let valor_entrada = 42;

        // Execução
        let resultado = processar_dado(valor_entrada);

        // Verificação
        assert_eq!(resultado, esperado);
    }
}
```

### Dicas para Testes com Banco de Dados:
Sempre use a função helper `setup_test_db()` para obter uma conexão isolada em memória do SQLite:
```rust
fn setup_test_db() -> Database {
    let db = Database::new(PathBuf::from(":memory:")).unwrap();
    db.init().unwrap();
    db
}
```

---

## 🔌 4. Simulação Manual de Instabilidades de Rede (Mocks de API)

Durante o desenvolvimento frontend ou auditoria de resiliência, você pode subir mocks da API de loterias em localhost (ex: porta `4000`) para testar o comportamento do aplicativo perante cenários incomuns:

1. **Cenário de API Fora do Ar (Status 500 / Timeouts)**:
   * **Como simular**: Aponte a requisição para uma porta inválida ou configure o Mockoon para travar a resposta por 15 segundos.
   * **Comportamento Esperado**: O app deve aguardar até o limite do timeout (definido de forma ágil para a exploração de fronteira e normal para verificação ativa) e tentar o fallback Guidi sem interromper a navegação da UI.
2. **Cenário de Concurso Acumulado**:
   * **JSON Esperado**: Campo `"acumulado": true`.
   * **Comportamento Esperado**: A interface deve exibir o alerta laranja em destaque *"ACUMULOU!"* na tela de conferência.
3. **Cenário de Vencedor do Prêmio Máximo**:
   * **JSON Esperado**: Campo `"acumulado": false` acompanhado de dados válidos em `"listaRateioPremio"`.
   * **Comportamento Esperado**: A interface deve indicar *"SAIU O PRÊMIO PRINCIPAL!"* e listar os ganhadores.

---

## 📋 5. Checklist para Homologação de Pré-Release (Manual)

Antes de gerar e homologar uma nova build de release, certifique-se de preencher o seguinte checklist básico:

### Interface e Interação
* [ ] **Cadastro Simples**: Tente cadastrar uma aposta simples de 6 dezenas.
* [ ] **Limites do Grid**: Selecione mais de 15 dezenas (limite máximo de 20) e valide se o grid bloqueia cliques subsequentes.
* [ ] **Teimosinha**: Adicione uma aposta com vigência de 12 concursos seguidos e confirme se as 12 linhas aparecem corretas na área de histórico.
* [ ] **Conferência**: Clique em "Verificar" e observe se os toasts de loading e sucesso funcionam sequencialmente.

### Comportamento do Sistema
* [ ] **Troca de Temas**: Alterne o tema nas configurações (Claro/Escuro/Auto) e confira se a transição ocorre instantaneamente.
* [ ] **Minimização**: Feche a janela principal no botão de fechar (X) e verifique se ela é oculta na bandeja do sistema sem matar o processo.
* [ ] **Notificações**: Force a simulação de um sorteio premiado e verifique se a notificação nativa do sistema operacional é exibida com sucesso na barra de alertas do OS.
