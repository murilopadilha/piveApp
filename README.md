# BovInA Mobile

<p align="center">
  <img src="src/images/menu/logo.png" alt="BovInA" width="160" />
</p>

<p align="center">
  <img alt="Expo 51.0.39" src="https://img.shields.io/badge/Expo-51.0.39-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img alt="React Native 0.74.5" src="https://img.shields.io/badge/React_Native-0.74.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="React 18.2.0" src="https://img.shields.io/badge/React-18.2.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="Node.js 20.20.2" src="https://img.shields.io/badge/Node.js-20.20.2-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="npm 10.8.2" src="https://img.shields.io/badge/npm-10.8.2-CB3837?style=for-the-badge&logo=npm&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000" />
</p>

BovInA Mobile is the React Native application for BovInA, a system that supports the operational workflow of bovine in vitro embryo production. It provides mobile access to organization-scoped records and workflows while keeping the backend API authoritative for business rules, permissions and persisted state.

## Overview

The application covers operational areas such as Organizations, clients, animals, OPU and oocyte collection, fertilization and matings, embryos, recipient cycles and transfers, pregnancy checks, cryogenic inventory, documents, traceability, distribution and recalls, and data-quality visibility.

Some later workflow capabilities remain intentionally unavailable where the backend contract, policy or reload-safe readback is incomplete. The UI does not emulate those capabilities locally. The original FIV and calendar surfaces also coexist with the newer organization-scoped target API features.

## Architecture and tech stack

The repository is a JavaScript React Native application built with Expo and committed native iOS and Android projects.

| Area | Technology | Current version or behavior |
| --- | --- | --- |
| Runtime | Node.js / npm | Node.js `20.20.2`, npm `10.8.2` |
| Mobile | Expo / React Native / React | Expo `51.0.39`, React Native `0.74.5`, React `18.2.0` |
| Navigation | React Navigation | Native stack and bottom tabs, major version 6 |
| Server state | TanStack Query | Organization-scoped query keys and cache lifecycle |
| HTTP | Axios | Separate target and legacy clients |
| Authentication | Expo AuthSession, WebBrowser and SecureStore | Authorization Code with PKCE; refresh token stored in the device secure store |
| Native documents | Expo FileSystem and Sharing | Ephemeral document retrieval and the system share sheet |
| Tests | Jest and React Native Testing Library | Tests run serially through the repository scripts |
| Language | JavaScript | TypeScript is not currently used |

The code is organized primarily by feature. Target feature modules typically contain API adapters, query hooks, presentation helpers, reusable components and screens. The target Axios client supplies bearer authentication, the current Organization header, correlation identifiers, timeout behavior, normalized Problem Details and a single 401 refresh/retry path.

Authentication and Organization selection are separate concerns: a user first authenticates with the configured OpenID Connect provider and then selects an Organization membership. Target queries are scoped by Organization and are reset when that context changes.

The target and legacy HTTP clients are intentionally separate. Do not route target features through legacy services or assume that the current BovInA backend implements the older FIV/calendar endpoints.

## Project structure

```text
.
├── android/              # Authoritative Android native project
├── ios/                  # Authoritative iOS native project and CocoaPods workspace
├── src/
│   ├── App.js            # React root and provider composition
│   ├── api/              # Legacy client and organization-aware target client
│   ├── assets/           # Fonts and bundled assets
│   ├── components/       # Shared UI components
│   ├── config/           # API and OpenID Connect environment configuration
│   ├── features/         # Feature-oriented target modules
│   ├── images/           # Application imagery and BovInA branding
│   ├── navigation/       # Root, authentication, legacy and target navigation
│   ├── providers/        # Application providers and lifecycle integration
│   ├── screens/          # Legacy application screens
│   ├── serverState/      # TanStack Query client and key conventions
│   └── utils/            # Shared utilities
├── app.json
├── babel.config.js
├── index.js              # Expo application entry point
├── metro.config.js
└── package.json
```

`ios/` and `android/` are the authoritative native projects. **Do not run `expo prebuild` as part of normal setup**: regenerating those directories can overwrite committed native configuration.

## Prerequisites

Install the following before setting up the application:

- Git.
- Node.js `20.20.2` and npm `10.8.2`. These exact versions are declared by `.nvmrc`, `package.json` and the lockfile; npm enforces the engine declaration.
- A running BovInA backend and an interactive OpenID Connect provider. See [Backend](#backend) and [Authentication](#authentication).
- For iOS: macOS, Xcode with an iOS Simulator runtime, Xcode Command Line Tools and CocoaPods. The current project has been used with Xcode `26.6` and CocoaPods `1.17.0`; compatibility with every Xcode release is not implied by Expo SDK 51.
- For Android: Android Studio, an Android SDK and an emulator or connected device. The committed project targets Android SDK 34 and has a minimum SDK of 23. See [Android](#android) for its current validation status.

Confirm the core tools:

```bash
git --version
node --version
npm --version

# iOS development
xcodebuild -version
pod --version
xcrun simctl list devices available

# Android development
java -version
adb version
```

A globally installed Expo CLI is not required. The npm scripts use the repository-local Expo CLI.

## Backend

The mobile application consumes the BovInA backend API. Instructions for starting the API, PostgreSQL database and the backend development environment are maintained in the backend repository:

**[BovInA Backend](https://github.com/Gab-Mello/bovina)**

Follow that repository's README instead of duplicating its Docker, database, migration and bootstrap instructions here. For the default local target API configuration, the API is expected at `http://127.0.0.1:8080`; its readiness endpoint is:

```bash
curl --fail http://127.0.0.1:8080/actuator/health/readiness
```

The backend's standard local mock token issuer is intended for backend development and service tokens; it does not provide the interactive browser login required by this mobile client. Configure an interactive OpenID Connect provider as described below.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/murilopadilha/piveApp.git
cd piveApp
```

### 2. Select the supported Node.js version

With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install
nvm use
node --version   # v20.20.2
npm --version    # 10.8.2
```

If you do not use nvm, install the exact Node.js and npm versions declared in `package.json`. Because `.npmrc` enables `engine-strict`, installation stops when incompatible versions are active.

### 3. Install JavaScript dependencies

```bash
npm ci
```

Use `npm ci` for a clean, reproducible installation from `package-lock.json`. Use `npm install` only when intentionally changing dependencies and the lockfile.

### 4. Configure the local environment

Create `.env.local` in the repository root. It is ignored by Git.

```dotenv
EXPO_PUBLIC_TARGET_API_URL=http://127.0.0.1:8080
EXPO_PUBLIC_OIDC_ISSUER=https://your-interactive-oidc-provider.example/realms/bovina
EXPO_PUBLIC_OIDC_CLIENT_ID=your-mobile-public-client-id

# Optional: required only by legacy FIV/calendar surfaces.
# EXPO_PUBLIC_API_URL=https://your-compatible-legacy-api.example
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_TARGET_API_URL` | Yes | Base URL of the current BovInA API. The client adds `/api/v1` unless the value already ends with it. |
| `EXPO_PUBLIC_OIDC_ISSUER` | Yes | Exact issuer URL used for OpenID Connect discovery, authorization, token refresh and logout. |
| `EXPO_PUBLIC_OIDC_CLIENT_ID` | Yes | Public mobile client registered at the issuer. No client secret belongs in the application. |
| `EXPO_PUBLIC_API_URL` | Only for legacy screens | Base URL of an API compatible with the older FIV/calendar routes. The current target backend does not implement those routes. |

All `EXPO_PUBLIC_*` values are bundled into the application and must be treated as public configuration. Never place passwords, client secrets, access tokens or refresh tokens in these variables.

Restart Metro after changing environment variables. Do not rely on the legacy client's built-in historical fallback URL for a reproducible local setup; configure `EXPO_PUBLIC_API_URL` explicitly when legacy surfaces are needed.

### 5. Install iOS pods

```bash
cd ios
pod install
cd ..
```

Run this after the initial `npm ci` and again when an approved native dependency changes. Do not run `expo prebuild`.

### 6. Start the local stack in order

1. Start the backend and PostgreSQL by following the backend README.
2. Start or confirm the interactive OpenID Connect provider and its mobile client registration.
3. Confirm the backend readiness endpoint succeeds.
4. Confirm `.env.local` points to the backend and issuer that are reachable from the selected simulator or device.
5. Install dependencies and iOS pods as shown above.
6. Start Metro in one terminal.
7. Build and open the application in a second terminal.
8. Authenticate and select an Organization membership.

### 7. Run on iOS

Terminal 1 — keep Metro running:

```bash
npm start
```

Terminal 2 — build, install and open the committed iOS project in a Simulator:

```bash
npm run ios
```

The first native build can take several minutes. Subsequent JavaScript changes normally reload through Metro without rebuilding the native app.

## Android

The repository includes an authoritative Android native project and the real run script:

```bash
npm start
```

In a second terminal:

```bash
npm run android
```

Before running it, start an Android emulator in Android Studio or connect a device, and ensure Android Studio/Gradle can resolve the installed SDK. The current native configuration uses compile/target SDK 34, minimum SDK 23, Gradle wrapper 8.5 and Kotlin 1.9.23.

Android was not rebuilt during the latest documentation validation because the local validation environment did not have Android SDK command-line tools available. Treat the committed project and script as supported source configuration, but validate the build on an Android-equipped workstation before claiming a release build is green. Do not regenerate it with `expo prebuild`.

For a physical iOS or Android device, `127.0.0.1` refers to the device itself. Configure reachable HTTPS or LAN URLs for the API and issuer, and make sure the backend, identity provider and platform network-security rules permit those URLs.

## Authentication

The application uses OpenID Connect Authorization Code flow with PKCE (`S256`) through the system browser. The configured provider must:

- expose standard OpenID Connect discovery metadata at `EXPO_PUBLIC_OIDC_ISSUER`;
- register `EXPO_PUBLIC_OIDC_CLIENT_ID` as a public mobile client without a client secret;
- allow the native callback URI `bovina://auth`;
- support interactive browser authorization, token exchange, refresh and, when available, revocation/end-session behavior.

The access token remains in memory. The refresh token is stored with Expo SecureStore using a device-only accessibility policy. After authentication, the application loads the user's backend memberships; a single Organization can be selected automatically, while multiple memberships require explicit selection.

The backend repository's standard mock issuer is not an interactive login UI. Use the interactive local identity setup maintained by your team or another compatible development issuer. This repository intentionally contains no usernames, passwords, tokens or identity-provider secrets.

## Tests

Run the Jest suite serially:

```bash
npm test
```

Investigate resource leaks without hiding them:

```bash
npm test -- --detectOpenHandles
```

Generate coverage:

```bash
npm run test:coverage
```

Do not use `--forceExit` as a routine workaround. The suite covers feature APIs and query contracts, navigation and permissions, Organization isolation, presentation behavior, command retry semantics, accessibility and regressions across target and legacy boundaries.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo/Metro development server. |
| `npm run ios` | Build, install and launch the committed iOS project. |
| `npm run android` | Build, install and launch the committed Android project. |
| `npm test` | Run Jest serially. |
| `npm test -- --detectOpenHandles` | Run Jest and report resources that keep Node alive. |
| `npm run test:coverage` | Run Jest with coverage. |
| `npm run mock-api` | Start the small legacy `json-server` fixture. It is not a substitute for the BovInA backend and does not cover all legacy routes. |

## Troubleshooting

### The application cannot connect to the server

1. Confirm the backend readiness endpoint succeeds.
2. Confirm `EXPO_PUBLIC_TARGET_API_URL` is set in `.env.local` and is reachable from the simulator/device.
3. Restart Metro after changing `.env.local`; if its cache is stale, stop it with `Ctrl+C` and run `npm start -- --clear`.
4. For a physical device, replace `127.0.0.1` with a reachable development URL.
5. If only an original FIV/calendar screen fails, verify `EXPO_PUBLIC_API_URL` points to a compatible legacy API. The current target backend and the small local JSON fixture do not provide the complete legacy contract.

### Login fails or the browser cannot return to the app

- Confirm the issuer is exact and exposes OpenID Connect discovery metadata.
- Confirm the configured client ID is public and allows `bovina://auth`.
- Confirm the identity provider supports interactive browser login; the backend mock token issuer is insufficient for this flow.
- Confirm the backend is running and recognizes the token issuer/audience expected for the environment.
- If no Organization can be selected, confirm the authenticated user has an active Organization membership in the backend.

### The app signs in without asking for credentials

This can be expected when a refresh token is still available in the device secure store or the system browser retains an identity-provider session. Use the application's sign-out action to clear the app session and request token revocation when supported.

### CocoaPods or an iOS native module is out of date

After installing dependencies or changing an approved native package, run:

```bash
cd ios
pod install
cd ..
```

Then rebuild with `npm run ios`. Do not use `expo prebuild`, `pod deintegrate` or destructive cache cleanup as a first step.

### Metro is already running

Reuse the existing Metro terminal. If it is stale, stop that process with `Ctrl+C` and start it again with `npm start`. Avoid running multiple Metro instances on the same port.

### No suitable iOS Simulator appears

```bash
xcrun simctl list devices available
open -a Simulator
```

Install the required simulator runtime through Xcode settings if the list is empty. Use `npm run ios` for the normal signed Simulator build; do not disable code signing on an app that must be installed.

## Project background and evolution

BovInA began as a final academic project focused on improving the traceability and operation of bovine in vitro embryo production. It was presented at MOSTRATEC, where it received third place in Computer Science. The system is now being evolved toward a commercial MVP, with the mobile application and backend developed as parts of the same product.

## Related project

- Backend API and local infrastructure: [github.com/Gab-Mello/bovina](https://github.com/Gab-Mello/bovina)
