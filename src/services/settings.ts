/*
 * PROGRAMA: settings.ts
 * DESCRIÇÃO: Este serviço gerencia as preferências do usuário relacionadas a configurações locais.
 *            Controla o tema visual da aplicação (Claro, Escuro ou Automático integrado ao OS),
 *            registra/remove listeners de mudança de esquema de cores do sistema e manipula
 *            a ativação ou desativação de inicialização automática junto com o sistema operacional
 *            (autostart) através de plugins nativos do Tauri.
 * QUEM O CHAMA: Chamado por `App.tsx` (na inicialização) e por `SettingsModal.tsx` (nas configurações de preferências).
 * QUEM ELE CHAMA:
 *   - Plugins Tauri: `@tauri-apps/plugin-autostart` (`enable`, `disable`, `isEnabled`).
 *   - APIs do Navegador: `window.matchMedia`, `window.document` e `localStorage`.
 * O QUE ESPERA RECEBER:
 *   - Varia conforme o método chamado (preferência de tema ou booleano para habilitar/desabilitar inicialização).
 * O QUE ENVIA:
 *   - Métodos getter retornam dados imediatos (ou promessas resolvendo em booleanos).
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the MIT License
 */

import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

export type Theme = 'light' | 'dark' | 'system';

export const SettingsService = {
  /// Recupera o tema atual salvo no localStorage, retornando 'system' como fallback padrão.
  getTheme(): Theme {
    return (localStorage.getItem('theme') as Theme) || 'system';
  },

  /// Salva e aplica um novo tema visual no aplicativo.
  setTheme(theme: Theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },

  /// Aplica fisicamente as classes CSS no elemento raiz do documento HTML para refletir o tema.
  applyTheme(theme: Theme) {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Adiciona ou remove a classe 'dark' do elemento HTML
    const update = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Determina se deve usar escuro baseado no tema ou preferência do sistema
    const isDarkInitial = 
      theme === 'dark' || 
      (theme === 'system' && mediaQuery.matches);
    
    update(isDarkInitial);

    // Correção de Vazamento de Memória: remove listener anterior e anula a referência global
    // @ts-ignore
    if (window._themeListener) {
      // @ts-ignore
      mediaQuery.removeEventListener('change', window._themeListener);
      // @ts-ignore
      window._themeListener = undefined;
    }

    // Se estiver usando o tema automático do sistema, registra escuta para reações em tempo real
    if (theme === 'system') {
      const listener = (e: MediaQueryListEvent) => update(e.matches);
      mediaQuery.addEventListener('change', listener);
      // @ts-ignore
      window._themeListener = listener;
    }
  },

  /// Verifica se a inicialização automática do aplicativo está ativa no sistema operacional.
  async isAutostartEnabled(): Promise<boolean> {
    try {
      return await isEnabled();
    } catch (e) {
      console.error('Autostart check failed:', e);
      return false;
    }
  },

  /// Configura a inicialização automática do app junto com o boot do sistema operacional.
  async setAutostart(enabled: boolean) {
    try {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
    } catch (e) {
      console.error('Failed to update autostart:', e);
    }
  }
};
