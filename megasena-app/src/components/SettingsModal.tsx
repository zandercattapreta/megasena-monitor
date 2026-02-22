import { useState, useEffect } from 'react';
import { SettingsService, Theme } from '../services/settings';
import appIcon from '../assets/app-icon.png';

interface SettingsModalProps {
  onClose: () => void;
  initialView?: ModalView;
}

type ModalView = 'settings' | 'about' | 'help';

export function SettingsModal({ onClose, initialView = 'settings' }: SettingsModalProps) {
  const [theme, setTheme] = useState<Theme>(SettingsService.getTheme());
  const [autostart, setAutostart] = useState(false);
  const [view, setView] = useState<ModalView>(initialView);

  useEffect(() => {
    SettingsService.isAutostartEnabled().then(setAutostart);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    SettingsService.setTheme(newTheme);
  };

  const handleAutostartChange = async (enabled: boolean) => {
    setAutostart(enabled);
    await SettingsService.setAutostart(enabled);
  };

  const navItem = (target: ModalView, label: string) => (
    <button 
      onClick={() => setView(target)}
      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
        view === target 
        ? 'bg-green-sphere text-white' 
        : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500 border border-border flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border bg-card/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black text-foreground uppercase tracking-wider">
              {view === 'settings' ? 'Configurações' : view === 'help' ? 'Ajuda' : 'Sobre'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            {navItem('settings', 'Preferências')}
            {navItem('help', 'Ajuda')}
            {navItem('about', 'Sobre')}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {view === 'settings' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              {/* Theme Selection */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tema Visual</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`py-3 rounded-2xl text-xs font-bold uppercase transition-all ${
                        theme === t 
                        ? 'bg-green-sphere text-white shadow-lg' 
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {t === 'light' ? '☀️ Claro' : t === 'dark' ? '🌙 Escuro' : '⚙️ Auto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autostart */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border/50">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Inicializar com sistema</h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">Abrir o app automaticamente ao ligar o computador</p>
                </div>
                <button 
                  onClick={() => handleAutostartChange(!autostart)}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${autostart ? 'bg-green-sphere' : 'bg-accent'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${autostart ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {view === 'help' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl">
                <h4 className="text-[10px] font-black text-yellow-800 dark:text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span>⚠️</span> Aviso Importante
                </h4>
                <p className="text-xs text-yellow-900 dark:text-yellow-200 leading-relaxed">
                  Este <strong>não é um aplicativo de apostas</strong>. Não realizamos jogos, não recebemos pagamentos e não temos vínculo formal com a Caixa Econômica Federal.
                </p>
                <p className="text-xs text-yellow-900 dark:text-yellow-200 mt-2 leading-relaxed">
                  O MegaSena Monitor é estritamente uma ferramenta de <strong>conferência e acompanhamento</strong> de resultados para uso pessoal.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Como usar</h4>
                  <p className="text-xs leading-relaxed">
                    1. Cadastre suas dezenas clicando no grid numérico.<br/>
                    2. Informe o concurso inicial e a quantidade de sorteios (Teimosinha).<br/>
                    3. Clique em "Verificar" para baixar os resultados oficiais e conferir seus acertos automaticamente.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sincronização</h4>
                  <p className="text-xs leading-relaxed">
                    Os resultados são buscados diretamente da API do Portal de Loterias. Se a API estiver instável, o app tentará fontes alternativas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === 'about' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center">
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="w-20 h-20 bg-green-sphere rounded-[2.5rem] flex items-center justify-center shadow-xl transform -rotate-6">
                  <img src={appIcon} className="w-14 h-14 object-contain" alt="Logo" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">MegaSena Monitor</h3>
                  <p className="text-[10px] font-bold text-green-sphere uppercase tracking-[0.3em] opacity-70">Versão 1.0.0</p>
                </div>
              </div>

              <div className="space-y-1 py-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Criado por</p>
                <p className="text-sm font-bold text-foreground">Zander Catta Preta</p>
                <p className="text-xs text-muted-foreground">zander.cattapreta@gmail.com</p>
              </div>

              <div className="space-y-1 py-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Licença</p>
                <p className="text-xs font-bold text-foreground">MIT Open Source</p>
              </div>

              <div className="space-y-1 py-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Apoio Tecnológico</p>
                <div className="flex flex-wrap justify-center gap-2 pt-1 px-4">
                   {['Claude Code', 'Figma Make', 'Google Antigravity'].map(tool => (
                     <span key={tool} className="px-2 py-1 bg-muted rounded-lg text-[10px] font-bold text-muted-foreground border border-border">
                       {tool}
                     </span>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-muted/30 text-center border-t border-border">
          <p className="text-[10px] text-muted-foreground">2025 • Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}
