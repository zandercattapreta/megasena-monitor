/*
 * PROGRAMA: tauri.ts
 * DESCRIÇÃO: Este serviço funciona como a ponte (bridge) e interface de comunicação tipada
 *            entre o frontend TypeScript/React e o backend escrito em Rust. Ele expõe wrappers
 *            de chamadas assíncronas assinaladas com as assinaturas corretas e provê fallback resiliente
 *            para invocações via objeto global da janela (`window.__TAURI__`) em ambientes de desenvolvimento.
 * QUEM O CHAMA: Chamado por componentes da UI do React (como `App.tsx`, `CardAposta.tsx` e `FormCadastro.tsx`).
 * QUEM ELE CHAMA: Invoca a API nativa `@tauri-apps/api/core` (via método `invoke`).
 * O QUE ESPERA RECEBER:
 *   - Depende do método chamado (números das apostas, IDs de exclusão, parâmetros de consultas).
 * O QUE ENVIA (RETORNA):
 *   - Promises que se resolvem em dados tipados descritos pelos tipos globais da aplicação (ex: `Aposta`, `Resultado`, ou void).
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

import * as tauriCore from '@tauri-apps/api/core';
import { Aposta, Resultado } from '../types';

/// Função wrapper interna robusta que centraliza as chamadas IPC (Inter-Process Communication) para o Rust.
/// Fornece um fallback seguro caso o módulo nativo não esteja disponível na janela do browser em ambiente web de dev.
const invoke = async (...args: any[]): Promise<any> => {
  try {
    // 1. Tenta a chamada utilizando o módulo estático importado do Tauri API
    if (tauriCore && typeof tauriCore.invoke === 'function') {
      // @ts-ignore
      return await tauriCore.invoke(...args);
    }
    
    // 2. Tenta a chamada através da variável global __TAURI__ injetada pelo runtime
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

/// Envia comando para persistir uma nova aposta no banco SQLite local.
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

/// Envia comando para recuperar a lista completa de apostas ativas.
export async function listarApostas(): Promise<Aposta[]> {
  return await invoke('listar_apostas');
}

/// Envia comando para remover permanentemente uma aposta através de seu ID.
export async function excluirAposta(id: number): Promise<void> {
  return await invoke('excluir_aposta', { id });
}

/// Envia comando para conferir o resultado de um concurso no banco local ou buscando na API.
export async function verificarResultados(concurso: number): Promise<Resultado> {
  return await invoke('verificar_resultados', { concurso });
}

/// Envia comando para obter uma sequência de últimos resultados de sorteios.
export async function carregarUltimosResultados(
  concursoFinal: number,
  quantidade: number = 15
): Promise<Resultado[]> {
  return await invoke('carregar_ultimos_resultados', {
    concursoFinal,
    quantidade,
  });
}

/// Envia comando para descobrir qual é o concurso ativo mais recente da Mega-Sena.
export async function obterUltimoConcurso(): Promise<number> {
  return await invoke('obter_ultimo_concurso');
}
