/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is licensed under the MIT License.
 */

import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FormCadastro } from './components/FormCadastro';
import { ListaApostas } from './components/ListaApostas';
import { NumeroEsfera } from './components/NumeroEsfera';
import { ModalResultado } from './components/ModalResultado';
import { SettingsModal } from './components/SettingsModal';
import { listen } from '@tauri-apps/api/event';
import { SettingsService } from './services/settings';
import appIcon from './assets/app-icon.png';
import * as tauri from './services/tauri';
import { Aposta, Resultado } from './types';
import './App.css';

function App() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [ultimosResultados, setUltimosResultados] = useState<Resultado[]>([]);
  const [lastResultado, setLastResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'settings' | 'about' | 'help'>('settings');
  const [initError, setInitError] = useState<string | null>(null);
  
  const isSyncing = useRef(false);

  const carregarApostas = async () => {
    console.log('[App] Carregando apostas...');
    setLoading(true);
    try {
      const data = await tauri.listarApostas();
      console.log('[App] Apostas carregadas:', data.length);
      setApostas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[App] Erro ao carregar apostas:', error);
      setApostas([]);
      // Não bloquear a UI completamente por isso
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarResultados = async () => {
    if (apostas.length === 0) {
      toast.error('Nenhuma aposta cadastrada para verificar.', { icon: '⚠️' });
      return;
    }

    setVerificando(true);
    try {
      const concursosUnicos = Array.from(new Set<number>(
        apostas.flatMap(aposta => 
          Array.from({ length: aposta.quantidadeConcursos }, (_, i) => aposta.concursoInicial + i)
        )
      ));

      if (concursosUnicos.length === 0) return;

      toast.loading(`Conferindo ${concursosUnicos.length} concurso(s)...`, { id: 'verificando' });

      const results = await Promise.allSettled(
        concursosUnicos.map(concurso => tauri.verificarResultados(concurso))
      );

      let verificadas = results.filter(r => r.status === 'fulfilled').length;
      let erros = results.length - verificadas;

      toast.dismiss('verificando');
      if (verificadas > 0) toast.success(`${verificadas} concurso(s) conferido(s)!`, { icon: '🎉' });
      if (erros > 0) toast.error(`${erros} concurso(s) indisponíveis.`);

      await carregarApostas();
    } catch (error) {
      console.error('[App] Erro na conferência:', error);
      toast.error('Erro na conferência.');
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    console.log('[App] Componente Montado');
    
    // Aplicar tema
    try {
      SettingsService.applyTheme(SettingsService.getTheme());
    } catch (e) {
      console.error('[App] Erro ao aplicar tema:', e);
    }

    const syncResultados = async (showSplash: boolean = false) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      
      console.log('[App] Sincronização Iniciada');
      try {
        const ultimo = await tauri.obterUltimoConcurso();
        console.log('[App] Último concurso detectado:', ultimo);
        
        const resultados = await tauri.carregarUltimosResultados(ultimo, 36);
        console.log('[App] Resultados sincronizados:', resultados.length);
        
        if (Array.isArray(resultados) && resultados.length > 0) {
          setUltimosResultados(resultados.slice(0, 5));
          if (showSplash) setLastResultado(resultados[0]);
          
          if (resultados[0].concurso < ultimo) {
            toast.error(`Concurso ${ultimo} ainda não processado oficialmente.`, { icon: '⌛' });
          }
        }
      } catch (error: any) {
        console.error('[App] Erro na sincronização:', error);
        if (error.toString().includes('bridge not available')) {
          setInitError('Erro de Conexão: O Tauri Bridge não está disponível.');
        }
      } finally {
        await carregarApostas();
        isSyncing.current = false;
        console.log('[App] Sincronização Finalizada');
      }
    };

    syncResultados(true);

    // Listeners
    let lastDate = new Date().toLocaleDateString();
    const interval = setInterval(() => {
      const current = new Date().toLocaleDateString();
      if (current !== lastDate) {
        lastDate = current;
        syncResultados(false);
      }
    }, 60000);

    const unlistenShow = listen('window-show', () => syncResultados(false));
    const unlistenView = listen('open-view', (event: { payload: string }) => {
      setSettingsView(event.payload as any);
      setShowSettings(true);
    });

    return () => {
      clearInterval(interval);
      unlistenShow.then(f => f());
      unlistenView.then(f => f());
    };
  }, []);

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
        <h1 className="text-xl font-black text-red-500 mb-4">Falha na Inicialização</h1>
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <header className="p-6 pb-2 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="container mx-auto max-w-lg flex justify-between items-center h-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-sphere rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all cursor-default overflow-hidden">
               <img src={appIcon} className="w-full h-full object-contain p-1" alt="MegaSena Monitor" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">MegaSena</h1>
              <p className="text-[10px] font-bold text-green-sphere tracking-[0.2em] uppercase opacity-70">Monitor</p>
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
                {verificando ? 'Conferindo...' : 'Verificar'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8 px-4">
        <section className="mb-8">
          <FormCadastro onApostaAdicionada={carregarApostas} />
        </section>

        <div className="border-t border-border my-8"></div>

        {ultimosResultados.length > 0 && (
          <section className="mb-10 overflow-hidden">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Últimos Resultados
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
              {ultimosResultados.map((res) => (
                <div key={res.concurso} className="glass-card flex-shrink-0 p-5 rounded-2xl border border-border min-w-[260px] shadow-sm hover:shadow-md transition-all duration-300 bg-card">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-foreground">C {res.concurso}</span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{res.dataSorteio}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {res.numerosSorteados.map((num: number) => (
                      <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
              MINHAS APOSTAS ({apostas.length}/10)
            </h2>
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
      </div>
      <Toaster position="bottom-right" />
      
      {lastResultado && (
        <ModalResultado 
          resultado={lastResultado} 
          onClose={() => setLastResultado(null)} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          initialView={settingsView}
          onClose={() => {
            setShowSettings(false);
            setSettingsView('settings');
          }} 
        />
      )}
    </div>
  );
}

export default App;
