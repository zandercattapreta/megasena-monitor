/*
 * PROGRAMA: index.ts (types)
 * DESCRIÇÃO: Este arquivo define as interfaces TypeScript que representam o modelo de domínio da aplicação
 *            no frontend, garantindo que as estruturas de dados vindas do Tauri Bridge (Rust)
 *            sejam fortemente tipadas de acordo com as regras de negócio.
 * QUEM O CHAMA: Importado por componentes React (como `App.tsx`, `CardAposta.tsx`) e serviços (`tauri.ts`).
 * QUEM ELE CHAMA: Não realiza chamadas funcionais externas (apenas declarações de tipos).
 * O QUE ESPERA RECEBER:
 *   - Não possui lógica de execução ativa de recebimento de parâmetros.
 * O QUE ENVIA (RETORNA):
 *   - Exporta definições de interfaces estáticas (`Aposta`, `Resultado`, `ApostaResultado` etc.).
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

/// Interface representando uma Aposta do usuário.
export interface Aposta {
  /// Identificador único gerado pelo banco SQLite no Rust.
  id: number;
  /// Lista de números jogados (dezenas) nesta aposta.
  numeros: number[];
  /// Número do primeiro concurso do sorteio em que a aposta vale.
  concursoInicial: number;
  /// Quantidade de concursos consecutivos que o jogo concorre (Teimosinha).
  quantidadeConcursos: number;
  /// Carimbo de data/hora da criação da aposta no sistema.
  dataCriacao: string;
  /// Flag indicando se a aposta está ativa para monitoramento.
  ativa: boolean;
  /// Dicionário chave-valor mapeando `[número do concurso] -> [quantidade de acertos obtidos]`.
  acertos: { [concurso: number]: number };
  /// Dicionário chave-valor mapeando `[número do concurso] -> [dezenas oficiais sorteadas]`.
  resultadosConcursos: { [concurso: number]: number[] };
}

/// Interface representando o Resultado de um sorteio oficial obtido da Caixa.
export interface Resultado {
  /// Número identificador único do concurso.
  concurso: number;
  /// Lista de dezenas oficiais sorteadas.
  numerosSorteados: number[];
  /// Data no formato string de apuração do sorteio.
  dataSorteio: string;
  /// Flag indicando se o sorteio acumulou para a faixa principal (Sena).
  acumulado: boolean;
  /// Valor do prêmio individual pago para quem acertou a Sena (opcional).
  valorPremio?: number;
  /// Quantidade de ganhadores da Sena (opcional).
  ganhadores?: number;
  /// Valor estimado acumulado para o próximo concurso (opcional).
  valorTotal?: number;
}

/// Interface representando o relacionamento individual de acertos obtidos em uma Aposta por Concurso.
export interface ApostaResultado {
  /// ID único da aposta associada.
  apostaId: number;
  /// Número do concurso verificado.
  acertos: number;
}

/// Interface estendida opcional útil para fins de mapeamentos estruturados.
export interface ApostaComResultados extends Aposta {
  resultados?: Map<number, ApostaResultado>;
}
