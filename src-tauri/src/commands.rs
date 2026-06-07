/*
 * PROGRAMA: commands.rs
 * DESCRIÇÃO: Este arquivo expõe comandos Tauri assíncronos e síncronos para o frontend,
 *            atuando como a ponte (bridge) principal de controle. Ele recebe as requisições,
 *            valida os parâmetros recebidos do frontend e delega as operações reais
 *            para o módulo de banco de dados (`database.rs`) e o módulo de consulta externa (`api.rs`).
 * QUEM O CHAMA: Chamado pelo frontend React através do módulo de serviços do Tauri (`services/tauri.ts`).
 * QUEM ELE CHAMA: Chama funções do módulo de banco de dados (`database::Database`) e de integração (`api::*`).
 * O QUE ESPERA RECEBER:
 *   - Varia de acordo com o comando Tauri invocado (concursos, números selecionados, IDs de aposta, etc.).
 * O QUE ENVIA:
 *   - Retorna objetos serializados em JSON (como structs de Aposta, Resultado, vetores ou primitivos) encapsulados em `Result`.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

use crate::database::Database;
use crate::models::{Aposta, Resultado};
use crate::api;
use std::sync::Mutex;
use tauri::State;

/// Comando Tauri para cadastrar uma nova aposta de Mega-Sena.
///
/// - `db`: Estado compartilhado contendo a conexão segura com o SQLite.
/// - `numeros`: Lista de dezenas escolhidas (deve conter entre 6 e 20 números).
/// - `concurso_inicial`: Primeiro concurso em que o bilhete será monitorado.
/// - `quantidade_concursos`: Número de concursos válidos da aposta (ex: Teimosinha de 1 a 12).
///
/// Retorna a struct `Aposta` persistida ou erro em formato String.
#[tauri::command]
pub fn adicionar_aposta(
    db: State<'_, Mutex<Database>>,
    numeros: Vec<i32>,
    concurso_inicial: i32,
    quantidade_concursos: i32,
) -> Result<Aposta, String> {
    println!("Comando adicionar_aposta: concurso={}, qtd={}", concurso_inicial, quantidade_concursos);
    
    // Obtém lock do banco de dados de maneira thread-safe
    let db = db.lock().map_err(|e| e.to_string())?;
    
    // Validações básicas de negócio
    if numeros.len() < 6 || numeros.len() > 20 {
        return Err("Selecione entre 6 e 20 números".to_string());
    }
    
    if concurso_inicial <= 0 {
        return Err("Concurso inválido".to_string());
    }
    
    if quantidade_concursos < 1 || quantidade_concursos > 12 {
        return Err("Quantidade de concursos deve ser entre 1 e 12".to_string());
    }

    // Persiste e gera aposta com seus respectivos acertos calculados
    db.adicionar_aposta(numeros, concurso_inicial, quantidade_concursos)
        .map_err(|e| e.to_string())
}

/// Comando Tauri para listar todas as apostas ativas.
///
/// - `db`: Estado compartilhado com a conexão SQLite.
///
/// Retorna uma lista de apostas ativas cadastradas.
#[tauri::command]
pub fn listar_apostas(db: State<'_, Mutex<Database>>) -> Result<Vec<Aposta>, String> {
    println!("Comando listar_apostas recebido");
    let db = db.lock().map_err(|e| e.to_string())?;
    db.listar_apostas().map_err(|e| e.to_string())
}

/// Comando Tauri para deletar definitivamente uma aposta pelo ID.
///
/// - `db`: Estado compartilhado com a conexão SQLite.
/// - `id`: ID numérico identificador único da aposta.
#[tauri::command]
pub fn excluir_aposta(db: State<'_, Mutex<Database>>, id: i64) -> Result<(), String> {
    println!(">>> Comando excluir_aposta SOLICITADO para ID: {}", id);
    let db = db.lock().map_err(|e| e.to_string())?;
    match db.excluir_aposta(id) {
        Ok(_) => {
            println!(">>> Aposta {} EXCLUÍDA com sucesso do banco.", id);
            Ok(())
        },
        Err(e) => {
            let err_msg = format!("ERRO NO BANCO ao excluir aposta {}: {}", id, e);
            eprintln!("{}", err_msg);
            Err(err_msg)
        }
    }
}

/// Comando assíncrono para obter e processar o resultado de um concurso.
/// Aplica uma estratégia offline-first: consulta o banco local antes de consultar APIs externas.
///
/// - `db`: Estado compartilhado com a conexão SQLite.
/// - `concurso`: O concurso a ser verificado.
#[tauri::command]
pub async fn verificar_resultados(
    db: State<'_, Mutex<Database>>,
    concurso: i32,
) -> Result<Resultado, String> {
    println!("Comando verificar_resultados: concurso={}", concurso);

    // 1) Tenta o cache local primeiro (offline-first)
    {
        let db_lock = db.lock().map_err(|e| e.to_string())?;
        if let Ok(Some(cached)) = db_lock.obter_resultado(concurso) {
            // Garante que os acertos estão recalculados caso novas apostas tenham sido incluídas para este sorteio
            db_lock
                .processar_acertos_concurso(concurso, &cached.numeros_sorteados)
                .map_err(|e| e.to_string())?;
            return Ok(cached);
        }
    }

    // 2) Se não houver no cache local, busca na API de redes
    let resultado = api::verificar_resultado(concurso)?;

    // 3) Grava o resultado obtido na API localmente e processa os acertos das apostas
    let db_lock = db.lock().map_err(|e| e.to_string())?;
    db_lock
        .salvar_resultado(&resultado)
        .map_err(|e| e.to_string())?;
    db_lock
        .processar_acertos_concurso(concurso, &resultado.numeros_sorteados)
        .map_err(|e| e.to_string())?;

    Ok(resultado)
}

/// Comando assíncrono para carregar uma sequência de resultados recentes.
///
/// - `db`: Conexão com SQLite.
/// - `concurso_final`: O concurso de partida (mais recente).
/// - `quantidade`: Total de concursos anteriores a carregar de maneira sequencial.
#[tauri::command]
pub async fn carregar_ultimos_resultados(
    db: State<'_, Mutex<Database>>,
    concurso_final: i32,
    quantidade: i32,
) -> Result<Vec<Resultado>, String> {
    let mut resultados = Vec::new();
    let concurso_inicial = concurso_final - quantidade + 1;
    
    println!("Comando carregar_ultimos_resultados: {} concursos a partir de {}", quantidade, concurso_final);
    
    for concurso in (concurso_inicial..=concurso_final).rev() {
        // 1) Verifica se o resultado já está gravado localmente (cache)
        if let Ok(Some(cached)) = db
            .lock()
            .map_err(|e| e.to_string())?
            .obter_resultado(concurso)
        {
            resultados.push(cached);
            continue;
        }

        // 2) Se não, busca na API e grava no banco local para consultas futuras
        match api::verificar_resultado(concurso) {
            Ok(resultado) => {
                let db_lock = db.lock().map_err(|e| e.to_string())?;
                let _ = db_lock.salvar_resultado(&resultado);
                let _ = db_lock.processar_acertos_concurso(concurso, &resultado.numeros_sorteados);
                resultados.push(resultado);
            }
            Err(e) => {
                eprintln!("Aviso: Concurso {} ainda não disponível: {}", concurso, e);
            }
        }
    }
    
    Ok(resultados)
}

/// Comando assíncrono para expor o número do concurso mais recente.
#[tauri::command]
pub async fn obter_ultimo_concurso() -> Result<i32, String> {
    api::obter_ultimo_concurso_numero()
}

/// Função interna para contar quantos acertos existem entre a aposta e as dezenas sorteadas.
fn _calcular_acertos(numeros_aposta: &[i32], numeros_sorteados: &[i32]) -> i32 {
    numeros_aposta
        .iter()
        .filter(|n| numeros_sorteados.contains(n))
        .count() as i32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calcular_acertos_sena() {
        let aposta = vec![1, 2, 3, 4, 5, 6];
        let sorteio = vec![1, 2, 3, 4, 5, 6];
        assert_eq!(_calcular_acertos(&aposta, &sorteio), 6);
    }

    #[test]
    fn test_calcular_acertos_quadra() {
        let aposta = vec![1, 2, 3, 4, 5, 6];
        let sorteio = vec![1, 2, 3, 4, 10, 11];
        assert_eq!(_calcular_acertos(&aposta, &sorteio), 4);
    }

    #[test]
    fn test_calcular_acertos_zero() {
        let aposta = vec![1, 2, 3, 4, 5, 6];
        let sorteio = vec![10, 11, 12, 13, 14, 15];
        assert_eq!(_calcular_acertos(&aposta, &sorteio), 0);
    }
}
