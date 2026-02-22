import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Settings } from "lucide-react";
import { toast, Toaster } from "sonner";
import { NumberSphere } from "./components/NumberSphere";
import { BetCard, type Bet } from "./components/BetCard";
import { SettingsPanel } from "./components/SettingsPanel";

const MAX_BETS = 10;
const MIN_NUMBERS = 6;
const MAX_NUMBERS = 15;
const TOTAL_NUMBERS = 60;

// Hook para gerenciar tema
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("theme");
    return (saved as "light" | "dark" | "system") || "system";
  });

  useEffect(() => {
    const applyTheme = () => {
      if (theme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", systemPrefersDark);
      } else {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
    };

    applyTheme();

    // Listener para mudanças de preferência do sistema
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, setTheme: handleThemeChange };
}

function App() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [startContest, setStartContest] = useState("");
  const [teimosinha, setTeimosinha] = useState(1);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [startWithSystem, setStartWithSystem] = useState(() => {
    const saved = localStorage.getItem("startWithSystem");
    return saved === "true";
  });

  const { theme, setTheme } = useTheme();

  const handleStartWithSystemChange = (value: boolean) => {
    setStartWithSystem(value);
    localStorage.setItem("startWithSystem", value.toString());
    if (value) {
      toast.success("Aplicativo iniciará com o sistema");
    } else {
      toast.info("Aplicativo não iniciará com o sistema");
    }
  };

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < MAX_NUMBERS) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const canAddBet =
    selectedNumbers.length >= MIN_NUMBERS &&
    selectedNumbers.length <= MAX_NUMBERS &&
    startContest &&
    parseInt(startContest) > 0 &&
    bets.length < MAX_BETS;

  const addBet = () => {
    if (!canAddBet) return;

    const newBet: Bet = {
      id: Date.now().toString(),
      numbers: [...selectedNumbers],
      startContest: parseInt(startContest),
      teimosinha,
      results: Array.from({ length: teimosinha }, (_, i) => ({
        contest: parseInt(startContest) + i,
        drawn: [],
        hits: 0,
      })),
    };

    setBets([newBet, ...bets]);
    setSelectedNumbers([]);
    setStartContest("");
    setTeimosinha(1);
    toast.success("Aposta adicionada com sucesso!");
  };

  const deleteBet = (id: string) => {
    setBets(bets.filter((bet) => bet.id !== id));
    toast.success("Aposta excluída");
  };

  const verifyResults = async () => {
    setIsVerifying(true);

    // Simular chamada de API com delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock de resultados
    const updatedBets = bets.map((bet) => ({
      ...bet,
      results: bet.results?.map((result) => {
        // Gerar números sorteados aleatórios
        const drawn: number[] = [];
        while (drawn.length < 6) {
          const num = Math.floor(Math.random() * 60) + 1;
          if (!drawn.includes(num)) {
            drawn.push(num);
          }
        }
        drawn.sort((a, b) => a - b);

        // Calcular acertos
        const hits = bet.numbers.filter((num) => drawn.includes(num)).length;

        return {
          ...result,
          drawn,
          hits,
        };
      }),
    }));

    setBets(updatedBets);
    setIsVerifying(false);

    const totalVerified = updatedBets.reduce(
      (acc, bet) => acc + (bet.results?.length || 0),
      0
    );
    toast.success(`${totalVerified} resultados verificados`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#1A1A1A] transition-colors">
      <Toaster position="top-center" richColors />
      
      {/* Menu Bar simulada */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#3A3A3A] flex items-center justify-end px-4 z-50 transition-colors">
        <button
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            setShowSettings(false);
          }}
          className="w-7 h-7 rounded-md hover:bg-[#E5E7EB] dark:hover:bg-[#2A2A2A] flex items-center justify-center transition-colors"
          aria-label="Abrir MegaSena Monitor"
        >
          <div className="w-5 h-5 rounded-full bg-[#00A859] flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsMenuOpen(false);
              setShowSettings(false);
            }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            style={{ top: '32px' }}
          />
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-4 top-10 w-[480px] max-h-[calc(100vh-48px)] bg-white dark:bg-[#1E1E1E] shadow-2xl rounded-xl overflow-hidden flex flex-col z-50 border border-[#E5E7EB] dark:border-[#3A3A3A]"
          >
            {showSettings ? (
              <SettingsPanel
                onBack={() => setShowSettings(false)}
                theme={theme}
                onThemeChange={setTheme}
                startWithSystem={startWithSystem}
                onStartWithSystemChange={handleStartWithSystemChange}
              />
            ) : (
              <>
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-[#E5E7EB] dark:border-[#3A3A3A] flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#00A859] flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <h1 className="font-bold text-[#1A1A1A] dark:text-white text-lg">MegaSena Monitor</h1>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-8 h-8 rounded-md hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] flex items-center justify-center transition-colors"
                    aria-label="Configurações"
                  >
                    <Settings className="w-5 h-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                  </button>
                </div>

                {/* Main Content with Scroll */}
                <div className="flex-1 overflow-y-auto">
                  {/* Seção 1: Cadastrar Aposta */}
                  <div className="p-4 border-b border-[#E5E7EB] dark:border-[#3A3A3A]">
                    <h2 className="font-semibold text-[#1A1A1A] dark:text-white mb-3 text-sm">
                      CADASTRAR APOSTA
                    </h2>

                    {/* Input Concurso */}
                    <div className="mb-3">
                      <label className="block text-xs text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                        Concurso inicial
                      </label>
                      <input
                        type="number"
                        value={startContest}
                        onChange={(e) => setStartContest(e.target.value)}
                        placeholder="Ex: 2650"
                        className="w-full h-9 px-3 text-sm border border-[#E5E7EB] dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:border-[#00A859] transition-colors bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-white placeholder:text-[#9CA3AF]"
                      />
                    </div>

                    {/* Preview */}
                    <div className="mb-3">
                      <label className="block text-xs text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                        Selecione {MIN_NUMBERS} a {MAX_NUMBERS} números
                      </label>
                      <div className="bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#E5E7EB] dark:border-[#3A3A3A] rounded-lg p-2 min-h-[50px] flex items-center">
                        {selectedNumbers.length === 0 ? (
                          <span className="text-xs text-[#9CA3AF] w-full text-center">
                            Nenhum número selecionado
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <AnimatePresence>
                              {selectedNumbers.map((num) => (
                                <motion.div
                                  key={num}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <NumberSphere number={num} size="small" selected />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grid de Números */}
                    <div className="grid grid-cols-10 gap-1.5 mb-3">
                      {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(
                        (num) => (
                          <NumberSphere
                            key={num}
                            number={num}
                            selected={selectedNumbers.includes(num)}
                            onClick={() => toggleNumber(num)}
                            disabled={
                              selectedNumbers.length >= MAX_NUMBERS &&
                              !selectedNumbers.includes(num)
                            }
                          />
                        )
                      )}
                    </div>

                    {/* Dropdown Teimosinha */}
                    <div className="mb-3">
                      <label className="block text-xs text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                        Teimosinha
                      </label>
                      <select
                        value={teimosinha}
                        onChange={(e) => setTeimosinha(parseInt(e.target.value))}
                        className="w-full h-9 px-3 text-sm border border-[#E5E7EB] dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:border-[#00A859] transition-colors bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n === 1
                              ? "1 concurso"
                              : `${n} concursos (teimosinha)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Botão Adicionar */}
                    <button
                      type="button"
                      onClick={addBet}
                      disabled={!canAddBet}
                      className={`
                        w-full h-10 rounded-lg font-medium transition-all text-sm
                        ${
                          canAddBet
                            ? "bg-[#00A859] text-white hover:bg-[#006B3C] hover:scale-[1.02]"
                            : "bg-[#E5E7EB] dark:bg-[#3A3A3A] text-[#9CA3AF] cursor-not-allowed"
                        }
                      `}
                    >
                      Adicionar Aposta
                    </button>

                    {bets.length >= MAX_BETS && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#F59E0B]">
                        <span>⚠️</span>
                        <span>Você atingiu o limite de {MAX_BETS} apostas</span>
                      </div>
                    )}
                  </div>

                  {/* Seção 2: Minhas Apostas */}
                  <div className="p-4">
                    <h2 className="font-semibold text-[#1A1A1A] dark:text-white mb-3 text-sm">
                      MINHAS APOSTAS ({bets.length}/{MAX_BETS})
                    </h2>

                    {bets.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="text-4xl mb-3">🎱</div>
                        <p className="text-sm text-[#1A1A1A] dark:text-white mb-1">
                          Nenhuma aposta cadastrada
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          Comece adicionando números acima
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5 mb-3">
                          <AnimatePresence>
                            {bets.map((bet, index) => (
                              <BetCard
                                key={bet.id}
                                bet={bet}
                                index={index}
                                onDelete={deleteBet}
                              />
                            ))}
                          </AnimatePresence>
                        </div>

                        <button
                          type="button"
                          onClick={verifyResults}
                          disabled={isVerifying}
                          className="w-full h-10 rounded-lg border-2 border-[#00A859] text-[#00A859] font-medium hover:bg-[#E8F5E9] dark:hover:bg-[#00A859]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            "Verificar Resultados"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
