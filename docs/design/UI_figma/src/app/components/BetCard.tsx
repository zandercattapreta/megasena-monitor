import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronDown, X, Check } from "lucide-react";
import { NumberSphere } from "./NumberSphere";

export interface Bet {
  id: string;
  numbers: number[];
  startContest: number;
  teimosinha: number;
  results?: {
    contest: number;
    drawn: number[];
    hits: number;
  }[];
}

interface BetCardProps {
  bet: Bet;
  index: number;
  onDelete: (id: string) => void;
}

export function BetCard({ bet, index, onDelete }: BetCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isTeimosinhaMode = bet.teimosinha > 1;
  const hasResults = bet.results && bet.results.length > 0;
  
  // Calcular concursos restantes
  const completedContests = bet.results?.filter(r => r.drawn.length > 0).length || 0;
  const remainingContests = bet.teimosinha - completedContests;

  const getCardSubtitle = () => {
    if (isTeimosinhaMode) {
      return `Teimosinha (${bet.teimosinha} conc.)`;
    }
    if (remainingContests > 0) {
      return `Conc. ${bet.startContest} • ${remainingContests} rest.`;
    }
    return `Conc. ${bet.startContest}`;
  };

  const checkIfHit = (drawnNumbers: number[], userNumber: number) => {
    return drawnNumbers.includes(userNumber);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-[#2A2A2A] border border-[#E5E7EB] dark:border-[#3A3A3A] rounded-lg p-3 hover:border-[#00A859] transition-colors"
    >
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#4B5563] dark:text-[#9CA3AF]" />
            </motion.div>
            <span className="font-semibold text-[#1A1A1A] dark:text-white text-sm">
              Aposta #{index + 1}
            </span>
            <span className="text-[#4B5563] dark:text-[#9CA3AF]">•</span>
            <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">{getCardSubtitle()}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 ml-5">
            {bet.numbers.map((num) => (
              <NumberSphere key={num} number={num} size="small" selected />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(bet.id);
          }}
          className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] dark:border-[#3A3A3A] rounded-md text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#DC2626] transition-colors flex-shrink-0"
          aria-label="Excluir aposta"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#3A3A3A]">
              <p className="text-xs font-semibold text-[#1A1A1A] dark:text-white mb-2">
                Seus números:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {bet.numbers.map((num) => (
                  <NumberSphere key={num} number={num} size="medium" selected />
                ))}
              </div>

              {hasResults && (
                <>
                  <p className="text-xs font-semibold text-[#1A1A1A] dark:text-white mb-2">
                    {isTeimosinhaMode ? "Resultados:" : "Resultado:"}
                  </p>
                  <div className="space-y-2.5">
                    {bet.results?.map((result, idx) => (
                      <div key={idx} className="pl-3 border-l-2 border-[#E5E7EB] dark:border-[#3A3A3A]">
                        {result.drawn.length > 0 ? (
                          <>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                                Concurso {result.contest}:
                              </span>
                              <span className="flex items-center gap-1 text-xs font-semibold text-[#00A859]">
                                <Check className="w-3.5 h-3.5" />
                                {result.hits} acertos
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Sorteados:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {result.drawn.map((num) => {
                                  const isHit = bet.numbers.includes(num);
                                  return (
                                    <NumberSphere
                                      key={num}
                                      number={num}
                                      size="small"
                                      hit={isHit}
                                      miss={!isHit}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">
                            Concurso {result.contest}: aguardando...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}