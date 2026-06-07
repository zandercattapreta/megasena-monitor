import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Aposta } from '../types';
import { NumeroEsfera } from './NumeroEsfera';
import { excluirAposta } from '../services/tauri';

interface CardApostaProps {
  aposta: Aposta;
  onExcluida: () => void;
}

export function CardAposta({ aposta, onExcluida }: CardApostaProps) {
  const [expandido, setExpandido] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const handleExcluir = async () => {
    console.log(`[UI] Executando exclusão imediata da aposta ID: ${aposta.id}`);
    setExcluindo(true);
    try {
      await excluirAposta(Number(aposta.id));
      console.log(`[SUCCESS] Aposta #${aposta.id} excluída`);
      toast.success('Aposta removida!');
      onExcluida();
    } catch (error: any) {
      console.error(`[ERROR] Falha ao excluir aposta #${aposta.id}:`, error);
      toast.error(`Falha ao excluir: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setExcluindo(false);
    }
  };

  const concursosRestantes = aposta.quantidadeConcursos > 1
    ? `${aposta.quantidadeConcursos} concursos`
    : `Concurso ${aposta.concursoInicial}`;

  return (
    <div className={`glass-card rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md border border-border bg-card ${expandido ? 'ring-2 ring-green-sphere/20' : ''}`}>
      {/* Header - Sempre visível */}
      <div className="flex items-start justify-between p-5 pb-2">
        <div 
          className="flex items-center gap-3 cursor-pointer flex-1"
          onClick={() => setExpandido(!expandido)}
        >
          <span className="text-sm font-bold text-muted-foreground transition-transform duration-300" style={{ transform: expandido ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <div className="space-y-0.5">
            <span className="font-black text-xs text-foreground uppercase tracking-widest block">Aposta #{aposta.id}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{concursosRestantes}</span>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExcluir();
          }}
          disabled={excluindo}
          className="p-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-destructive/20 hover:border-destructive disabled:opacity-50"
          title="Remover Aposta"
        >
          {excluindo ? '...' : 'Remover'}
        </button>
      </div>

      {/* Números - Sempre visível */}
      <div 
        className="flex flex-wrap gap-2 px-5 pb-5 cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        {aposta.numeros.map(num => (
          <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
        ))}
      </div>

      {/* Detalhes Expandidos */}
      {expandido && (
        <div className="mx-5 pb-5 pt-5 border-t border-border space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex justify-between items-center opacity-70">
            <span>Data de Cadastro: {new Date(aposta.dataCriacao).toLocaleDateString('pt-BR')}</span>
            {aposta.quantidadeConcursos > 1 && (
              <span>Teimosinha: {aposta.quantidadeConcursos} Concursos</span>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Histórico de Resultados</h4>
            {Array.from({ length: aposta.quantidadeConcursos }, (_, i) => aposta.concursoInicial + i).map(concurso => {
              const acertos = aposta.acertos?.[concurso];
              const sorteados = aposta.resultadosConcursos?.[concurso];
              
              const isWinner = acertos !== undefined && acertos >= 4;
              const prizeType = acertos === 4 ? 'QUADRA' : acertos === 5 ? 'QUINA' : acertos === 6 ? 'SENA' : null;

              return (
                <div 
                  key={concurso} 
                  className={`rounded-2xl p-4 transition-all duration-500 border ${
                    isWinner 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 shadow-sm' 
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-foreground uppercase tracking-widest">C#{concurso}</span>
                      {prizeType && (
                        <span className="px-3 py-1 bg-yellow-400 text-white text-[9px] font-black rounded-full shadow-sm animate-bounce">
                          {prizeType}
                        </span>
                      )}
                    </div>
                    {sorteados && acertos !== undefined ? (
                      <div className="text-right">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isWinner ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                          {acertos} ACERTO{acertos !== 1 ? 'S' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest px-2 py-1 bg-muted rounded-lg border border-border/50">
                          Aguardando Sorteio
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {sorteados && (
                    <div className="flex flex-wrap gap-2">
                      {sorteados.map(num => (
                        <NumeroEsfera 
                          key={num} 
                          numero={num} 
                          selecionado={aposta.numeros.includes(num)} 
                          acertou={aposta.numeros.includes(num)}
                          tamanho="small" 
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
