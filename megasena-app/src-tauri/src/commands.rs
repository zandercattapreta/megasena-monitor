/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

use crate::database::Database;
use crate::models::{Aposta, Resultado};
use crate::api;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn adicionar_aposta(
    db: State<'_, Mutex<Database>>,
    numeros: Vec<i32>,
    concurso_inicial: i32,
    quantidade_concursos: i32,
) -> Result<Aposta, String> {
    println!("Comando adicionar_aposta: concurso={}, qtd={}", concurso_inicial, quantidade_concursos);
    let db = db.lock().map_err(|e| e.to_string())?;
    
    // Validações
    if numeros.len() < 6 || numeros.len() > 20 {
        return Err("Selecione entre 6 e 20 números".to_string());
    }
    
    if concurso_inicial <= 0 {
        return Err("Concurso inválido".to_string());
    }
    
    if quantidade_concursos < 1 || quantidade_concursos > 12 {
        return Err("Quantidade de concursos deve ser entre 1 e 12".to_string());
    }

    db.adicionar_aposta(numeros, concurso_inicial, quantidade_concursos)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn listar_apostas(db: State<'_, Mutex<Database>>) -> Result<Vec<Aposta>, String> {
    println!("Comando listar_apostas recebido");
    let db = db.lock().map_err(|e| e.to_string())?;
    db.listar_apostas().map_err(|e| e.to_string())
}#[tauri::command]
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




#[tauri::command]
pub fn verificar_resultados(
    db: State<'_, Mutex<Database>>,
    concurso: i32,
) -> Result<Resultado, String> {
    println!("Comando verificar_resultados: concurso={}", concurso);
    // Buscar resultado da API
    let resultado = api::verificar_resultado(concurso)?;
    
    // Salvar no banco de dados e processar acertos
    let db = db.lock().map_err(|e| e.to_string())?;
    db.salvar_resultado(&resultado).map_err(|e| e.to_string())?;
    db.processar_acertos_concurso(concurso, &resultado.numeros_sorteados).map_err(|e| e.to_string())?;
    
    Ok(resultado)
}

#[tauri::command]
pub fn carregar_ultimos_resultados(
    db: State<'_, Mutex<Database>>,
    concurso_final: i32,
    quantidade: i32,
) -> Result<Vec<Resultado>, String> {
    let mut resultados = Vec::new();
    let concurso_inicial = concurso_final - quantidade + 1;
    
    println!("Comando carregar_ultimos_resultados: {} concursos a partir de {}", quantidade, concurso_final);
    
    for concurso in (concurso_inicial..=concurso_final).rev() {
        match api::verificar_resultado(concurso) {
            Ok(resultado) => {
                // Salvar no banco e processar
                let db_lock = db.lock().map_err(|e| e.to_string())?;
                let _ = db_lock.salvar_resultado(&resultado);
                let _ = db_lock.processar_acertos_concurso(concurso, &resultado.numeros_sorteados);
                drop(db_lock);
                
                resultados.push(resultado);
            }
            Err(e) => {
                eprintln!("Aviso: Concurso {} ainda não disponível: {}", concurso, e);
                // Continuar para coletar o restante do histórico de 12
            }
        }
    }
    
    Ok(resultados)
}

#[tauri::command]
pub fn obter_ultimo_concurso() -> Result<i32, String> {
    api::obter_ultimo_concurso_numero()
}

/// Calcular acertos entre números apostados e sorteados
fn calcular_acertos(numeros_aposta: &[i32], numeros_sorteados: &[i32]) -> i32 {
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
        assert_eq!(calcular_acertos(&aposta, &sorteio), 6);
    }

    #[test]
    fn test_calcular_acertos_quadra() {
        let aposta = vec![1, 2, 3, 4, 5, 6];
        let sorteio = vec![1, 2, 3, 4, 10, 11];
        assert_eq!(calcular_acertos(&aposta, &sorteio), 4);
    }

    #[test]
    fn test_calcular_acertos_zero() {
        let aposta = vec![1, 2, 3, 4, 5, 6];
        let sorteio = vec![10, 11, 12, 13, 14, 15];
        assert_eq!(calcular_acertos(&aposta, &sorteio), 0);
    }
}
