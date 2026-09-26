use tauri_plugin_notification::NotificationExt;

#[tauri::command]
fn show_native_notification(app: tauri::AppHandle, title: String, body: Option<String>) {
    let mut builder = app.notification().builder().title(title);
    if let Some(b) = body {
        builder = builder.body(b);
    }
    let _ = builder.show();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![show_native_notification])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
