/*
 * PROGRAMA: FormCadastro.tsx
 * DESCRIÇÃO: Este componente gerencia o formulário de cadastro de novas apostas da Mega-Sena.
 *            Possui campo para o número do concurso inicial, um preview com as esferas selecionadas,
 *            uma grade (grid) interativa para seleção de 6 a 20 números, opções de teimosinha
 *            e faz a submissão dos dados chamando o comando correspondente no Tauri (Rust).
 * QUEM O CHAMA: Renderizado dentro de um modal interativo a partir de `App.tsx`.
 * QUEM ELE CHAMA:
 *   - Componentes: `GridNumeros.tsx` (grade de botões numéricos) e `NumeroEsfera.tsx` (preview das dezenas).
 *   - Serviços: `adicionarAposta` e `obterUltimoConcurso` do arquivo `services/tauri.ts`.
 * O QUE ESPERA RECEBER:
 *   - `onApostaAdicionada`: Callback disparado após o sucesso na inserção para atualizar a lista principal.
 * O QUE ENVIA (RETORNA):
 *   - Formulário HTML estruturado em JSX para gerenciamento de input do usuário e interações de toque/clique.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the MIT License
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { NumeroEsfera } from './NumeroEsfera';
import { GridNumeros } from './GridNumeros';
import { adicionarAposta, obterUltimoConcurso } from '../services/tauri';

interface FormCadastroProps {
  onApostaAdicionada: () => void;
}

export function FormCadastro({ onApostaAdicionada }: FormCadastroProps) {
  // Estados locais para controlar inputs do formulário e dezenas selecionadas
  const [concurso, setConcurso] = useState('');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [teimosinha, setTeimosinha] = useState(1);
  const [loading, setLoading] = useState(false);

  // Busca o concurso recente na inicialização para sugerir como padrão
  useEffect(() => {
    const carregarUltimo = async () => {
      try {
        const ultimo = await obterUltimoConcurso();
        setConcurso(ultimo.toString());
      } catch (error) {
        console.warn('Falha ao obter último concurso:', error);
      }
    };
    carregarUltimo();
  }, []);

  // Regra de validação: deve possuir entre 6 e 20 números selecionados e campo concurso preenchido
  const isValido = selecionados.length >= 6 && selecionados.length <= 20 && concurso !== '';

  /// Trata a submissão do formulário enviando os dados para a persistência SQLite no Rust
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[FORM] Tentando submeter aposta:', { selecionados, concurso, teimosinha });
    
    if (!isValido) {
      console.warn('[FORM] Validação falhou:', { 
        numSelecionados: selecionados.length, 
        concursoValido: concurso !== '' 
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[FORM] Chamando adicionarAposta...');
      const novaAposta = await adicionarAposta(selecionados, parseInt(concurso), teimosinha);
      console.log('[FORM] Aposta adicionada com sucesso:', novaAposta);
      
      // Reseta a seleção e a teimosinha, preservando o concurso padrão
      setSelecionados([]);
      setTeimosinha(1);
      
      // Executa o callback pai de recarregamento
      onApostaAdicionada();
      toast.success('Aposta cadastrada!');
    } catch (error: any) {
      console.error('[FORM] Erro ao adicionar aposta:', error);
      alert(`Erro ao adicionar aposta: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-card rounded-3xl border border-border shadow-sm transition-all">
      <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Nova Aposta</h2>

      {/* Input de Concurso Inicial */}
      <div>
        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 ml-1">
          Concurso Inicial
        </label>
        <input
          type="number"
          value={concurso}
          onChange={(e) => setConcurso(e.target.value)}
          placeholder="2650"
          className="w-full px-5 py-3 bg-muted border-none rounded-2xl focus:ring-2 focus:ring-green-sphere text-sm font-bold placeholder-muted-foreground/50 transition-all text-foreground"
          required
        />
      </div>

      {/* Visualização de Preview dos números selecionados */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
          Números Selecionados ({selecionados.length})
        </label>
        
        <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-2xl min-h-[56px] transition-all">
          {selecionados.length === 0 ? (
            <span className="text-muted-foreground/50 text-xs font-medium italic mt-1">Selecione de 6 a 20 números no grid abaixo</span>
          ) : (
            selecionados.map(num => (
              <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
            ))
          )}
        </div>
      </div>

      {/* Grade interativa para clicar nos números */}
      <div className="py-2">
        <GridNumeros selecionados={selecionados} onChange={setSelecionados} />
      </div>

      {/* Seleção de repetição de teimosinha */}
      <div>
        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 ml-1">
          Repetições (Teimosinha)
        </label>
        <select
          value={teimosinha}
          onChange={(e) => setTeimosinha(parseInt(e.target.value))}
          className="w-full px-5 py-3 bg-muted border-none rounded-2xl focus:ring-2 focus:ring-green-sphere text-sm font-bold appearance-none cursor-pointer transition-all text-foreground"
        >
          {[1, 2, 4, 8, 12].map(n => (
            <option key={n} value={n}>
              {n === 1 ? 'Apenas 1 concurso' : `${n} concursos consecutivos`}
            </option>
          ))}
        </select>
      </div>

      {/* Botão de confirmação de cadastro */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!isValido || loading}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-95 ${
            isValido && !loading
              ? 'bg-green-sphere text-white hover:bg-green-dark'
              : 'bg-muted text-muted-foreground/50 cursor-not-allowed border border-border'
          }`}
        >
          {loading ? 'Processando...' : 'Confirmar Aposta'}
        </button>
      </div>
    </form>
  );
}
