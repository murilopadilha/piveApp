import { makeRedirectUri } from 'expo-auth-session'

export const OIDC_REDIRECT_SCHEME = 'bovina'
export const OIDC_NATIVE_REDIRECT_URI = 'bovina://auth'

const normalizeIssuer = value => value?.trim().replace(/\/+$/, '') || null
const normalizeClientId = value => value?.trim() || null

export class OidcConfigurationError extends Error {
    constructor() {
        super('A configuração de autenticação mobile está incompleta.')
        this.name = 'OidcConfigurationError'
        this.code = 'OIDC_CONFIGURATION_REQUIRED'
    }
}

export const resolveOidcConfig = ({
    issuer,
    clientId,
    createRedirectUri = makeRedirectUri,
} = {}) => {
    const normalizedIssuer = normalizeIssuer(issuer)
    const normalizedClientId = normalizeClientId(clientId)

    if (!normalizedIssuer || !normalizedClientId) {
        throw new OidcConfigurationError()
    }

    return Object.freeze({
        issuer: normalizedIssuer,
        clientId: normalizedClientId,
        redirectUri: createRedirectUri({
            scheme: OIDC_REDIRECT_SCHEME,
            path: 'auth',
            native: OIDC_NATIVE_REDIRECT_URI,
        }),
        scopes: Object.freeze(['openid']),
    })
}

export const getOidcConfig = () => resolveOidcConfig({
    issuer: process.env.EXPO_PUBLIC_OIDC_ISSUER,
    clientId: process.env.EXPO_PUBLIC_OIDC_CLIENT_ID,
})
