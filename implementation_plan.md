# Plano de Implementação: Refatoração e Performance (v1.1.0)

## 1. Melhorias de Desempenho Identificadas

### Frontend (React)
- **Memoização de Componentes**: O componente `NumeroEsfera` (renderizado de 60 vezes a centenas de vezes em listas expandidas) não possui `React.memo`, causando re-renders excessivos sempre que a seleção de números muda.
- **Estabilidade de Referências**: As funções de clique passadas para o Grid e para as Esferas precisam usar `useCallback` para evitar que os filhos renderizem à toa.
- **Virtualização/Otimização de Render**: Na aba "Minhas Apostas", o mapeamento iterativo de `ListaApostas` pode ser custoso na expansão (com Teimosinha). 

### Backend (Rust)
- **Índices de Banco de Dados**: A tabela `resultados` é consultada constantemente por `concurso`, e `apostas` filtra por `ativa`. A criação de Índices SQL (`CREATE INDEX`) no SQLite (no método `init()`) acelerará consideravelmente as buscas.
- **Transações em Lote**: A inserção de dezenas e os múltiplos cálculos de `processar_acertos_concurso` podem ser otimizados envolvendo o loop em uma única `Transaction` (`BEGIN; COMMIT;`) no `rusqlite`, reduzindo o gargalo de I/O de disco.
- **Chamadas de Rede (Concorrência)**: Atualmente, múltiplos concursos ausentes são buscados pela API. Podemos avaliar concorrência assíncrona.

## 2. Estratégia de Release (v1.1.0)
Além das melhorias de performance subjacentes, a release vai preparar o terreno para "Estatísticas de Frequência" do usuário (quais números ele mais aposta e mais acerta).

## 3. Orquestração de Agentes (Paralelismo Seguro)
Para gerenciar o uso de tokens (context window) e evitar conflitos de merge entre os agentes no mesmo arquivo, adotamos a seguinte topologia de separação de domínios:

1. **Sub-Agente Frontend (`ui-optimizer`)**:
   - **Escopo Isolado**: `src/components/`
   - **Missão**: Implementar padrões de otimização React (`memo`, `useCallback`) nas esferas e grids numéricos, diminuindo a carga de CPU no cliente.

2. **Sub-Agente Backend (`db-optimizer`)**:
   - **Escopo Isolado**: `src-tauri/src/database.rs`
   - **Missão**: Injetar otimizações de query SQLite (índices, pragma tunings e transações) direto na camada de persistência Rust.

Ambos rodarão assincronamente (em paralelo) e reportarão quando suas camadas estiverem enxutas.
