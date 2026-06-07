/*
 * PROGRAMA: App.tsx
 * DESCRIÇÃO: Este é o componente raiz da aplicação MegaSena Monitor no React.
 *            Ele inicializa o estado do tema visual, controla a renderização de modais (cadastro,
 *            configurações, ajuda, sobre), consome a ponte de APIs do Tauri em background,
 *            escuta eventos do Tauri (como reabertura da janela e sinal de novos resultados)
 *            e gerencia a sincronização reativa de dados, evitando recarregamento abrupto de página.
 * QUEM O CHAMA: Chamado por `main.tsx` para inicializar a árvore DOM do React.
 * QUEM ELE CHAMA:
 *   - Subcomponentes: `FormCadastro.tsx`, `ListaApostas.tsx`, `NumeroEsfera.tsx`, `ModalResultado.tsx`, `SettingsModal.tsx`.
 *   - Serviços: `services/tauri.ts` (APIs Rust) e `services/settings.ts` (tema/inicialização).
 * O QUE ESPERA RECEBER:
 *   - Não espera receber propriedades (Props) externas por ser o componente raiz.
 * O QUE ENVIA (RETORNA):
 *   - Retorna o código JSX contendo a estrutura de layout e a árvore de componentes da interface gráfica.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the MIT License
 */

import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { FormCadastro } from "./components/FormCadastro";
import { ListaApostas } from "./components/ListaApostas";
import { NumeroEsfera } from "./components/NumeroEsfera";
import { ModalResultado } from "./components/ModalResultado";
import { SettingsModal } from "./components/SettingsModal";
import { listen } from "@tauri-apps/api/event";
import { SettingsService } from "./services/settings";
import appIcon from "./assets/app-icon.png";
import * as tauri from "./services/tauri";
import { Aposta, Resultado } from "./types";
import "./App.css";

function App() {
  // Estados para dados de apostas e resultados do sorteio
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [ultimosResultados, setUltimosResultados] = useState<Resultado[]>([]);
  const [lastResultado, setLastResultado] = useState<Resultado | null>(null);
  
  // Estados de controle de carregamento, sincronismo e modais
  const [loading, setLoading] = useState(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [settingsView, setSettingsView] = useState<"settings" | "about" | "help">("settings");
  const [initError, setInitError] = useState<string | null>(null);

  // Refs de controle para evitar chamadas de sincronismo simultâneas ou em loops infinitos
  const isSyncing = useRef(false);
  const lastSyncTime = useRef(0);

  /// Carrega as apostas do banco de dados local através do Tauri Bridge
  const carregarApostas = async () => {
    console.log("[App] Carregando apostas...");
    setLoading(true);
    try {
      const data = await tauri.listarApostas();
      console.log("[App] Apostas carregadas:", data.length);
      setApostas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[App] Erro ao carregar apostas:", error);
      setApostas([]);
    } finally {
      setLoading(false);
    }
  };

  /// Dispara a verificação manual de resultados para todas as apostas cadastradas
  const handleVerificarResultados = async () => {
    if (apostas.length === 0) {
      toast.error("Nenhuma aposta cadastrada para verificar.", { icon: "⚠️" });
      return;
    }

    setVerificando(true);
    try {
      // Extrai a lista de concursos únicos que as apostas cobrem
      const concursosUnicos = Array.from(
        new Set<number>(
          apostas.flatMap((aposta) =>
            Array.from(
              { length: aposta.quantidadeConcursos },
              (_, i) => aposta.concursoInicial + i,
            ),
          ),
        ),
      );

      if (concursosUnicos.length === 0) return;

      toast.loading(`Conferindo ${concursosUnicos.length} concurso(s)...`, {
        id: "verificando",
      });

      // Limita a concorrência a 4 requisições em paralelo para evitar bloqueios ou timeouts em APIs externas
      const maxConcurrent = 4;
      const results: PromiseSettledResult<Resultado>[] = [];

      for (let i = 0; i < concursosUnicos.length; i += maxConcurrent) {
        const chunk = concursosUnicos.slice(i, i + maxConcurrent);
        const chunkResults = await Promise.allSettled(
          chunk.map((concurso) => tauri.verificarResultados(concurso)),
        );
        results.push(...chunkResults);
      }

      const verificadas = results.filter((r) => r.status === "fulfilled").length;
      const erros = results.length - verificadas;

      toast.dismiss("verificando");
      if (verificadas > 0) {
        toast.success(`${verificadas} concurso(s) conferido(s)!`, {
          icon: "🎉",
        });
      }
      if (erros > 0) {
        toast.error(`${erros} concurso(s) indisponíveis.`);
      }

      await carregarApostas();
    } catch (error) {
      console.error("[App] Erro na conferência:", error);
      toast.error("Erro na conferência.");
    } finally {
      setVerificando(false);
    }
  };

  // Efeito principal de montagem do componente React
  useEffect(() => {
    console.log("[App] Componente Montado");

    // Aplica o tema visual preferido do usuário salvo no LocalStorage
    try {
      SettingsService.applyTheme(SettingsService.getTheme());
    } catch (e) {
      console.error("[App] Erro ao aplicar tema:", e);
    }

    /// Executa a sincronização em background dos resultados com a API e banco de dados local
    const syncResultados = async (showSplash: boolean = false) => {
      const now = Date.now();
      // Limita o sincronismo a no máximo uma vez a cada 10 segundos
      if (now - lastSyncTime.current < 10000) {
        console.log("[App] Sincronização ignorada por rate limit");
        return;
      }

      if (isSyncing.current) return;
      isSyncing.current = true;
      lastSyncTime.current = now;
      setIsBackgroundSyncing(true);

      console.log("[App] Sincronização Iniciada");
      try {
        const ultimo = await tauri.obterUltimoConcurso();
        console.log("[App] Último concurso detectado:", ultimo);

        // Carrega os últimos 36 concursos históricos de sorteios
        const resultados = await tauri.carregarUltimosResultados(ultimo, 36);
        console.log("[App] Resultados sincronizados:", resultados.length);

        if (Array.isArray(resultados) && resultados.length > 0) {
          setUltimosResultados(resultados.slice(0, 5));
          if (showSplash) setLastResultado(resultados[0]);

          if (resultados[0].concurso < ultimo) {
            toast.error(
              `Concurso ${ultimo} ainda não processado oficialmente.`,
              { icon: "⌛" },
            );
          }
        }
      } catch (error: any) {
        console.error("[App] Erro na sincronização:", error);
        if (error.toString().includes("bridge not available")) {
          setInitError("Erro de Conexão: O Tauri Bridge não está disponível.");
        }
      } finally {
        await carregarApostas();
        isSyncing.current = false;
        setIsBackgroundSyncing(false);
        console.log("[App] Sincronização Finalizada");
      }
    };

    // Carrega a listagem de apostas locais instantaneamente (< 50ms)
    carregarApostas();

    // Sincroniza em background de forma assíncrona
    syncResultados(true);

    // Configura temporizador de verificação diária
    let lastDate = new Date().toLocaleDateString();
    const interval = setInterval(() => {
      const current = new Date().toLocaleDateString();
      if (current !== lastDate) {
        lastDate = current;
        syncResultados(false);
      }
    }, 60000);

    // Registra listeners de comunicação inter-processos com o Rust (Tauri Events)
    const unlistenShow = listen("window-show", () => syncResultados(false));
    
    const unlistenView = listen("open-view", (event: { payload: string }) => {
      if (event.payload === "new_bet") {
        setShowCadastroModal(true);
      } else {
        setSettingsView(event.payload as any);
        setShowSettings(true);
      }
    });

    // Correção: Atualização reativa e não-destrutiva ao receber evento de novos resultados em background
    const unlistenNovo = listen("novo-resultado", () => {
      console.log("[App] Evento de novo resultado recebido. Atualizando estado de forma reativa...");
      carregarApostas();
      syncResultados(false);
    });

    // Cleanup dos listeners ao desmontar o componente React
    return () => {
      clearInterval(interval);
      unlistenShow.then((f) => f());
      unlistenView.then((f) => f());
      unlistenNovo.then((f) => f());
    };
  }, []);

  // Exibe tela de erro de inicialização caso a ponte do Tauri não responda
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
        <h1 className="text-xl font-black text-red-500 mb-4">
          Falha na Inicialização
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{initError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest"
        >
          Recarregar Aplicativo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Barra superior de cabeçalho */}
      <header className="px-6 pb-2 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="container mx-auto max-w-lg flex justify-between items-center h-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-sphere rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all cursor-default overflow-hidden">
              <img
                src={appIcon}
                className="w-full h-full object-contain p-1"
                alt="MegaSena Monitor"
              />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-widest leading-none flex items-center gap-2">
                MegaSena
                {isBackgroundSyncing && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" title="Sincronizando com a Caixa..." />
                )}
              </h1>
              <p className="text-[10px] font-bold text-green-sphere tracking-[0.2em] uppercase opacity-70 flex items-center gap-1.5">
                Monitor
                {isBackgroundSyncing && (
                  <span className="text-[8px] font-black text-green-sphere/80 lowercase tracking-normal animate-pulse bg-green-sphere/10 px-1.5 py-0.5 rounded-md">sincronizando...</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-border"
              title="Configurações"
            >
              <span className="text-xl opacity-60">⚙️</span>
            </button>
            <button
              disabled={verificando}
              onClick={handleVerificarResultados}
              className="h-10 px-4 bg-primary text-primary-foreground rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="text-xs font-black uppercase tracking-widest">
                {verificando ? "Conferindo..." : "Verificar"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Seção 1: Minhas Apostas */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
              MINHAS APOSTAS ({apostas.length}/10)
            </h2>
            <button
              onClick={() => setShowCadastroModal(true)}
              className="px-4 py-2.5 bg-green-sphere hover:bg-green-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              title="Cadastrar Nova Aposta (Cmd+N)"
            >
              <span className="text-sm leading-none">+</span> Nova Aposta
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando apostas...
            </div>
          ) : (
            <ListaApostas
              apostas={apostas}
              onApostaExcluida={carregarApostas}
            />
          )}
        </section>

        <div className="border-t border-border my-8"></div>

        {/* Seção 2: Últimos Resultados */}
        {ultimosResultados.length > 0 && (
          <section className="mb-10 overflow-hidden">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Últimos Resultados
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
              {ultimosResultados.map((res) => (
                <div
                  key={res.concurso}
                  className="glass-card flex-shrink-0 p-3.5 rounded-2xl border border-border min-w-[190px] shadow-sm hover:shadow-md transition-all duration-300 bg-card"
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-black text-foreground">
                      C {res.concurso}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {res.dataSorteio}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {res.numerosSorteados.map((num: number) => (
                      <NumeroEsfera
                        key={num}
                        numero={num}
                        selecionado
                        tamanho="small"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <Toaster position="bottom-right" />

      {/* Modal de cadastro de nova aposta */}
      {showCadastroModal && (
        <div 
          onClick={() => setShowCadastroModal(false)}
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto scrollbar-hide transform animate-in slide-in-from-bottom-8 duration-500 rounded-3xl"
          >
            <FormCadastro 
              onApostaAdicionada={() => {
                carregarApostas();
                setShowCadastroModal(false);
              }} 
            />
          </div>
        </div>
      )}

      {/* Modal exibindo o último sorteio detectado na abertura */}
      {lastResultado && (
        <ModalResultado
          resultado={lastResultado}
          apostas={apostas}
          onClose={() => setLastResultado(null)}
        />
      )}

      {/* Modal de Configurações gerais */}
      {showSettings && (
        <SettingsModal
          initialView={settingsView}
          onClose={() => {
            setShowSettings(false);
            setSettingsView("settings");
          }}
        />
      )}
    </div>
  );
}

export default App;
