import { Resultado, Aposta } from '../types';
import { NumeroEsfera } from './NumeroEsfera';

interface ModalResultadoProps {
  resultado: Resultado;
  apostas: Aposta[];
  onClose: () => void;
}

export function ModalResultado({ resultado, apostas, onClose }: ModalResultadoProps) {
  const formatCurreny = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Filtrar apostas que cobrem este concurso
  const apostasNoConcurso = apostas.filter(aposta => 
    resultado.concurso >= aposta.concursoInicial &&
    resultado.concurso < aposta.concursoInicial + aposta.quantidadeConcursos
  );

  const temAposta = apostasNoConcurso.length > 0;
  
  const maxAcertos = temAposta
    ? Math.max(...apostasNoConcurso.map(aposta => aposta.acertos?.[resultado.concurso] ?? 0))
    : -1;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500 border border-border cursor-default"
      >
        <div className="bg-green-sphere p-6 text-white text-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] opacity-80 mb-1">Último Concurso</h2>
          <div className="text-4xl font-black">#{resultado.concurso}</div>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center gap-2 mb-8">
            {resultado.numerosSorteados.map(num => (
              <NumeroEsfera key={num} numero={num} selecionado />
            ))}
          </div>
          
          <div className="space-y-6 text-center">
            {/* Acumulação Oficial do Concurso */}
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Acumulação Oficial</div>
              {resultado.acumulado ? (
                <div className="text-xl font-black text-orange-500 tracking-tight">ACUMULOU!</div>
              ) : (
                <div className="text-xl font-black text-green-600 tracking-tight">SAIU O PRÊMIO PRINCIPAL!</div>
              )}
            </div>

            {/* Suas Apostas / Seu Resultado Pessoal */}
            <div className="border-t border-border pt-4">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Seu Desempenho</div>
              {!temAposta ? (
                <div className="text-xs font-semibold text-muted-foreground bg-muted/40 py-2.5 rounded-xl">
                  Sem apostas registradas para este concurso
                </div>
              ) : maxAcertos >= 4 ? (
                <div className="bg-green-light dark:bg-green-sphere/10 border border-green-sphere/25 p-3 rounded-2xl space-y-1">
                  <div className="text-lg font-black text-green-600 dark:text-green-400 tracking-tight animate-bounce">
                    VOCÊ FOI PREMIADO! 🍀
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {maxAcertos === 4 ? "Quadra" : maxAcertos === 5 ? "Quina" : "Sena"} detectada!
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-2xl space-y-1">
                  <div className="text-lg font-black text-red-500 tracking-tight">
                    Não Premiado
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Seu melhor jogo obteve {maxAcertos} acerto{maxAcertos !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
            
            {resultado.valorTotal && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  {resultado.ganhadores !== undefined ? (
                    resultado.ganhadores > 0 ? 'Valor do Prêmio' : 'Valor Acumulado'
                  ) : 'Prêmio Estimado'}
                </div>
                <div className="text-2xl font-bold text-foreground">{formatCurreny(resultado.valorTotal)}</div>
                
                {resultado.ganhadores !== undefined && (
                  <div className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-wide">
                    {resultado.ganhadores === 0 
                      ? "Nenhum ganhador na Sena" 
                      : `${resultado.ganhadores} ${resultado.ganhadores === 1 ? 'ganhador' : 'ganhadores'} na Sena`}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all active:scale-95 shadow-lg"
              >
                Entrar no Monitor
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-muted p-4 text-center">
          <span className="text-[10px] font-medium text-muted-foreground">Sorteio realizado em {resultado.dataSorteio}</span>
        </div>
      </div>
    </div>
  );
}
