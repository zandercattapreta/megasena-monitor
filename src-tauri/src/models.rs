/*
 * PROGRAMA: models.rs
 * DESCRIÇÃO: Este arquivo define as estruturas de dados (structs) e modelos de domínio da aplicação,
 *            representando os bilhetes de Apostas, Resultados de Sorteio oficiais e o Relacionamento
 *            de Desempenho. Adiciona suporte a serialização/desserialização JSON (através do serde)
 *            para garantir a correta comunicação tipada de dados com o frontend React.
 * QUEM O CHAMA: Importado e utilizado por `lib.rs`, `api.rs`, `commands.rs` e `database.rs`.
 * QUEM ELE CHAMA: Não realiza chamadas funcionais externas (apenas declaração de tipos de dados).
 * O QUE ESPERA RECEBER:
 *   - Não possui lógica de execução ativa de recebimento de parâmetros.
 * O QUE ENVIA:
 *   - Não possui lógica de envio ativo de dados (apenas estruturas descritivas de tipos).
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

use serde::{Deserialize, Serialize};

/// Estrutura de dados que descreve uma Aposta (jogo do usuário).
/// O atributo `serde(rename_all = "camelCase")` mapeia o padrão snake_case do Rust
/// para camelCase no TypeScript do frontend de forma nativa.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Aposta {
    /// Identificador único gerado automaticamente pelo banco SQLite.
    pub id: i64,
    /// Vetor com os números selecionados no jogo (dezenas).
    pub numeros: Vec<i32>,
    /// O concurso em que o jogo inicia seu monitoramento.
    pub concurso_inicial: i32,
    /// Total de concursos em que o jogo permanece válido (ex: Teimosinha).
    pub quantidade_concursos: i32,
    /// Carimbo de data e hora do cadastro do bilhete.
    pub data_criacao: String,
    /// Flag que indica se o bilhete está ativo.
    pub ativa: bool,
    /// Mapa relacionando `Concurso -> Quantidade de Acertos` para fins de relatório.
    pub acertos: std::collections::HashMap<i32, i32>,
    /// Mapa relacionando `Concurso -> Números sorteados` para comparar na UI do frontend.
    pub resultados_concursos: std::collections::HashMap<i32, Vec<i32>>,
}

/// Estrutura de dados que descreve o resultado de um sorteio oficial da Mega-Sena.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Resultado {
    /// Número identificador único do concurso sorteado.
    pub concurso: i32,
    /// As 6 dezenas que foram sorteadas oficialmente.
    pub numeros_sorteados: Vec<i32>,
    /// Data de realização do sorteio (formato texto).
    pub data_sorteio: String,
    /// Flag indicando se o prêmio acumulou.
    pub acumulado: bool,
    /// Valor estimado de premiação ou prêmio pago para a Sena.
    pub valor_premio: Option<f64>,
    /// Total de ganhadores na Sena.
    pub ganhadores: Option<i32>,
    /// Valor estimado total acumulado para o próximo concurso.
    pub valor_total: Option<f64>,
}

/// Estrutura de relacionamento que descreve o desempenho de uma Aposta em um Concurso específico.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApostaResultado {
    /// ID da aposta relacionada.
    pub aposta_id: i64,
    /// Número do concurso relacionado.
    pub concurso: i32,
    /// Quantidade de dezenas corretas (acertos) detectadas na conferência.
    pub acertos: i32,
}
