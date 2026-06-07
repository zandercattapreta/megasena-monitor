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

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { NumeroEsfera } from './NumeroEsfera';
import { GridNumeros } from './GridNumeros';
import { adicionarAposta, obterUltimoConcurso } from '../services/tauri';

interface FormCadastroProps {
  onApostaAdicionada: () => void;
}

export function FormCadastro({ onApostaAdicionada }: FormCadastroProps) {
  const [concurso, setConcurso] = useState('');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [teimosinha, setTeimosinha] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarUltimo = async () => {
      try {
        const ultimo = await obterUltimoConcurso();
        // Sugerir o último sorteado como padrão (ou o próximo se preferir, mas o último é melhor para conferência)
        setConcurso(ultimo.toString());
      } catch (error) {
        console.warn('Falha ao obter último concurso:', error);
      }
    };
    carregarUltimo();
  }, []);

  const isValido = selecionados.length >= 6 && selecionados.length <= 20 && concurso !== '';

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
      // Reset form
      setSelecionados([]);
      setConcurso(concurso); // Manter o concurso para facilitar múltiplas apostas? Ou resetar? Original era resetar.
      setTeimosinha(1);
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

      {/* Campo Concurso */}
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

      {/* Preview dos Selecionados */}
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

      {/* Grid de Números */}
      <div className="py-2">
        <GridNumeros selecionados={selecionados} onChange={setSelecionados} />
      </div>

      {/* Dropdown Teimosinha */}
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

      {/* Botão Adicionar */}
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
