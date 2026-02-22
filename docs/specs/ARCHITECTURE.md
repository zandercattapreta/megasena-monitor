# Arquitetura do Sistema - MegaSena Monitor

## 🍀 Visão Geral

O MegaSena Monitor é uma aplicação desktop offline-first construída com **Tauri**, **React** e **SQLite**. O foco é simplicidade, privacidade (dados locais) e automação na verificação de resultados.

## 🏗️ Diagrama de Blocos

```mermaid
graph TD
    subgraph Frontend (React + TS)
        UI[User Interface]
        SC[Services/Tauri Wrapper]
        Types[TypeScript Types]
    end

    subgraph Backend (Rust + Tauri)
        Cmd[Tauri Commands]
        DB[SQLite Wrapper]
        Models[Data Structs]
        API[External API Client]
    end

    subgraph Storage
        SQLite[(megasena.db)]
    end

    subgraph External
        Caixa[API Loterias Caixa]
    end

    UI <--> SC
    SC <--> Cmd
    Cmd <--> DB
    Cmd <--> API
    DB <--> SQLite
    API <--> Caixa
```

## 📂 Organização de Arquivos

### ⚛️ Frontend (`/src`)

- `components/`: Componentes visuais atômicos (Esfera, Grid, Card).
- `services/`: Comunicação com o backend Rust via IPC (Tauri `invoke`).
- `types/`: Definições de interfaces compartilhadas.
- `App.tsx`: Orquestrador da visualização e estado global.

### 🦀 Backend (`/src-tauri`)

- `database.rs`: Camada de persistência usando `rusqlite`. Gerencia o schema e queries.
- `commands.rs`: Pontos de entrada para o frontend. Executa validações de negócio.
- `api.rs`: Cliente HTTP (`reqwest`) para busca de resultados externos.
- `models.rs`: Estruturas Rust (Structs) com derive de Serialize/Deserialize.

## 🗄️ Modelo de Dados (SQLite)

### Tabela `apostas`

Armazena as apostas do usuário.

- `numeros`: Texto (JSON array) para flexibilidade de 6 a 15 dezenas.
- `concurso_inicial`: Inteiro para controle de início da validade.
- `quantidade_concursos`: Inteiro para suporte a Teimosinha.

### Tabela `resultados`

Cache local de sorteios oficiais.

- `concurso`: Chave única.
- `numeros_sorteados`: Texto (JSON array).

### Tabela `apostas_resultados`

Tabela de junção que cacheia o cálculo de acertos.

- Relaciona `aposta_id` e `concurso` com o total de `acertos`.

## 🔄 Fluxo de Verificação

1. O usuário clica em "Verificar Resultados".
2. O Frontend identifica todos os concursos pendentes.
3. Para cada concurso, invoca o comando Rust.
4. O Rust busca na API da Caixa.
5. Ao receber, salva no DB local.
6. O sistema dispara automaticamente o `processar_acertos_concurso`, calculando os acertos para _todas_ as apostas ativas naquele concurso.
7. O Frontend recarrega a lista e exibe os acertos em cada card.

## 🎨 Design System

- **Cores**: Baseado na identidade visual da Mega-Sena (Verde #00A859).
- **Tipografia**: System-fonts para visual nativo e rápido.
- **Responsividade**: Layout fixo/dinâmico otimizado para janelas desktop pequenas.
