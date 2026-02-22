// Lib.rs - Main library file for Tauri app

pub mod api;
pub mod commands;
pub mod database;
pub mod models;

use database::Database;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            // Inicializar database
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");

            let db_path = app_dir.join("megasena.db");
            let db = Database::new(db_path).expect("failed to initialize database");
            db.init().expect("failed to create tables");

            // Gerenciar estado do database
            app.manage(Mutex::new(db));

            // Configurar Menu de Aplicativo (macOS)
            let m_about = MenuItem::with_id(app, "about", "Sobre o MegaSena Monitor", true, None::<&str>)?;
            let m_settings = MenuItem::with_id(app, "settings", "Preferências...", true, None::<&str>)?;
            let m_help = MenuItem::with_id(app, "help", "Ajuda", true, None::<&str>)?;
            let m_quit = MenuItem::with_id(app, "quit", "Encerrar", true, Some("CmdOrCtrl+Q"))?;
            
            let menu = Menu::with_items(app, &[&m_about, &m_settings, &m_help, &m_quit])?;
            app.set_menu(menu)?;

            // Event Handler para o Menu
            app.on_menu_event(move |app, event| {
                match event.id.as_ref() {
                    "about" => {
                        let _ = app.emit("open-view", "about");
                        if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); }
                    }
                    "settings" => {
                        let _ = app.emit("open-view", "settings");
                        if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); }
                    }
                    "help" => {
                        let _ = app.emit("open-view", "help");
                        if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            });

            // Configurar Tray Icon
            let t_mostrar = MenuItem::with_id(app, "mostrar", "Mostrar Monitor", true, None::<&str>)?;
            let t_sair = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&t_mostrar, &t_sair])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
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
        .run(|_app_handle, event| match event {
            tauri::RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } => {
                if label == "main" {
                    api.prevent_close();
                    if let Some(window) = _app_handle.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
            }
            _ => {}
        });
}
