use std::{
    fs,
    path::PathBuf,
    sync::atomic::{AtomicBool, Ordering},
};

use tauri::{
    AppHandle, Manager, WindowEvent,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

const MAIN: &str = "main";
const BOARD_FILE: &str = "board.json";

/// So posicao e tamanho: a visibilidade quem controla e o app (bandeja)
fn window_state_flags() -> StateFlags {
    StateFlags::POSITION | StateFlags::SIZE
}

// ------------------------------------------------------------------ dados

/// %APPDATA%\com.lokalban.widget\board.json
fn board_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(dir.join(BOARD_FILE))
}

/// Devolve o JSON salvo, ou None se ainda nao existe arquivo
#[tauri::command]
fn load_board(app: AppHandle) -> Result<Option<String>, String> {
    let path = board_path(&app)?;
    match fs::read_to_string(&path) {
        Ok(json) => Ok(Some(json)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("Falha ao ler {}: {e}", path.display())),
    }
}

/// Grava de forma segura: escreve num .tmp, guarda a versao anterior em
/// board.bak.json e so entao substitui o arquivo
#[tauri::command]
fn save_board(app: AppHandle, json: String) -> Result<(), String> {
    serde_json::from_str::<serde_json::Value>(&json).map_err(|e| format!("JSON invalido: {e}"))?;

    let path = board_path(&app)?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }

    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    if path.exists() {
        let _ = fs::copy(&path, path.with_extension("bak.json"));
    }
    fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

// ------------------------------------------------------------------ janela

/// Ao fechar (botao vermelho / Alt+F4): true esconde na bandeja, false sai.
/// Comeca escondendo; o app manda a configuracao salva assim que le o board.json
struct CloseToTray(AtomicBool);

#[tauri::command]
fn set_close_to_tray(state: tauri::State<CloseToTray>, enabled: bool) {
    state.0.store(enabled, Ordering::Relaxed);
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(MAIN) {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn toggle_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(MAIN) {
        if w.is_visible().unwrap_or(false) {
            let _ = w.hide();
        } else {
            show_main(app);
        }
    }
}

fn quit(app: &AppHandle) {
    let _ = app.save_window_state(window_state_flags());
    app.exit(0);
}

// ------------------------------------------------------------------ bandeja

fn build_tray(app: &tauri::App) -> tauri::Result<()> {
    let autostart_on = app.autolaunch().is_enabled().unwrap_or(false);

    let toggle = MenuItem::with_id(app, "toggle", "Mostrar / esconder", true, None::<&str>)?;
    let autostart = CheckMenuItem::with_id(
        app,
        "autostart",
        "Iniciar com o Windows",
        true,
        autostart_on,
        None::<&str>,
    )?;
    let folder = MenuItem::with_id(app, "folder", "Abrir pasta dos dados", true, None::<&str>)?;
    let exit = MenuItem::with_id(app, "quit", "Sair do LokalBan", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &toggle,
            &PredefinedMenuItem::separator(app)?,
            &autostart,
            &folder,
            &PredefinedMenuItem::separator(app)?,
            &exit,
        ],
    )?;

    let autostart_item = autostart.clone();
    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("LokalBan")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "toggle" => toggle_main(app),
            "autostart" => {
                let manager = app.autolaunch();
                let result = if manager.is_enabled().unwrap_or(false) {
                    manager.disable()
                } else {
                    manager.enable()
                };
                if let Err(e) = result {
                    eprintln!("Falha ao alterar a inicializacao automatica: {e}");
                }
                let _ = autostart_item.set_checked(manager.is_enabled().unwrap_or(false));
            }
            "folder" => {
                if let Ok(dir) = app.path().app_data_dir() {
                    let _ = fs::create_dir_all(&dir);
                    let _ = app.opener().open_path(dir.to_string_lossy(), None::<&str>);
                }
            }
            "quit" => quit(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // clique esquerdo no icone mostra/esconde; o direito abre o menu
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

/// No app instalado, liga "Iniciar com o Windows" na primeira execucao.
/// Depois disso respeita o que o usuario escolher no menu da bandeja.
#[cfg(not(debug_assertions))]
fn enable_autostart_on_first_run(app: &AppHandle) {
    let Ok(dir) = app.path().app_data_dir() else {
        return;
    };
    let marker = dir.join(".autostart-configured");
    if marker.exists() {
        return;
    }
    if app.autolaunch().enable().is_ok() {
        let _ = fs::create_dir_all(&dir);
        let _ = fs::write(&marker, "");
    }
}

// ------------------------------------------------------------------ app

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // precisa ser o primeiro: abrir o app de novo so mostra a janela existente
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main(app)
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(window_state_flags())
                .build(),
        )
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            enable_autostart_on_first_run(app.handle());

            build_tray(app)?;
            // a janela nasce invisivel (tauri.conf.json) para nao "pular" de
            // lugar quando a posicao salva e restaurada
            show_main(app.handle());
            Ok(())
        })
        .manage(CloseToTray(AtomicBool::new(true)))
        .on_window_event(|window, event| {
            // botao vermelho / Alt+F4: esconde (volta pela bandeja) ou sai do app,
            // conforme a configuracao "Ao fechar"
            if let WindowEvent::CloseRequested { api, .. } = event
                && window.label() == MAIN
            {
                api.prevent_close();
                let app = window.app_handle();
                if app.state::<CloseToTray>().0.load(Ordering::Relaxed) {
                    let _ = app.save_window_state(window_state_flags());
                    let _ = window.hide();
                } else {
                    quit(app);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![load_board, save_board, set_close_to_tray])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
