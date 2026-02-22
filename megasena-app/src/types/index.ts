/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// TypeScript Types for MegaSena App

export interface Aposta {
  id: number;
  numeros: number[];
  concursoInicial: number;
  quantidadeConcursos: number;
  dataCriacao: string;
  ativa: boolean;
  acertos: { [concurso: number]: number };
  resultadosConcursos: { [concurso: number]: number[] };
}

export interface Resultado {
  concurso: number;
  numerosSorteados: number[];
  dataSorteio: string;
  acumulado: boolean;
  valorPremio?: number;
  ganhadores?: number;
  valorTotal?: number;
}

export interface ApostaResultado {
  apostaId: number;
  concurso: number;
  acertos: number;
}

export interface ApostaComResultados extends Aposta {
  resultados?: Map<number, ApostaResultado>;
}
