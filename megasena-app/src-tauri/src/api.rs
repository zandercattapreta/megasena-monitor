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

// API module for fetching Mega-Sena results

use crate::models::Resultado;
use reqwest::blocking::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Rateio {
    #[serde(rename = "numeroDeGanhadores")]
    ganhadores: i32,
    #[serde(rename = "valorPremio")]
    valor: Option<f64>,
    #[serde(rename = "descricaoFaixa")]
    descricao: String,
}

#[derive(Debug, Deserialize)]
struct CaixaApiResponse {
    numero: i32,
    #[serde(rename = "dataApuracao")]
    data_apuracao: String,
    #[serde(rename = "listaDezenas")]
    dezenas: Vec<String>,
    acumulado: bool,
    #[serde(rename = "listaRateioPremio")]
    lista_rateio: Vec<Rateio>,
    #[serde(rename = "valorEstimadoProximoConcurso")]
    valor_estimado_proximo: Option<f64>,
    #[serde(rename = "valorAcumuladoProximoConcurso")]
    valor_acumulado_proximo: Option<f64>,
}

/// Busca resultado da API oficial da Caixa
fn fetch_caixa_api(concurso: i32) -> Result<Resultado, String> {
    let url = format!(
        "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/{}",
        concurso
    );

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .map_err(|e| format!("Erro ao fazer requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API retornou status: {}", response.status()));
    }

    let data: CaixaApiResponse = response
        .json()
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    // Converter strings "01", "02" para números
    let numeros_sorteados: Vec<i32> = data
        .dezenas
        .iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();

    if numeros_sorteados.len() != 6 {
        return Err(format!(
            "Número inválido de dezenas: {}",
            numeros_sorteados.len()
        ));
    }

    // Extrair prêmio do rank 1 (Sena)
    let sena_info = data.lista_rateio.iter().find(|r| r.descricao.to_lowercase().contains("6"));
    let ganhadores = sena_info.map(|s| s.ganhadores);
    let valor_premio = sena_info.and_then(|s| s.valor);

    // Calcular Valor Total
    let valor_total = if let (Some(g), Some(v)) = (ganhadores, valor_premio) {
        if g > 0 {
            Some(g as f64 * v)
        } else {
            // Se acumulou, o "Prêmio" é o valor acumulado para o próximo ou o estimado
            data.valor_acumulado_proximo.or(data.valor_estimado_proximo)
        }
    } else {
        data.valor_estimado_proximo
    };

    Ok(Resultado {
        concurso: data.numero,
        numeros_sorteados,
        data_sorteio: data.data_apuracao,
        acumulado: data.acumulado,
        valor_premio,
        ganhadores,
        valor_total,
    })
}

/// Busca resultado de APIs alternativas (fallback)
fn fetch_external_fallback(concurso: i32) -> Result<Resultado, String> {
    // Fonte 1: API Guidi (Open Source)
    let url = format!(
        "https://api.guidi.dev.br/loteria/megasena/{}",
        concurso
    );

    println!("Tentando fallback Fonte 1 (Guidi): {}", url);

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("MegaSena Monitor/1.0.0")
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP Fallback: {}", e))?;

    match client.get(&url).send() {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                if let Ok(data) = response.json::<CaixaApiResponse>() {
                    // Reutilizar o parsing da Caixa já que o formato é idêntico
                     let numeros_sorteados: Vec<i32> = data
                        .dezenas
                        .iter()
                        .filter_map(|s| s.parse::<i32>().ok())
                        .collect();

                    if numeros_sorteados.len() == 6 {
                        let sena_info = data.lista_rateio.iter().find(|r| r.descricao.to_lowercase().contains("6"));
                        let ganhadores = sena_info.map(|s| s.ganhadores);
                        let valor_premio = sena_info.and_then(|s| s.valor);

                        let valor_total = if let (Some(g), Some(v)) = (ganhadores, valor_premio) {
                            if g > 0 { Some(g as f64 * v) }
                            else { data.valor_acumulado_proximo.or(data.valor_estimado_proximo) }
                        } else {
                            data.valor_estimado_proximo
                        };

                        return Ok(Resultado {
                            concurso: data.numero,
                            numeros_sorteados,
                            data_sorteio: data.data_apuracao,
                            acumulado: data.acumulado,
                            valor_premio,
                            ganhadores,
                            valor_total,
                        });
                    }
                }
            }
            Err(format!("Fallback Fonte 1 retornou status: {}", status))
        }
        Err(e) => Err(format!("Erro na requisição de fallback: {}", e))
    }
}

/// Busca o número do último concurso realizado com fallback
/// Busca o número do último concurso com estratégia de Exploração de Fronteira
pub fn obter_ultimo_concurso_numero() -> Result<i32, String> {
    let url = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/";

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    // 1. Obter Âncora Oficial
    let mut anchor = match client.get(url).send() {
        Ok(response) => {
            if response.status().is_success() {
                if let Ok(data) = response.json::<CaixaApiResponse>() {
                    data.numero
                } else { 0 }
            } else { 0 }
        }
        Err(_) => 0,
    };

    // 2. Se Caixa falhou, tenta Anchor via Fallback
    if anchor == 0 {
        let fallback_url = "https://api.guidi.dev.br/loteria/megasena/ultimo";
        anchor = match client.get(fallback_url).send() {
            Ok(response) => {
                if response.status().is_success() {
                    if let Ok(data) = response.json::<CaixaApiResponse>() {
                        data.numero
                    } else { 2954 }
                } else { 2954 }
            }
            Err(_) => 2954,
        };
    }

    // 3. EXPLORAÇÃO DE FRONTEIRA: Tenta descobrir se o próximo ou o seguinte já existem
    // Isso é crucial para dias como hoje (Mega da Virada), onde o sistema principal demora a atualizar a âncora.

    // 3. EXPLORAÇÃO DE FRONTEIRA
    // Tenta descobrir concursos à frente da âncora oficial
    if let Ok(res) = verificar_resultado(anchor + 1) {
        println!("DESCOBERTA: Concurso {} detectado antecipadamente!", anchor + 1);
        anchor = res.concurso;
        
        if let Ok(res2) = verificar_resultado(anchor + 1) {
            println!("DESCOBERTA EXTRAORDINÁRIA: Concurso {} detectado!", res2.concurso);
            anchor = res2.concurso;
        }
    }

    Ok(anchor)
}

pub fn verificar_resultado(concurso: i32) -> Result<Resultado, String> {
    // 1. Tentar API Oficial da Caixa
    println!("Tentando API Oficial para concurso {}", concurso);
    
    match fetch_caixa_api(concurso) {
        Ok(resultado) => return Ok(resultado),
        Err(e) => {
            eprintln!("API Caixa falhou: {}", e);
        }
    }

    // 2. Tentar Fallback (APIs de terceiros / Open Source)
    match fetch_external_fallback(concurso) {
        Ok(resultado) => {
            println!("Sucesso via Fallback para concurso {}", concurso);
            return Ok(resultado);
        },
        Err(e) => {
            eprintln!("Fallback falhou: {}", e);
        }
    }

    Err(format!(
        "Não foi possível obter resultado do concurso {}. Isso pode ser devido a um atraso nos sistemas oficiais ou instabilidade na conexão. Tente novamente em alguns instantes.",
        concurso
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Ignora por padrão (requer internet)
    fn test_fetch_caixa_api() {
        // Testar com um concurso recente conhecido
        let resultado = fetch_caixa_api(2650);
        assert!(resultado.is_ok());
        
        let res = resultado.unwrap();
        assert_eq!(res.concurso, 2650);
        assert_eq!(res.numeros_sorteados.len(), 6);
    }

    #[test]
    #[ignore]
    fn test_fetch_fallback_api() {
        // Testar fallback com o concurso 2954 que sabemos estar disponível
        let resultado = fetch_external_fallback(2954);
        assert!(resultado.is_ok());
        let res = resultado.unwrap();
        assert_eq!(res.concurso, 2954);
        assert_eq!(res.numeros_sorteados, vec![1, 9, 37, 39, 42, 44]);
    }
}
