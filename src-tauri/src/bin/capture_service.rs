use megasena_app_lib::{api, database::Database};
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== MegaSena Standalone Capture Service ===");

    // 1. Localizar Banco de Dados
    // Em produção via Tauri: ~/Library/Application Support/com.zedicoes.megasena/megasena.db
    let home = std::env::var("HOME").expect("HOME não definida");
    let mut db_path = PathBuf::from(home);
    db_path.push("Library/Application Support/com.zedicoes.megasena");
    
    // Garantir que a pasta existe (embora o app já deva ter criado)
    std::fs::create_dir_all(&db_path)?;
    db_path.push("megasena.db");

    println!("Conectando ao banco: {:?}", db_path);
    let db = Database::new(db_path.clone())?;
    db.init()?;

    // 2. Identificar Último Concurso (Âncora com Exploração)
    println!("\n[1/3] Identificando Horizonte de Concursos...");
    let ultimo_numero = api::obter_ultimo_concurso_numero().map_err(|e| e.to_string())?;
    println!("Último concurso detectado: #{}", ultimo_numero);

    // 3. Executar Regra dos 36 (Puxar os últimos 36)
    let quantidade = 36;
    let concurso_inicial = ultimo_numero - quantidade + 1;
    let range = (concurso_inicial..=ultimo_numero).rev();

    println!("\n[2/3] Iniciando Captura de {} concursos ({} até {})...", quantidade, ultimo_numero, concurso_inicial);
    
    let mut capturados = 0;
    let mut anchor_success = false;

    for concurso in range {
        match api::verificar_resultado(concurso) {
            Ok(resultado) => {
                db.salvar_resultado(&resultado)?;
                db.processar_acertos_concurso(concurso, &resultado.numeros_sorteados)?;
                println!("  ✅ Concurso #{}: Sorteado em {} - [{}]", 
                    resultado.concurso, 
                    resultado.data_sorteio,
                    resultado.numeros_sorteados.iter().map(|n| n.to_string()).collect::<Vec<_>>().join(", ")
                );
                capturados += 1;
                if concurso == ultimo_numero {
                    anchor_success = true;
                }
            }
            Err(e) => {
                if concurso == ultimo_numero {
                    eprintln!("  ⚠️ ALERTA: Último concurso (#{}) ainda não disponível nas APIs!", concurso);
                }
                eprintln!("  ❌ Concurso #{}: Falhou ({})", concurso, e);
            }
        }
    }

    // 4. Mostrar Resultado Final
    println!("\n[3/3] Resumo da Captura:");
    println!("--------------------------------------------------");
    println!("Total solicitado: {}", quantidade);
    println!("Total capturado:  {}", capturados);
    if !anchor_success {
        println!("Aviso: O sorteio mais recente (#{}) não foi encontrado.", ultimo_numero);
    }
    println!("Status do DB:     Atualizado em {:?}", db_path);
    println!("--------------------------------------------------");
    
    if capturados > 0 {
        println!("🚀 Sucesso! Os dados estão prontos para o Aplicativo.");
    } else {
        println!("⚠️ Nenhum novo dado foi capturado. Verifique sua conexão ou status das APIs.");
    }

    Ok(())
}
