# 🤖 Guia de Configuração e Publicação Android - MegaSena Monitor

O **Tauri v2** permite compilar e empacotar o **MegaSena Monitor** como um aplicativo móvel Android nativo, reaproveitando 100% da interface do seu React e o banco SQLite embarcado.

Este guia prático explica detalhadamente como preparar o seu computador Mac, inicializar o suporte móvel, assinar o aplicativo e publicá-lo na Google Play Store.

---

## 🛠️ 1. Preparando o Ambiente no macOS

Para compilar aplicativos Android no seu Mac, você precisará do **Java (JDK)** e do **Android SDK/NDK**.

### Passo A: Instalar o Android Studio (Gratuito)
1. Acesse [developer.android.com/studio](https://developer.android.com/studio) e instale o **Android Studio**.
2. Abra o Android Studio pela primeira vez e siga o assistente padrão (*Setup Wizard*) para que ele baixe e configure automaticamente as ferramentas de linha de comando e o **Android SDK**.

### Passo B: Instalar o NDK e Command-line Tools
1. Com o Android Studio aberto, vá no menu superior e acesse: **Tools** -> **SDK Manager**.
2. Acesse a aba **SDK Tools** e certifique-se de marcar estas três opções indispensáveis:
   * [x] **Android SDK Command-line Tools (latest)**
   * [x] **NDK (Side by side)**
   * [x] **Android SDK Platform-Tools**
3. Clique em **Apply** e aguarde o download ser concluído.

### Passo C: Configurar as Variáveis de Ambiente no Mac (`.zshrc`)
Abra o seu terminal do Mac e rode estes comandos para adicionar os caminhos de build no seu terminal permanentemente:

```bash
# Abre o arquivo de configuração do seu shell Zsh
nano ~/.zshrc
```

Cole as seguintes linhas de código no final do arquivo:

```bash
# Configuração de Ambiente para Desenvolvimento Android (Tauri)
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home" # (Ou caminho do OpenJDK instalado)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk"

# Adiciona as ferramentas do SDK ao seu PATH de execução
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
```

*Pressione `Ctrl+O` para salvar, `Enter` para confirmar, e `Ctrl+X` para sair do editor nano.*

Recarregue as configurações do terminal rodando:
```bash
source ~/.zshrc
```

---

## 🚀 2. Inicializando o Projeto Android no Tauri

Com o ambiente pronto, execute estes passos na raiz do seu projeto **MegaSena Monitor**:

1. **Sincronize o ambiente Rust e inicialize o suporte Android**:
   ```bash
   source "$HOME/.cargo/env"
   npx tauri android init
   ```
   *O Tauri criará uma subpasta chamada `src-tauri/gen/android` contendo todo o esqueleto nativo Gradle, Kotlin e os manifestos de permissões móveis de forma automatizada.*

---

## 📦 3. Compilando o Aplicativo Móvel

### Rota A: Gerar o instalador direto para testes (`.apk`)
Para compilar e gerar o arquivo de instalação direta no seu celular Android de testes, rode:
```bash
source "$HOME/.cargo/env"
npm run tauri android build -- --apk
```
*O arquivo `.apk` de produção assinado para testes estará localizado no diretório:*
`./src-tauri/gen/android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Rota B: Gerar o pacote oficial da Google Play (`.aab`)
O Google exige que aplicativos novos submetidos à loja utilizem o formato **Android App Bundle (.aab)**. Para gerá-lo, rode:
```bash
source "$HOME/.cargo/env"
npm run tauri android build
```
*O arquivo `.aab` final gerado e otimizado estará localizado em:*
`./src-tauri/gen/android/app/build/outputs/bundle/release/app-release.aab`

---

## 🔑 4. Assinando o App Digitalmente (Keystore)

Para que a Google Play Store e o seu celular aceitem o aplicativo, ele precisa ser assinado com uma chave de segurança privada (`Keystore`).

### Passo A: Gerar a Chave Digital (Roda apenas uma vez na vida)
No terminal do seu Mac, rode o comando abaixo para gerar o arquivo `megasena-key.keystore` de forma criptografada:

```bash
keytool -genkey -v -keystore megasena-key.keystore -alias megasena-alias -keyalg RSA -keysize 2048 -validity 10000
```
*Insira uma senha segura (anote-a muito bem!) e responda as perguntas de identificação.*

### Passo B: Configurar o Gradle para Assinar Automaticamente
Copie o arquivo `megasena-key.keystore` gerado para dentro da pasta `src-tauri/gen/android/app/` e crie um arquivo chamado `keystore.properties` nessa mesma pasta contendo os dados de descriptografia:

```properties
storePassword=sua-senha-do-keystore
keyPassword=sua-senha-do-keystore
keyAlias=megasena-alias
storeFile=megasena-key.keystore
```

Com isso feito, toda build de produção gerará pacotes `.apk` e `.aab` **totalmente assinados e prontos para publicação instantânea na loja**.

---

## 🛍️ 5. Publicando na Google Play Store

1. Acesse o **Google Play Console** e crie um novo aplicativo chamado **MegaSena Monitor**.
2. Defina o preço do aplicativo como **Pago (R$ 15,00 / R$ 25,00 ou equivalente a $4.99 USD)**.
3. Preencha a descrição, envie as capturas de tela (mockups do celular), defina a faixa etária livre e classifique os dados do app como **Offline-First (dados locais)**.
4. Vá em **Produção** -> **Criar nova versão** e faça o upload do arquivo **`app-release.aab`** assinado.
5. Envie para revisão. Em poucos dias o app estará online para milhões de celulares Android ao redor do globo! 🍀📱
