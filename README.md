# BovInA — frontend mobile

Frontend mobile do BovInA para os fluxos de animais, agenda e produção in vitro de embriões bovinos (PIVE). O aplicativo tem projetos nativos para Android e iOS e ainda não está configurado para publicação em produção.

## Stack

- Expo SDK 51.0.39
- React Native 0.74.5
- React 18.2.0
- JavaScript, Babel e Metro
- React Navigation 6
- Axios
- Jest 29 e React Native Testing Library
- Node.js 20.20.2 e npm 10.8.2

O projeto usa exclusivamente npm. As versões de Node e npm também estão declaradas em `.nvmrc`, `package.json` e `.npmrc`.

## Pré-requisitos

Para qualquer plataforma:

- Node.js por meio do [nvm](https://github.com/nvm-sh/nvm);
- npm;
- Git.

Para iOS:

- macOS;
- Xcode e um iOS Simulator;
- CocoaPods.

Para Android:

- Android Studio e Android SDK configurado;
- JDK compatível com o Gradle do projeto;
- emulador ou dispositivo conectado para instalar e executar o app.

O build de iOS Simulator foi validado com as dependências atuais. O ambiente usado nessa validação possui Xcode 26.6, que está fora da faixa oficialmente reconhecida pelo Expo SDK 51; isso não garante compatibilidade com todas as combinações modernas de Xcode e Simulator. O build Android não foi validado nesse ambiente porque o Android SDK não estava disponível.

## Instalação

Na raiz do repositório:

```sh
nvm use
npm ci
```

Para sincronizar as dependências nativas do iOS:

```sh
cd ios
pod install
cd ..
```

Não use Yarn e não execute `expo prebuild`. As pastas `ios/` e `android/` são versionadas e constituem as fontes autoritativas da configuração nativa.

## Execução

| Comando | Função |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento Expo/Metro. |
| `npm run ios` | Compila e executa o projeto nativo iOS com `expo run:ios`. |
| `npm run android` | Compila e executa o projeto nativo Android com `expo run:android`. |
| `npm run mock-api` | Inicia o `json-server` com o conteúdo de `db.json`. |

Não há target web configurado.

O `db.json` contém somente uma fixture mínima do recurso `donor`. O mock não representa todos os contratos da API e não altera automaticamente a URL usada pelo aplicativo.

## Configuração da API

O client HTTP e os services ficam em `src/api/`. A URL base é resolvida por `src/config/api.js`, preferencialmente a partir da variável:

```text
EXPO_PUBLIC_API_URL=<url-da-api>
```

Ela pode ser definida no ambiente ou em um arquivo local suportado pelo Expo, como `.env.local`. Não versione credenciais ou configurações privadas.

Quando a variável não é informada, o código ainda usa um endereço HTTP legado como fallback. Esse fallback existe para compatibilidade com o ambiente anterior e não é uma configuração adequada para publicação. Ambientes de deployment devem fornecer explicitamente uma URL HTTPS válida.

## Estrutura

```text
index.js                       entrada registrada pelo Expo
src/
├── App.js                     raiz do React e container de navegação
├── api/                       apiClient, normalização de erros e services
├── config/                    configuração de runtime, incluindo a API
├── navigation/                tabs e stacks por domínio
├── components/                componentes visuais compartilhados
├── features/
│   ├── animals/               hooks e componentes de animais
│   ├── calendar/              hooks, componentes e constantes de agenda
│   └── pive/                  filtros, hooks, componentes e styles de PIVE
├── screens/                   route screens e composição dos fluxos
├── utils/                     helpers compartilhados pequenos
├── assets/                    fontes locais
└── images/                    imagens usadas pela interface
ios/                           projeto nativo iOS e configuração CocoaPods
android/                       projeto nativo Android e Gradle Wrapper
db.json                        fixture mínima usada pelo mock-api
```

As screens concentram intenção do usuário, composição, feedback e navegação. Lifecycles remotos mais complexos vivem em hooks específicos de domínio; os services delimitam o acesso HTTP; componentes de feature cuidam apenas da apresentação e interação visual correspondente.

## Testes

Execute toda a suíte:

```sh
npm test
```

Para gerar o relatório de cobertura:

```sh
npm run test:coverage
```

A suíte cobre regras puras, datas e filtros, normalização de erros, contratos selecionados de services, lifecycles assíncronos, polling, proteção contra respostas stale, submissions, busca/ranking e alguns componentes interativos. Ela protege os fluxos de maior risco, mas não representa cobertura completa de todas as telas ou plataformas.

## Limitações conhecidas

Para desenvolvimento:

- o Android SDK precisa estar configurado localmente para builds Android;
- o iOS requer Pods sincronizados e uma combinação funcional de Xcode/Simulator;
- o Expo SDK 51 é uma stack legada e o verificador de compatibilidade pode sinalizar diferenças ou limitações em toolchains modernas;
- o mock local cobre apenas uma parte mínima da API.

Antes de uma publicação:

- substituir o debug signing usado atualmente pelo build release Android;
- configurar uma URL HTTPS de API por ambiente;
- confirmar os assets oficiais de branding;
- confirmar signing, team e bundle identifier do iOS;
- validar builds e execução em Android e iOS dentro da toolchain escolhida para release;
- reavaliar os advisories transitivos que dependem de uma futura atualização coordenada do Expo/React Native.

Não armazene keystores de release, certificados, tokens ou outros segredos de produção no repositório.
