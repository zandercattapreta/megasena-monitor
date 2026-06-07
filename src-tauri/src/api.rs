/*
 * PROGRAMA: api.rs
 * DESCRIÇÃO: Este módulo realiza a comunicação HTTP com as APIs da Caixa Econômica Federal e
 *            fallbacks alternativos (ex: Guidi API) para obter os dados oficiais de sorteios
 *            da Mega-Sena. Ele também implementa a "exploração de fronteira" com timeouts curtos
 *            para detectar novos sorteios de forma antecipada sem comprometer a latência da inicialização.
 * QUEM O CHAMA: Chamado principalmente por `commands.rs` (para responder às requisições do frontend)
 *               e por `lib.rs` (para o loop de monitoramento periódico em background).
 * QUEM ELE CHAMA: Efetua chamadas HTTP externas para os servidores da Caixa e APIs de terceiros.
 * O QUE ESPERA RECEBER:
 *   - `concurso`: O número do concurso (i32) a ser verificado.
 * O QUE ENVIA:
 *   - `Result<Resultado, String>`: Contém a struct `Resultado` com dezenas, datas, prêmios e ganhadores, ou erro.
 *   - `Result<i32, String>`: Contém o número do último concurso conhecido da Mega-Sena.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

use crate::models::Resultado;
use reqwest::blocking::Client;
use serde::Deserialize;

// Representa a faixa de premiação no JSON retornado pela API da Caixa
#[derive(Debug, Deserialize)]
struct Rateio {
    #[serde(rename = "numeroDeGanhadores")]
    ganhadores: i32,
    #[serde(rename = "valorPremio")]
    valor: Option<f64>,
    #[serde(rename = "descricaoFaixa")]
    descricao: String,
}

// Representa a resposta completa em formato JSON da API de loterias da Caixa
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

/// Auxiliar robusto para buscar e parsear os dados da API (Caixa ou Guidi) com timeout customizado.
/// 
/// - `url`: Endereço HTTP da API de consulta.
/// - `user_agent`: User agent para evitar bloqueio nas requisições.
/// - `timeout_secs`: Tempo limite da requisição de rede em segundos.
fn fetch_and_parse_api_com_timeout(url: &str, user_agent: &str, timeout_secs: u64) -> Result<Resultado, String> {
    // Cria o cliente HTTP com timeout especificado
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .user_agent(user_agent)
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    // Executa a requisição GET
    let response = client
        .get(url)
        .send()
        .map_err(|e| format!("Erro ao fazer requisição: {}", e))?;

    // Verifica se a resposta foi bem-sucedida (status 2xx)
    if !response.status().is_success() {
        return Err(format!("API retornou status: {}", response.status()));
    }

    // Desserializa o JSON retornado
    let data: CaixaApiResponse = response
        .json()
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    // Converte strings "01", "02" etc., para inteiros (i32)
    let numeros_sorteados: Vec<i32> = data
        .dezenas
        .iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();

    // Valida se a quantidade de números sorteados é exatamente 6
    if numeros_sorteados.len() != 6 {
        return Err(format!(
            "Número inválido de dezenas: {}",
            numeros_sorteados.len()
        ));
    }

    // Extrai informações específicas da Sena (faixa de premiação 6 números)
    let sena_info = data.lista_rateio.iter().find(|r| r.descricao.to_lowercase().contains("6"));
    let ganhadores = sena_info.map(|s| s.ganhadores);
    let valor_premio = sena_info.and_then(|s| s.valor);

    // Calcula o valor total estimado ou pago
    let valor_total = if let (Some(g), Some(v)) = (ganhadores, valor_premio) {
        if g > 0 {
            Some(g as f64 * v)
        } else {
            // Se acumulou, o valor estimado do próximo sorteio ou acumulado
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

/// Auxiliar robusto para buscar e parsear os dados da API (Caixa ou Guidi) com timeout padrão de 10s.
fn fetch_and_parse_api(url: &str, user_agent: &str) -> Result<Resultado, String> {
    fetch_and_parse_api_com_timeout(url, user_agent, 10)
}

/// Busca resultado da API oficial da Caixa Econômica Federal.
fn fetch_caixa_api(concurso: i32) -> Result<Resultado, String> {
    let url = format!(
        "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/{}",
        concurso
    );
    let user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
    fetch_and_parse_api(&url, user_agent)
}

/// Busca resultado da API oficial da Caixa com timeout curto (ex: para exploração de fronteira).
fn fetch_caixa_api_rapido(concurso: i32, timeout_secs: u64) -> Result<Resultado, String> {
    let url = format!(
        "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/{}",
        concurso
    );
    let user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
    fetch_and_parse_api_com_timeout(&url, user_agent, timeout_secs)
}

/// Busca resultado de APIs alternativas de terceiros (fallback secundário)
fn fetch_external_fallback(concurso: i32) -> Result<Resultado, String> {
    let url = format!(
        "https://api.guidi.dev.br/loteria/megasena/{}",
        concurso
    );

    println!("Tentando fallback Fonte 1 (Guidi): {}", url);
    let user_agent = "MegaSena Monitor/1.0.0";
    fetch_and_parse_api(&url, user_agent)
}

/// Busca o número do último concurso realizado com estratégia de Exploração de Fronteira.
/// Usa timeouts curtos e reduz requisições desnecessárias para não causar lentidão na rede/inicialização.
pub fn obter_ultimo_concurso_numero() -> Result<i32, String> {
    let url = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/";

    // Cria cliente rápido (timeout curto de 5s para obter a âncora inicial)
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    // 1. Obter Âncora Oficial da Caixa
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

    // 2. Se a Caixa falhou, tenta a âncora via Guidi (Fallback)
    if anchor == 0 {
        let fallback_url = "https://api.guidi.dev.br/loteria/megasena/ultimo";
        anchor = match client.get(fallback_url).send() {
            Ok(response) => {
                if response.status().is_success() {
                    if let Ok(data) = response.json::<CaixaApiResponse>() {
                        data.numero
                    } else { 2954 } // Fallback hardcoded caso ambos falhem
                } else { 2954 }
            }
            Err(_) => 2954,
        };
    }

    // 3. EXPLORAÇÃO DE FRONTEIRA
    // Tenta descobrir concursos à frente da âncora oficial.
    // Usamos um timeout extremamente curto de 2 segundos e chamamos apenas a API oficial diretamente.
    // Isso evita travar a inicialização do app caso o concurso futuro ainda não tenha sido lançado (cenário mais comum).
    if let Ok(res) = fetch_caixa_api_rapido(anchor + 1, 2) {
        println!("DESCOBERTA: Concurso {} detectado antecipadamente!", anchor + 1);
        anchor = res.concurso;
        
        if let Ok(res2) = fetch_caixa_api_rapido(anchor + 1, 2) {
            println!("DESCOBERTA EXTRAORDINÁRIA: Concurso {} detectado!", res2.concurso);
            anchor = res2.concurso;
        }
    }

    Ok(anchor)
}

/// Verifica o resultado de um concurso específico, usando fallback se a API principal falhar.
pub fn verificar_resultado(concurso: i32) -> Result<Resultado, String> {
    // 1. Tentar API Oficial da Caixa (com timeout padrão de 10s)
    println!("Tentando API Oficial para concurso {}", concurso);
    match fetch_caixa_api(concurso) {
        Ok(resultado) => return Ok(resultado),
        Err(e) => {
            eprintln!("API Caixa falhou: {}", e);
        }
    }

    // 2. Tentar API externa do Guidi (Fallback)
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
    #[ignore] // Ignora por padrão para evitar requisições externas em testes normais
    fn test_fetch_caixa_api() {
        let resultado = fetch_caixa_api(2650);
        assert!(resultado.is_ok());
        
        let res = resultado.unwrap();
        assert_eq!(res.concurso, 2650);
        assert_eq!(res.numeros_sorteados.len(), 6);
    }

    #[test]
    #[ignore]
    fn test_fetch_fallback_api() {
        let resultado = fetch_external_fallback(2954);
        assert!(resultado.is_ok());
        let res = resultado.unwrap();
        assert_eq!(res.concurso, 2954);
        assert_eq!(res.numeros_sorteados, vec![1, 9, 37, 39, 42, 44]);
    }
}
