# BovInA — frontend mobile

## Resumo

O BovInA é uma aplicação mobile de apoio à gestão da produção in vitro de embriões bovinos (PIVE). Este repositório contém o frontend mobile, com suporte obrigatório a Android e iOS.

O projeto está em recuperação e modernização incremental. A baseline atual busca preservar o comportamento existente e tornar a instalação reproduzível antes de mudanças maiores; ela ainda não representa um produto pronto para produção.

## Stack principal

- React Native 0.74.3 e React 18.2.0;
- Expo SDK 51.0.24, com projetos nativos mantidos no repositório;
- JavaScript, Babel e Metro;
- React Navigation 6, com navegação por abas e stacks;
- Hermes habilitado em Android e iOS;
- Axios e `fetch` para comunicação HTTP;
- Expo Blur, React Native Calendars e componentes de data e seleção usados pelas telas.

## Baseline atual

| Ferramenta | Versão/política |
| --- | --- |
| Node.js | `20.20.2` |
| npm | `10.8.2` |
| Expo | `51.0.24` |
| React Native | `0.74.3` |
| Package manager | somente npm |
| Lockfile JavaScript | `package-lock.json` |

O Node 20 é uma baseline legada e transitória, congelada para recuperar a reprodutibilidade do projeto. Não altere essa versão isoladamente sem analisar a compatibilidade da stack completa.

## Pré-requisitos

### Compartilhados

- [nvm](https://github.com/nvm-sh/nvm) para selecionar a versão de Node definida em `.nvmrc`;
- npm 10.8.2, instalado com o Node 20.20.2;
- Git.

### iOS

- macOS;
- Xcode, Xcode Command Line Tools e um runtime de iOS Simulator compatível instalados localmente;
- CocoaPods `1.17.0`.

O repositório ainda não fixa uma versão oficial do Xcode nem do runtime do Simulator. Esses itens dependem da toolchain local.

### Android

- Android Studio;
- Android SDK configurado e acessível à build;
- JDK compatível com o Gradle/Android Gradle Plugin do projeto;
- emulador iniciado ou dispositivo físico com depuração USB, somente quando for necessário instalar e executar o app.

A versão oficial do JDK e a combinação completa da toolchain Android ainda não estão fixadas no repositório. A configuração Gradle atual declara SDK de compilação/target 34, mas isso não substitui uma baseline formal da toolchain local.

## Primeira instalação após o clone

Entre na pasta clonada e execute:

```sh
cd piveApp
nvm install
nvm use
node --version
npm --version
npm ci
```

As versões exibidas devem ser, respectivamente, `v20.20.2` e `10.8.2`. O `.npmrc` aplica validação estrita de engines, e o `npm ci` instala exatamente o grafo registrado em `package-lock.json`.

Não use Yarn neste repositório e não gere `yarn.lock` ou artefatos `.yarn/`.

## Como rodar no iOS

Instale os Pods sem atualizar as versões travadas:

```sh
pod --version
cd ios
pod install --deployment --clean-install
cd ..
```

O primeiro comando deve informar `1.17.0`. Depois, com um iOS Simulator disponível:

```sh
npm run ios
```

Esse comando executa `expo run:ios`, compila o projeto nativo, instala o aplicativo e inicia o fluxo de desenvolvimento. Um runtime de Simulator válido precisa estar instalado. Para dispositivo físico, também são necessários seleção do dispositivo e signing válidos no ambiente Xcode; esse processo ainda não está formalizado como fluxo de release.

## Como rodar no Android

Para compilar o APK Debug sem exigir um emulador ou aparelho conectado:

```sh
cd android
./gradlew :app:assembleDebug
cd ..
```

Para compilar, instalar e iniciar o aplicativo:

```sh
npm run android
```

O segundo fluxo executa `expo run:android` e requer um destino disponível. Pode ser um emulador ou um dispositivo físico reconhecido pelo `adb`; o emulador não é obrigatório.

## Scripts disponíveis

Os scripts abaixo são exatamente os declarados em `package.json`:

| Comando | Estado atual |
| --- | --- |
| `npm start` | Inicia o Metro com `expo start --dev-client`. `expo-dev-client` não é dependência direta; use este fluxo apenas com uma build de desenvolvimento compatível. |
| `npm run android` | Executa `expo run:android` para compilar, instalar e iniciar o app Android. |
| `npm run ios` | Executa `expo run:ios` para compilar, instalar e iniciar o app iOS. |
| `npm run web` | Executa `expo start --web`, mas `react-dom` e `react-native-web` não estão declarados. Web não é um alvo atualmente validado ou suportado. |
| `npm run json-server` | Inicia o `json-server` usando `db.json`. Esse mock não é conectado automaticamente à configuração atual do app. |

Não há scripts de lint, formatação ou testes definidos atualmente.

## Configuração nativa

As pastas `ios/` e `android/` são versionadas e, nesta fase, são as fontes autoritativas da configuração nativa. Não execute `expo prebuild`, pois ele pode regenerar e sobrescrever essa configuração.

O `ios/Podfile.lock` é versionado e deve permanecer sincronizado com o `Podfile` e com o projeto Xcode. Use `pod install --deployment --clean-install`; não use `pod update` como parte da instalação comum.

## API e ambientes

No estado atual, o endereço da API é definido diretamente em `src/components/APIip.js`, e as telas montam requisições HTTP com Axios e `fetch`. Não existe ainda uma configuração formal e reproduzível por ambiente no frontend.

O script `json-server` fornece um apoio local baseado em `db.json`, mas não substitui nem configura automaticamente a API esperada pelo app. Endereços, transporte seguro e separação de ambientes serão modernizados em etapa futura; não inclua credenciais ou outros dados sensíveis no código.

## Estrutura resumida

```text
index.js                 entrada registrada pelo Expo
src/App.js               raiz da aplicação e navegação
src/screens/             telas principais e fluxos de menu, calendário e PIVE
src/components/          configuração compartilhada e estilos atuais
src/assets/fonts/        fontes locais
src/images/              imagens usadas pelas telas
ios/                     projeto nativo iOS e configuração CocoaPods
android/                 projeto nativo Android e Gradle Wrapper
db.json                  dados usados pelo script json-server
```

O `app.json` referencia ícone, splash e outros arquivos em uma pasta `assets/` na raiz, mas essa pasta não existe atualmente no repositório. Essa inconsistência ainda precisa ser tratada em uma etapa futura.

## Validação básica da instalação

Confirme primeiro a baseline compartilhada:

```sh
node --version
npm --version
git status --short
```

Em um clone limpo, a instalação reproduzível não deve alterar arquivos versionados. Valide cada plataforma quando sua toolchain estiver disponível.

Android — compilação:

```sh
cd android
./gradlew :app:assembleDebug
cd ..
npm run android
```

iOS — sincronização dos Pods, compilação e inicialização no Simulator:

```sh
cd ios
pod install --deployment --clean-install
cd ..
npm run ios
```

O suporte às duas plataformas é um gate obrigatório: a baseline não é considerada validada se apenas uma delas compilar e iniciar.

Erros como `xcodebuild`, `pod`, Java, Android SDK ou `adb` ausentes, `JAVA_HOME` inválido e falta de Simulator/dispositivo indicam primeiro uma toolchain local incompleta. Erros de compilação depois que essas ferramentas e destinos estão disponíveis devem ser investigados como possível problema do projeto. Finalize repetindo:

```sh
git status --short
```

## Cuidados importantes

- use `npm ci` para instalações reproduzíveis;
- não execute `npm audit fix --force`;
- não execute `expo install --fix`;
- não execute `expo prebuild`;
- não atualize Expo, React Native ou outras dependências sem análise prévia de compatibilidade para Android e iOS;
- não substitua `package-lock.json` nem `ios/Podfile.lock` por locks gerados de forma não controlada.

## Status atual

O frontend original do BovInA está passando por recuperação e modernização incremental. A prioridade atual é estabilizar configuração, builds e ambiente de desenvolvimento preservando o comportamento existente. Arquitetura, ambientes, segurança, testes e demais evoluções serão tratados em etapas posteriores; o projeto não deve ser considerado pronto para produção neste momento.
