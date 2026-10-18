import {
    AuthRequest,
    CodeChallengeMethod,
    ResponseType,
    fetchDiscoveryAsync,
} from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import axios from 'axios'

import { getOidcConfig } from '../../config/oidc'

export class OidcFlowError extends Error {
    constructor(code, message) {
        super(message)
        this.name = 'OidcFlowError'
        this.code = code
    }
}

const requireDiscovery = (discovery, config) => {
    if (
        discovery?.discoveryDocument?.issuer !== config.issuer ||
        !discovery?.authorizationEndpoint ||
        !discovery?.tokenEndpoint
    ) {
        throw new OidcFlowError(
            'OIDC_DISCOVERY_INVALID',
            'O provedor de autenticação retornou uma configuração inválida.'
        )
    }

    const supportedMethods = discovery.discoveryDocument
        ?.code_challenge_methods_supported

    if (
        Array.isArray(supportedMethods) &&
        !supportedMethods.includes(CodeChallengeMethod.S256)
    ) {
        throw new OidcFlowError(
            'OIDC_PKCE_S256_REQUIRED',
            'O provedor não oferece o mecanismo de autenticação exigido.'
        )
    }

    return discovery
}

const tokenSnapshot = (response, fallbackRefreshToken = null) => ({
    accessToken: response?.accessToken,
    refreshToken: response?.refreshToken ?? fallbackRefreshToken,
    idToken: response?.idToken ?? null,
    issuedAt: response?.issuedAt,
    expiresIn: response?.expiresIn,
})

const encodeForm = fields => Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => (
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    ))
    .join('&')

const mapTokenResponse = response => ({
    accessToken: response?.data?.access_token,
    refreshToken: response?.data?.refresh_token,
    idToken: response?.data?.id_token,
    issuedAt: response?.data?.issued_at,
    expiresIn: response?.data?.expires_in,
})

export const createOidcHttpTransport = ({ request = axios.request } = {}) => {
    const postForm = async (url, fields) => request({
        url,
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: encodeForm(fields),
        timeout: 15000,
    })

    return {
        async exchangeCode(config, discovery) {
            const response = await postForm(discovery.tokenEndpoint, {
                grant_type: 'authorization_code',
                client_id: config.clientId,
                code: config.code,
                redirect_uri: config.redirectUri,
                code_verifier: config.extraParams?.code_verifier,
            })

            return mapTokenResponse(response)
        },

        async refreshToken(config, discovery) {
            const response = await postForm(discovery.tokenEndpoint, {
                grant_type: 'refresh_token',
                client_id: config.clientId,
                refresh_token: config.refreshToken,
                scope: config.scopes?.join(' '),
            })

            return mapTokenResponse(response)
        },

        async revokeToken(config, discovery) {
            await postForm(discovery.revocationEndpoint, {
                client_id: config.clientId,
                token: config.token,
                token_type_hint: config.tokenTypeHint,
            })
        },
    }
}

const oidcHttpTransport = createOidcHttpTransport()

export const createOidcClient = ({
    config = getOidcConfig(),
    AuthRequestClass = AuthRequest,
    fetchDiscovery = fetchDiscoveryAsync,
    exchangeCode = oidcHttpTransport.exchangeCode,
    refreshToken = oidcHttpTransport.refreshToken,
    revokeToken = oidcHttpTransport.revokeToken,
    webBrowser = WebBrowser,
} = {}) => {
    let discoveryPromise = null

    const discover = async () => {
        if (!discoveryPromise) {
            discoveryPromise = fetchDiscovery(config.issuer)
                .then(value => requireDiscovery(value, config))
                .catch((error) => {
                    discoveryPromise = null
                    throw error
                })
        }

        return discoveryPromise
    }

    return {
        async signIn() {
            const discovery = await discover()
            const request = new AuthRequestClass({
                clientId: config.clientId,
                redirectUri: config.redirectUri,
                responseType: ResponseType.Code,
                scopes: config.scopes,
                usePKCE: true,
                codeChallengeMethod: CodeChallengeMethod.S256,
            })
            const result = await request.promptAsync(discovery)

            if (['cancel', 'dismiss', 'locked'].includes(result.type)) {
                return null
            }

            if (result.type !== 'success' || result.error) {
                throw new OidcFlowError(
                    result.error?.code ?? 'OIDC_AUTHORIZATION_FAILED',
                    'Não foi possível concluir a autenticação.'
                )
            }

            const code = result.params?.code

            if (!code || !request.codeVerifier) {
                throw new OidcFlowError(
                    'OIDC_AUTHORIZATION_RESPONSE_INVALID',
                    'A resposta de autenticação está incompleta.'
                )
            }

            const response = await exchangeCode({
                clientId: config.clientId,
                code,
                redirectUri: config.redirectUri,
                extraParams: { code_verifier: request.codeVerifier },
            }, discovery)

            return tokenSnapshot(response)
        },

        async refresh(refreshTokenValue) {
            const discovery = await discover()
            const response = await refreshToken({
                clientId: config.clientId,
                refreshToken: refreshTokenValue,
                scopes: config.scopes,
            }, discovery)

            return tokenSnapshot(response, refreshTokenValue)
        },

        async logoutRemote({ refreshToken: refreshTokenValue, idToken }) {
            const discovery = await discover()
            let succeeded = true

            if (idToken && discovery.endSessionEndpoint) {
                const query = new URLSearchParams({
                    client_id: config.clientId,
                    id_token_hint: idToken,
                    post_logout_redirect_uri: config.redirectUri,
                })
                try {
                    const result = await webBrowser.openAuthSessionAsync(
                        `${discovery.endSessionEndpoint}?${query}`,
                        config.redirectUri
                    )
                    if (result.type !== 'success') {
                        succeeded = false
                    }
                } catch {
                    succeeded = false
                }
            }

            if (refreshTokenValue && discovery.revocationEndpoint) {
                try {
                    await revokeToken({
                        clientId: config.clientId,
                        token: refreshTokenValue,
                        tokenTypeHint: 'refresh_token',
                    }, discovery)
                } catch {
                    succeeded = false
                }
            }

            return succeeded
        },
    }
}
