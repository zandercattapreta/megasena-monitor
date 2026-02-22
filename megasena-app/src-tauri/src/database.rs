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

// Database operations for MegaSena App

use rusqlite::{params, Connection, Result};
use serde_json;
use std::path::PathBuf;
use crate::models::Aposta;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        // Garantir que chaves estrangeiras estejam ativas
        let _ = conn.execute("PRAGMA foreign_keys = ON;", []);
        Ok(Database { conn })
    }

    pub fn init(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS apostas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numeros TEXT NOT NULL,
                concurso_inicial INTEGER NOT NULL,
                quantidade_concursos INTEGER NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativa BOOLEAN DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS resultados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concurso INTEGER NOT NULL UNIQUE,
                numeros_sorteados TEXT NOT NULL,
                data_sorteio DATE,
                acumulado BOOLEAN,
                valor_premio REAL,
                ganhadores INTEGER,
                valor_total REAL,
                data_verificacao DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS apostas_resultados (
                aposta_id INTEGER,
                concurso INTEGER,
                acertos INTEGER,
                PRIMARY KEY (aposta_id, concurso),
                FOREIGN KEY (aposta_id) REFERENCES apostas(id) ON DELETE CASCADE,
                FOREIGN KEY (concurso) REFERENCES resultados(concurso) ON DELETE CASCADE
            );",
        )?;

        // Migrações manuais para colunas novas se a tabela já existir (ignora erro se já existirem)
        let _ = self.conn.execute("ALTER TABLE resultados ADD COLUMN valor_premio REAL", []);
        let _ = self.conn.execute("ALTER TABLE resultados ADD COLUMN ganhadores INTEGER", []);
        let _ = self.conn.execute("ALTER TABLE resultados ADD COLUMN valor_total REAL", []);

        Ok(())
    }

    pub fn adicionar_aposta(
        &self,
        numeros: Vec<i32>,
        concurso_inicial: i32,
        quantidade_concursos: i32,
    ) -> Result<Aposta> {
        let numeros_json = serde_json::to_string(&numeros).unwrap();
        
        self.conn.execute(
            "INSERT INTO apostas (numeros, concurso_inicial, quantidade_concursos) VALUES (?1, ?2, ?3)",
            params![numeros_json, concurso_inicial, quantidade_concursos],
        )?;

        let id = self.conn.last_insert_rowid();

        let mut stmt = self.conn.prepare(
            "SELECT id, numeros, concurso_inicial, quantidade_concursos, 
             datetime(data_criacao) as data_criacao, ativa 
             FROM apostas WHERE id = ?1"
        )?;

        let aposta = stmt.query_row(params![id], |row| {
            let id: i64 = row.get(0)?;
            let numeros_str: String = row.get(1)?;
            let numeros: Vec<i32> = serde_json::from_str(&numeros_str)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;

            // Buscar resultados/acertos
            let acertos = self.obter_acertos_aposta(id).unwrap_or_default();
            
            // Buscar os números sorteados de cada concurso verificado
            let mut resultados_concursos = std::collections::HashMap::new();
            for (&concurso, _) in &acertos {
                if let Ok(Some(res)) = self.obter_resultado(concurso) {
                    resultados_concursos.insert(concurso, res.numeros_sorteados);
                }
            }

            Ok(Aposta {
                id,
                numeros,
                concurso_inicial: row.get(2)?,
                quantidade_concursos: row.get(3)?,
                data_criacao: row.get(4)?,
                ativa: row.get(5)?,
                acertos,
                resultados_concursos,
            })
        })?;

        println!("Aposta adicionada com ID: {}", aposta.id);

        Ok(aposta)
    }

    pub fn listar_apostas(&self) -> Result<Vec<Aposta>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, numeros, concurso_inicial, quantidade_concursos, 
             datetime(data_criacao) as data_criacao, ativa 
             FROM apostas 
             WHERE ativa = 1 
             ORDER BY id DESC"
        )?;

        let apostas = stmt
            .query_map([], |row| {
                let id: i64 = row.get(0)?;
                let numeros_str: String = row.get(1)?;
                let numeros: Vec<i32> = serde_json::from_str(&numeros_str).map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;

                // Buscar resultados/acertos
                let acertos = self.obter_acertos_aposta(id).unwrap_or_default();
                
                // Buscar os números sorteados de cada concurso verificado
                let mut resultados_concursos = std::collections::HashMap::new();
                for (&concurso, _) in &acertos {
                    if let Ok(Some(res)) = self.obter_resultado(concurso) {
                        resultados_concursos.insert(concurso, res.numeros_sorteados);
                    }
                }

                Ok(Aposta {
                    id,
                    numeros,
                    concurso_inicial: row.get(2)?,
                    quantidade_concursos: row.get(3)?,
                    data_criacao: row.get(4)?,
                    ativa: row.get(5)?,
                    acertos,
                    resultados_concursos,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(apostas)
    }    pub fn excluir_aposta(&self, id: i64) -> Result<()> {
        // Limpar acertos e aposta
        self.conn.execute("DELETE FROM apostas_resultados WHERE aposta_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM apostas WHERE id = ?1", params![id])?;
        Ok(())
    }



    pub fn salvar_resultado(&self, resultado: &crate::models::Resultado) -> Result<()> {
        let numeros_json = serde_json::to_string(&resultado.numeros_sorteados)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        
        println!("Salvando resultado concurso: {}", resultado.concurso);
        self.conn.execute(
            "INSERT OR REPLACE INTO resultados (concurso, numeros_sorteados, data_sorteio, acumulado, valor_premio, ganhadores, valor_total)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                resultado.concurso,
                numeros_json,
                resultado.data_sorteio,
                resultado.acumulado,
                resultado.valor_premio,
                resultado.ganhadores,
                resultado.valor_total
            ],
        )?;
        Ok(())
    }

    pub fn obter_resultado(&self, concurso: i32) -> Result<Option<crate::models::Resultado>> {
        let mut stmt = self.conn.prepare(
            "SELECT concurso, numeros_sorteados, data_sorteio, acumulado, valor_premio, ganhadores, valor_total
             FROM resultados
             WHERE concurso = ?1"
        )?;

        let resultado = stmt.query_row(params![concurso], |row| {
            let numeros_str: String = row.get(1)?;
            let numeros_sorteados: Vec<i32> = serde_json::from_str(&numeros_str)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;

            Ok(crate::models::Resultado {
                concurso: row.get(0)?,
                numeros_sorteados,
                data_sorteio: row.get(2)?,
                acumulado: row.get(3)?,
                valor_premio: row.get(4)?,
                ganhadores: row.get(5)?,
                valor_total: row.get(6)?,
            })
        });

        match resultado {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn processar_acertos_concurso(&self, concurso: i32, numeros_sorteados: &[i32]) -> Result<()> {
        // Buscar todas as apostas ativas que incluem este concurso
        let mut stmt = self.conn.prepare(
            "SELECT id, numeros, concurso_inicial, quantidade_concursos 
             FROM apostas 
             WHERE ativa = 1 
             AND ?1 >= concurso_inicial 
             AND ?1 < (concurso_inicial + quantidade_concursos)"
        )?;

        let apostas_afetadas = stmt.query_map(params![concurso], |row| {
            let id: i64 = row.get(0)?;
            let numeros_str: String = row.get(1)?;
            let numeros: Vec<i32> = serde_json::from_str(&numeros_str).unwrap();
            Ok((id, numeros))
        })?.collect::<Result<Vec<(i64, Vec<i32>)>>>()?;

        for (id, numeros) in apostas_afetadas {
            // Calcular acertos
            let acertos = numeros.iter().filter(|n| numeros_sorteados.contains(n)).count() as i32;
            
            // Inserir ou substituir na tabela de resultados de apostas
            self.conn.execute(
                "INSERT OR REPLACE INTO apostas_resultados (aposta_id, concurso, acertos) 
                 VALUES (?1, ?2, ?3)",
                params![id, concurso, acertos],
            )?;
        }

        Ok(())
    }

    pub fn obter_acertos_aposta(&self, aposta_id: i64) -> Result<std::collections::HashMap<i32, i32>> {
        let mut stmt = self.conn.prepare(
            "SELECT concurso, acertos FROM apostas_resultados WHERE aposta_id = ?1"
        )?;

        let results = stmt.query_map(params![aposta_id], |row| {
            Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?))
        })?.collect::<Result<std::collections::HashMap<i32, i32>>>()?;

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn setup_test_db() -> Database {
        let db = Database::new(PathBuf::from(":memory:")).unwrap();
        db.init().unwrap();
        db
    }

    #[test]
    fn test_db_adicionar_listar_apostas() {
        let db = setup_test_db();
        let numeros = vec![1, 2, 3, 4, 5, 6];
        
        let aposta = db.adicionar_aposta(numeros.clone(), 2650, 1).unwrap();
        assert_eq!(aposta.concurso_inicial, 2650);
        assert_eq!(aposta.numeros, numeros);
        
        let apostas = db.listar_apostas().unwrap();
        assert_eq!(apostas.len(), 1);
        assert_eq!(apostas[0].id, aposta.id);
    }

    #[test]
    fn test_db_processar_acertos() {
        let db = setup_test_db();
        let aposta_numeros = vec![1, 2, 3, 4, 5, 6];
        db.adicionar_aposta(aposta_numeros, 2650, 2).unwrap(); // Concursos 2650 e 2651
        
        let sorteio_2650 = vec![1, 2, 10, 11, 12, 13]; // 2 acertos
        let res_2650 = crate::models::Resultado {
            concurso: 2650,
            numeros_sorteados: sorteio_2650.clone(),
            data_sorteio: "2023-11-01".to_string(),
            acumulado: false,
            valor_premio: Some(500000.0),
            ganhadores: Some(1),
        };
        db.salvar_resultado(&res_2650).unwrap();
        db.processar_acertos_concurso(2650, &sorteio_2650).unwrap();
        
        let acertos_map = db.obter_acertos_aposta(1).unwrap();
        assert_eq!(acertos_map.get(&2650), Some(&2));
        assert_eq!(acertos_map.get(&2651), None);
    }
}
