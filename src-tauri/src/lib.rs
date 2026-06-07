/*
 * PROGRAMA: lib.rs
 * DESCRIÇÃO: Este arquivo é o ponto de entrada principal da biblioteca Rust do Tauri.
 *            Ele inicializa o banco de dados SQLite local, registra o estado do banco na aplicação,
 *            inicializa uma thread em background (cron) para verificar novos resultados de sorteios a cada hora,
 *            constrói e configura os menus da barra do sistema, o ícone de bandeja (Tray Icon),
 *            registra os handlers para comandos expostos ao frontend e configura o comportamento
 *            de fechar para esconder a janela na bandeja (minimizar para tray).
 * QUEM O CHAMA: Executado pela função `main` do binário (`main.rs`).
 * QUEM ELE CHAMA: Inicializa e interage com `database.rs`, `api.rs` e as APIs do framework Tauri.
 * O QUE ESPERA RECEBER:
 *   - Nenhum parâmetro de entrada na função `run`.
 * O QUE ENVIA:
 *   - Não retorna valores diretos; assume a thread principal e gerencia o ciclo de vida do aplicativo.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

pub mod api;
pub mod commands;
pub mod database;
pub mod models;

use database::Database;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, Submenu},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

/// Inicializa e configura toda a aplicação Tauri.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Adiciona o plugin padrão de abertura de URLs/arquivos
        .plugin(tauri_plugin_opener::init())
        // Adiciona suporte a inicialização automática junto com o sistema operacional
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        // Adiciona suporte a notificações do sistema operacional
        .plugin(tauri_plugin_notification::init())
        // Bloco de configuração inicial executado ao iniciar a janela
        .setup(|app| {
            // Inicializar base de dados no diretório de dados da aplicação (App Data Dir)
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");

            let db_path = app_dir.join("megasena.db");
            let db = Database::new(db_path).expect("failed to initialize database");
            db.init().expect("failed to create tables");

            // Registra o banco de dados encapsulado em Mutex no gerenciador de estado do Tauri
            app.manage(Mutex::new(db));

            // Iniciar Verificador em Background (Cron Job) que roda a cada 1 hora
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                loop {
                    // Dorme por 1 hora antes de verificar novamente
                    std::thread::sleep(std::time::Duration::from_secs(60 * 60));
                    println!("[Cron] Verificando novos resultados em background...");

                    // Busca o número do último concurso
                    if let Ok(ultimo_concurso) = api::obter_ultimo_concurso_numero() {
                        let db_mutex = app_handle.state::<Mutex<Database>>();
                        if let Ok(db) = db_mutex.lock() {
                            // Se este concurso ainda não estiver no banco, atualiza e confere as apostas
                            if let Ok(None) = db.obter_resultado(ultimo_concurso) {
                                if let Ok(resultado) = api::verificar_resultado(ultimo_concurso) {
                                    let _ = db.salvar_resultado(&resultado);
                                    let _ = db.processar_acertos_concurso(
                                        ultimo_concurso,
                                        &resultado.numeros_sorteados,
                                    );

                                    // Se o usuário tiver um prêmio (>= 4 acertos), envia uma notificação no OS
                                    if let Ok(apostas) = db.listar_apostas() {
                                        for aposta in apostas {
                                            if let Some(&acertos) =
                                                aposta.acertos.get(&ultimo_concurso)
                                            {
                                                if acertos >= 4 {
                                                    use tauri_plugin_notification::NotificationExt;
                                                    let premio = match acertos {
                                                        4 => "Quadra",
                                                        5 => "Quina",
                                                        6 => "Sena",
                                                        _ => "",
                                                    };
                                                    let msg = format!(
                                                        "Você acertou uma {} no concurso {}!",
                                                        premio, ultimo_concurso
                                                    );
                                                    let _ = app_handle
                                                        .notification()
                                                        .builder()
                                                        .title("MegaSena Monitor - Você Ganhou! 🍀")
                                                        .body(&msg)
                                                        .show();
                                                }
                                            }
                                        }
                                    }

                                    // Emite evento para o frontend atualizar sua exibição
                                    let _ = app_handle.emit("novo-resultado", ());
                                }
                            }
                        };
                    }
                }
            });

            // Configurar Menu de Aplicativo (macOS)
            let m_about =
                MenuItem::with_id(app, "about", "Sobre o MegaSena Monitor", true, None::<&str>)?;
            let m_quit = MenuItem::with_id(app, "quit", "Fechar (QUIT)", true, Some("CmdOrCtrl+Q"))?;

            // Submenu principal "MegaSena Monitor" (ao lado do logo da Maçã no macOS)
            let app_submenu = Submenu::with_items(
                app,
                "MegaSena Monitor",
                true,
                &[&m_about, &m_quit],
            )?;

            let menu = Menu::with_items(app, &[&app_submenu])?;
            app.set_menu(menu)?;

            // Event Handler para o Menu principal do app
            app.on_menu_event(move |app, event| match event.id.as_ref() {
                "about" => {
                    let _ = app.emit("open-view", "about");
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "quit" => {
                    // Encerra imediatamente o processo do aplicativo
                    std::process::exit(0);
                }
                _ => {}
            });

            // Configurar Menu do Ícone na Bandeja do Sistema (Tray Menu)
            let t_mostrar =
                MenuItem::with_id(app, "mostrar", "Mostrar Monitor", true, None::<&str>)?;
            let t_sair = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&t_mostrar, &t_sair])?;

            // Inicializar e configurar o Ícone da Bandeja do Sistema
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "mostrar" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("window-show", ());
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("window-show", ());
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Registra os comandos do Rust para uso no Frontend
        .invoke_handler(tauri::generate_handler![
            commands::adicionar_aposta,
            commands::listar_apostas,
            commands::excluir_aposta,
            commands::verificar_resultados,
            commands::carregar_ultimos_resultados,
            commands::obter_ultimo_concurso,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        // Controla o fechamento de janela para ocultá-la em vez de finalizar o aplicativo
        .run(|_app_handle, event| match event {
            tauri::RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } => {
                if label == "main" {
                    // Previne o fechamento real e esconde a janela
                    api.prevent_close();
                    if let Some(window) = _app_handle.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
            }
            _ => {}
        });
}
