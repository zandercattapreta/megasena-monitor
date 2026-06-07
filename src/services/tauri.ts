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

import * as tauriCore from '@tauri-apps/api/core';
import { Aposta, Resultado } from '../types';

// Wrapper Robusto para comunicação com o backend Tauri (Rust)
const invoke = async (...args: any[]): Promise<any> => {
  try {
    // Tenta importação via módulo
    if (tauriCore && typeof tauriCore.invoke === 'function') {
      // @ts-ignore
      return await tauriCore.invoke(...args);
    }
    
    // Tenta via global (fallback para alguns cenários de dev)
    // @ts-ignore
    if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
      // @ts-ignore
      return await window.__TAURI__.core.invoke(...args);
    }

    console.error('Tauri invoke não encontrado no módulo nem no global.');
    throw new Error('Tauri bridge not available');
  } catch (e) {
    console.error('Erro na chamada invoke:', e);
    throw e;
  }
};

export async function adicionarAposta(
  numeros: number[],
  concursoInicial: number,
  quantidadeConcursos: number
): Promise<Aposta> {
  return await invoke('adicionar_aposta', {
    numeros,
    concursoInicial,
    quantidadeConcursos,
  });
}

export async function listarApostas(): Promise<Aposta[]> {
  return await invoke('listar_apostas');
}
export async function excluirAposta(id: number): Promise<void> {
  return await invoke('excluir_aposta', { id });
}



export async function verificarResultados(concurso: number): Promise<Resultado> {
  return await invoke('verificar_resultados', { concurso });
}

export async function carregarUltimosResultados(
  concursoFinal: number,
  quantidade: number = 15
): Promise<Resultado[]> {
  return await invoke('carregar_ultimos_resultados', {
    concursoFinal,
    quantidade,
  });
}

export async function obterUltimoConcurso(): Promise<number> {
  return await invoke('obter_ultimo_concurso');
}
