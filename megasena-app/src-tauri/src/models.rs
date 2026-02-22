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

// Data models for MegaSena App

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Aposta {
    pub id: i64,
    pub numeros: Vec<i32>,
    pub concurso_inicial: i32,
    pub quantidade_concursos: i32,
    pub data_criacao: String,
    pub ativa: bool,
    pub acertos: std::collections::HashMap<i32, i32>,
    pub resultados_concursos: std::collections::HashMap<i32, Vec<i32>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Resultado {
    pub concurso: i32,
    pub numeros_sorteados: Vec<i32>,
    pub data_sorteio: String,
    pub acumulado: bool,
    pub valor_premio: Option<f64>,
    pub ganhadores: Option<i32>,
    pub valor_total: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApostaResultado {
    pub aposta_id: i64,
    pub concurso: i32,
    pub acertos: i32,
}
