# 🖥️ Guia de Compilação, Assinatura e Release - MegaSena Monitor

Este guia detalha o ciclo completo para compilar localmente, assinar digitalmente e liberar novas distribuições instaláveis do **MegaSena Monitor** nas plataformas desktop suportadas.

---

## 🛠️ Pré-requisitos por Sistema Operacional

Para realizar compilações locais em ambiente de produção, é essencial ter o **Node.js (v18+)**, o **Rust/Cargo (v1.75+)** e as ferramentas de sistema instaladas:

### 1. macOS (Apple Silicon ou Intel)
* **Xcode Command Line Tools**: Instale via terminal rodando `xcode-select --install`.
* **Biblioteca Tauri**: Nenhuma dependência extra além de compiladores padrão C++ do macOS.

### 2. Windows 10/11
* **Visual Studio Build Tools**: Instale as ferramentas de build C++ instalando o workload "Desktop development with C++" através do instalador do Visual Studio.

### 3. Linux (Ubuntu/Debian)
* Instale as bibliotecas essenciais de renderização e bandeja do sistema:
  ```bash
  sudo apt-get update
  sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## ⚙️ Comandos de Desenvolvimento e Build Local

Todos os comandos de script devem ser rodados a partir da pasta raiz do projeto:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor web Vite para testes rápidos no navegador. |
| `npm run tauri dev` | Inicializa o aplicativo em modo desktop interativo com Hot Module Replacement (HMR) e logs em tempo real. |
| `npm run build` | Compila o Typescript e gera o bundle estático do frontend Vite na pasta `./dist`. |
| `npm run tauri build` | Executa a compilação completa do backend em Rust em modo release, injeta o bundle estático do frontend, otimiza o binário final e gera os instaláveis do SO correspondente. |

---

## 🔑 Assinatura Digital e Notarização (*Code Signing*)

Para evitar alertas de bloqueio de segurança dos navegadores e sistemas operacionais (como o *SmartScreen* do Windows ou *Gatekeeper* do macOS), os instaláveis distribuídos devem passar pelo processo de assinatura digital.

### 🍎 Assinatura e Notarização no macOS
O Tauri automatiza o ciclo completo integrado com as ferramentas da Apple. Você precisará de uma conta paga de Apple Developer e das variáveis abaixo no seu arquivo de ambiente:

1. **Gere um certificado de Developer ID Application** através do Xcode ou painel Developer da Apple e instale-o no Keychain de sua máquina de build.
2. **Defina as variáveis de ambiente** no terminal antes de disparar o build de produção:
   ```bash
   export APPLE_SIGNING_IDENTITY="Developer ID Application: Nome Do Desenvolvedor (ID_DA_EQUIPE)"
   export APPLE_ID="seu-email-da-apple@exemplo.com"
   export APPLE_PASSWORD="senha-especifica-para-aplicativo-gerada-no-site-appleid"
   export APPLE_TEAM_ID="ID_DA_EQUIPE_DE_10_DIGITOS"
   ```
3. O Tauri assinará o arquivo `.app`, gerará o pacote `.dmg` e enviará o binário para a notarização automática nos servidores da Apple.

### 🔌 Assinatura no Windows
1. Adquira um certificado de assinatura de código `.pfx` emitido por uma Autoridade Certificadora pública confiável (ex: Sectigo, DigiCert).
2. Configure o arquivo `tauri.conf.json` sob a chave `"bundle" -> "windows"` apontando para o seu arquivo `.pfx` e sua respectiva senha de descriptografia.

---

## 🤖 Automação de Releases via GitHub Actions

O repositório possui uma pipeline CI/CD configurada em `.github/workflows/release.yml`. Toda vez que uma tag no formato `v*` (ex: `v1.0.2`) é empurrada para o repositório, o GitHub constrói automaticamente os binários nativos de macOS, Windows e Linux em paralelo.

### Segredos Necessários no Repositório GitHub (`Repository Secrets`):

Para rodar de forma bem-sucedida, você deve cadastrar estes segredos nas configurações do seu repositório no GitHub:

* `GITHUB_TOKEN`: Utilizado automaticamente pelo workflow para autenticar e criar o rascunho de Release no repositório, enviando os instaláveis finais (`.dmg`, `.msi`, `.deb`).
* `APPLE_ID` (Opcional): Seu e-mail de conta Apple Developer para compilar macOS assinado.
* `APPLE_PASSWORD` (Opcional): Senha de app Apple Developer.
* `APPLE_TEAM_ID` (Opcional): Team ID da Apple.

---

## 📦 Artefatos Gerados

Após rodar `npm run tauri build`, os instaláveis finais estarão localizados em:
`./src-tauri/target/release/bundle/`

* **macOS**: `.dmg` (Instalador arrasta-e-solta fácil) e `.app` (Executável bruto comprimido).
* **Windows**: `.msi` (Instalador completo do Windows Installer) e `.exe` (Executável bruto).
* **Linux**: `.deb` (Pacotes Debian/Ubuntu padrão) e `.AppImage` (Binário autossuficiente universal).
