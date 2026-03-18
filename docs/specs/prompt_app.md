# Prompt: MegaSena App Minimalista (Tauri + React)

## Objetivo

Criar um aplicativo desktop **ultra-minimalista** para gerenciar apostas da Mega-Sena com interface de tela única, design limpo tipo calculadora, e visualização de resultados em formato de esferas verdes de sorteio.

---

## Especificações Técnicas

### Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Tauri (Rust)
- **Database**: SQLite (integrado no Tauri)
- **Build Target**: macOS (inicial), Windows/Linux (futuro)

### Requisitos

- Tela única (cadastro + consulta na mesma view)
- Design minimalista estilo calculadora
- Números em círculos verdes (imitando esferas de sorteio)
- Até 10 apostas simultâneas
- Suporte a teimosinha (2-12 concursos)
- Verificação manual de resultados
- Expansão de apostas para ver histórico
- 100% offline após instalação

---

## Design Visual

### Paleta de Cores Minimalista

```css
/* Cores principais */
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--text-primary: #1a1a1a;
--text-secondary: #6b7280;
--border: #e5e7eb;

/* Cores da Mega-Sena */
--green-sphere: #00a859; /* Verde das esferas */
--green-dark: #006b3c; /* Hover */
--green-light: #e8f5e9; /* Background sutil */

/* Feedback */
--error: #dc2626;
--success: #10b981;
--warning: #f59e0b;
```

### Tipografia

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Hierarquia */
--title: 24px / 600; /* Título do app */
--body: 14px / 400; /* Texto padrão */
--number: 18px / 700; /* Números nas esferas */
--caption: 12px / 400; /* Informações secundárias */
```

### Componentes Visuais

**Esfera de Número (Círculo Verde):**

```
┌─────────┐
│         │
│   05    │  ← Número branco, fonte bold
│         │
└─────────┘
   40x40px
   border-radius: 50%
   background: #00A859
   color: #FFFFFF
   font-size: 18px
   font-weight: 700
```

**Estados da Esfera:**

- Normal: Verde `#00A859`
- Acertou: Verde + brilho/glow
- Não acertou: Cinza `#9CA3AF`

---

## Layout da Tela Única

```
┌──────────────────────────────────────────────────┐
│                                                   │
│                   🍀 MegaSena                     │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  CADASTRAR APOSTA                                │
│                                                   │
│  Concurso inicial                                │
│  ┌────────┐                                      │
│  │  2650  │                                      │
│  └────────┘                                      │
│                                                   │
│  Selecione 6 a 15 números                        │
│  ┌──────────────────────────────────────────┐   │
│  │ (05) (12) (32) (38) (52) (58)            │   │
│  └──────────────────────────────────────────┘   │
│  ⦿ ⦿ ⦿ ⦿ ⦿ ⦿ ⦿ ⦿ ⦿ ⦿ ... (grid 01-60)         │
│                                                   │
│  Teimosinha  [8 concursos ▼]                     │
│                                                   │
│  [Adicionar Aposta]                              │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  MINHAS APOSTAS (3/10)                           │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ ▶ Aposta #1 • Concurso 2650 • 8 rest.      │ │
│  │   (05) (12) (32) (38) (52) (58)            │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ ▼ Aposta #2 • Concurso 2649 • Teimosinha   │ │
│  │   (08) (15) (23) (27) (41) (59)            │ │
│  │   ├─ Concurso 2649: 3 acertos ✓            │ │
│  │   │  Sorteados: (08) (15) (23) (44)(55)(60)│ │
│  │   │  Seus: (08) (15) (23) (27)(41)(59)     │ │
│  │   ├─ Concurso 2650: 2 acertos              │ │
│  │   └─ Concurso 2651: aguardando...          │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  [Verificar Resultados]                          │
│                                                   │
└──────────────────────────────────────────────────┘
    600x800px (janela fixa, não redimensionável)
```

---

## Funcionalidades Detalhadas

### 1. Seção de Cadastro

**Campo Concurso:**

- Input numérico simples
- Valor padrão: último concurso conhecido
- Validação: > 0

**Seletor de Números:**

- Grid 10x6 (10 colunas, 6 linhas)
- Números de 01 a 60
- Click para selecionar/desselecionar
- Visual:
  - Não selecionado: Círculo branco com borda cinza
  - Selecionado: Círculo verde (#00A859) com número branco
  - Hover: Borda verde mais escura

**Preview dos Selecionados:**

- Linha acima do grid
- Mostra números selecionados em círculos verdes menores
- Máximo 15 círculos visíveis
- Contador: "6 números" ou "15 números (máx)"

**Dropdown Teimosinha:**

- Opções: 1 a 12 concursos
- Valor padrão: 1 (aposta simples)
- Label: "1 concurso" ou "8 concursos (teimosinha)"

**Botão Adicionar:**

- Verde, largura total
- Disabled quando < 6 ou > 15 números
- Text: "Adicionar Aposta"
- Loading state ao salvar

**Validações:**

- Mínimo 6 números
- Máximo 15 números
- Concurso válido
- Máximo 10 apostas cadastradas
- Alert se tentar adicionar 11ª aposta

### 2. Seção de Apostas

**Lista de Apostas:**

- Cards minimalistas
- Expansível/colapsável (▶/▼)
- Ordenação: mais recente primeiro

**Card Colapsado (▶):**

```
┌────────────────────────────────────────────┐
│ ▶ Aposta #1 • Concurso 2650 • 8 restantes  │
│   (05) (12) (32) (38) (52) (58)            │
│   [×] Excluir                              │
└────────────────────────────────────────────┘
```

**Card Expandido (▼) - Aposta Simples:**

```
┌────────────────────────────────────────────┐
│ ▼ Aposta #1 • Concurso 2650                │
│   Seus números:                            │
│   (05) (12) (32) (38) (52) (58)            │
│                                            │
│   Resultado do Concurso 2650:              │
│   Sorteados: (05) (12) (19) (32) (44) (60) │
│   ✓ 3 acertos                              │
│   [×] Excluir                              │
└────────────────────────────────────────────┘
```

**Card Expandido (▼) - Teimosinha:**

```
┌────────────────────────────────────────────┐
│ ▼ Aposta #2 • Teimosinha (8 concursos)     │
│   Seus números:                            │
│   (08) (15) (23) (27) (41) (59)            │
│                                            │
│   Resultados:                              │
│   ├─ Concurso 2649: ✓ 3 acertos            │
│   │  (08) (15) (23) (44) (55) (60)         │
│   │                                        │
│   ├─ Concurso 2650: ✓ 2 acertos            │
│   │  (08) (19) (32) (44) (55) (60)         │
│   │                                        │
│   ├─ Concurso 2651: aguardando...          │
│   ├─ Concurso 2652: aguardando...          │
│   └─ ... (mais 4 concursos)                │
│   [×] Excluir                              │
└────────────────────────────────────────────┘
```

**Visualização de Acertos:**

- Números do usuário sempre em verde
- Números sorteados:
  - Verde com glow/brilho se acertou
  - Cinza claro se não acertou
- Contador de acertos destacado: "✓ 3 acertos"

**Estados:**

- Aguardando: Texto cinza
- Verificado com acertos: Verde
- Sem acertos: Cinza

### 3. Botão Verificar Resultados

- Localizado no final da lista
- Estilo: Secundário (borda verde, fundo branco)
- Ação: Busca resultados de TODAS as apostas
- Loading state: "Verificando..."
- Feedback: Toast no topo
  - Sucesso: "3 apostas verificadas"
  - Erro: "Erro ao buscar resultados"

---

## Fluxos de Interação

### Fluxo 1: Adicionar Aposta

1. Usuário digita concurso inicial
2. Clica em 6-15 números no grid
3. Preview mostra números selecionados
4. (Opcional) Seleciona quantidade de concursos
5. Clica "Adicionar Aposta"
6. Card aparece na lista abaixo
7. Form reseta (números desmarcados)

### Fluxo 2: Expandir Aposta

1. Card está colapsado (▶)
2. Usuário clica no card
3. Card expande (▼) com animação suave
4. Se teimosinha, mostra todos os concursos
5. Se já verificado, mostra resultados

### Fluxo 3: Verificar Resultados

1. Usuário clica "Verificar Resultados"
2. Botão muda para "Verificando..." (loading)
3. Sistema busca resultados na API
4. Cards são atualizados com resultados
5. Toast aparece: "X apostas verificadas"
6. Números acertados ficam com glow

### Fluxo 4: Excluir Aposta

1. Usuário expande card
2. Clica no botão "× Excluir"
3. Dialog de confirmação aparece
4. Se confirmar: card desaparece com animação
5. Lista se reorganiza

---

## Estrutura de Dados

### Modelo de Aposta (SQLite)

```sql
CREATE TABLE apostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numeros TEXT NOT NULL,              -- JSON: [5, 12, 32, 38, 52, 58]
    concurso_inicial INTEGER NOT NULL,
    quantidade_concursos INTEGER NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativa BOOLEAN DEFAULT 1
);

CREATE TABLE resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concurso INTEGER NOT NULL UNIQUE,
    numeros_sorteados TEXT NOT NULL,    -- JSON: [5, 12, 19, 32, 44, 60]
    data_sorteio DATE,
    acumulado BOOLEAN,
    data_verificacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE apostas_resultados (
    aposta_id INTEGER,
    concurso INTEGER,
    acertos INTEGER,
    FOREIGN KEY (aposta_id) REFERENCES apostas(id),
    FOREIGN KEY (concurso) REFERENCES resultados(concurso)
);
```

### Tipos TypeScript

```typescript
interface Aposta {
  id: number;
  numeros: number[];
  concursoInicial: number;
  quantidadeConcursos: number;
  dataCriacao: string;
  ativa: boolean;
}

interface Resultado {
  concurso: number;
  numerosSorteados: number[];
  dataSorteio: string;
  acumulado: boolean;
}

interface ApostaResultado {
  apostaId: number;
  concurso: number;
  acertos: number;
}
```

---

## API de Resultados (Estratégia de Fallback)

### Fonte Primária: API Caixa

```
GET https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/{concurso}

Response:
{
  "numero": 2650,
  "dataApuracao": "17/11/2024",
  "dezenas": ["05", "12", "19", "32", "44", "60"],
  "acumulado": false
}
```

### Fallback 1: Web Scraping Caixa

```
URL: https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx
Parse HTML para extrair números
```

### Fallback 2: Google Search

```
Query: "mega-sena concurso {numero} resultado"
Parse snippets
```

> Nota: no código atual do repositório, o fallback implementado é via **API alternativa compatível com o formato da Caixa** (não via scraping/Google).

### Implementação (Rust - Tauri)

```rust
#[tauri::command]
async fn verificar_resultados(concurso: i32) -> Result<Resultado, String> {
    // 1. Tentar API Caixa
    match fetch_caixa_api(concurso).await {
        Ok(resultado) => return Ok(resultado),
        Err(_) => {}
    }

    // 2. Tentar Web Scraping
    match fetch_caixa_web(concurso).await {
        Ok(resultado) => return Ok(resultado),
        Err(_) => {}
    }

    // 3. Tentar Google
    match fetch_google_search(concurso).await {
        Ok(resultado) => return Ok(resultado),
        Err(e) => Err(format!("Todas as fontes falharam: {}", e))
    }
}
```

---

## Estrutura do Projeto

```
megasena-app/
├── src-tauri/              # Backend Rust
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands.rs     # Tauri commands
│   │   ├── database.rs     # SQLite operations
│   │   ├── api.rs          # Busca de resultados
│   │   └── models.rs       # Data structures
│   ├── Cargo.toml
│   └── tauri.conf.json     # Configuração Tauri
├── src/                    # Frontend React
│   ├── components/
│   │   ├── FormCadastro.tsx
│   │   ├── NumeroEsfera.tsx
│   │   ├── GridNumeros.tsx
│   │   ├── ListaApostas.tsx
│   │   ├── CardAposta.tsx
│   │   └── ResultadoConcurso.tsx
│   ├── hooks/
│   │   ├── useApostas.ts
│   │   └── useResultados.ts
│   ├── services/
│   │   └── tauri.ts        # Interface com backend
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Tailwind
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── README.md
└── LICENSE                 # GNU GPL v3.0
```

---

## Componentes React (Exemplos)

### NumeroEsfera.tsx

```tsx
interface Props {
  numero: number;
  selecionado?: boolean;
  acertou?: boolean;
  onClick?: () => void;
}

export function NumeroEsfera({ numero, selecionado, acertou, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 rounded-full font-bold text-white
        transition-all duration-200
        ${
          selecionado || acertou
            ? "bg-green-600 shadow-lg"
            : "bg-white border-2 border-gray-300 text-gray-700"
        }
        ${acertou && "ring-4 ring-green-300 shadow-green-500/50"}
        hover:scale-110
      `}
    >
      {numero.toString().padStart(2, "0")}
    </button>
  );
}
```

### GridNumeros.tsx

```tsx
interface Props {
  selecionados: number[];
  onChange: (numeros: number[]) => void;
}

export function GridNumeros({ selecionados, onChange }: Props) {
  const numeros = Array.from({ length: 60 }, (_, i) => i + 1);

  const toggleNumero = (num: number) => {
    if (selecionados.includes(num)) {
      onChange(selecionados.filter((n) => n !== num));
    } else if (selecionados.length < 15) {
      onChange([...selecionados, num].sort((a, b) => a - b));
    }
  };

  return (
    <div className="grid grid-cols-10 gap-2">
      {numeros.map((num) => (
        <NumeroEsfera
          key={num}
          numero={num}
          selecionado={selecionados.includes(num)}
          onClick={() => toggleNumero(num)}
        />
      ))}
    </div>
  );
}
```

---

## Estilo Minimalista (CSS)

```css
/* Reset e base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #ffffff;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar minimalista */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f8f9fa;
}

::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

/* Animações suaves */
.transition-all {
  transition: all 0.2s ease;
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Entregáveis

1. **Código fonte completo**

   - Backend Rust (Tauri)
   - Frontend React + TypeScript
   - Database SQLite

2. **Testes**

   - Unit tests (Rust + Jest)
   - Integration tests
   - E2E tests (Playwright)

3. **Documentação**

   - README.md (instalação, uso, build)
   - ARCHITECTURE.md
   - API.md (comandos Tauri)

4. **Build**

   - Script de build para macOS (.app)
   - Instruções para Windows/Linux
   - DMG installer (macOS)

5. **Licença**
   - MIT (ver `LICENSE`)
   - Manter headers consistentes com a licença do repositório

---

## Instruções de Build

```bash
# Desenvolvimento
npm install
npm run tauri dev

# Build para produção (macOS)
npm run tauri build

# Output:
# src-tauri/target/release/bundle/macos/MegaSena.app
# src-tauri/target/release/bundle/dmg/MegaSena_1.0.0_x64.dmg
```

---

## Prompt de Execução

> Crie o **MegaSena App Minimalista** usando **Tauri + React + TypeScript**.
>
> **Características:**
>
> - Tela única com cadastro + consulta
> - Design ultra-simples tipo calculadora
> - Números em círculos verdes (esferas de sorteio)
> - Até 10 apostas com teimosinha (1-12 concursos)
> - Expansão de apostas mostra todos os resultados
> - Verificação manual via API com fallback
> - SQLite para persistência
> - Licença MIT
>
> Implemente TODOS os componentes descritos, com testes completos e documentação.
