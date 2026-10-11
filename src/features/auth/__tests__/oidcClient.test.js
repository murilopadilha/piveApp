import {
    CodeChallengeMethod,
    ResponseType,
} from 'expo-auth-session'

import {
    createOidcClient,
    createOidcHttpTransport,
} from '../oidcClient'

const config = {
    issuer: 'http://localhost:8180/realms/bovina',
    clientId: 'bovina-mobile',
    redirectUri: 'bovina://auth',
    scopes: ['openid'],
}

const discovery = {
    discoveryDocument: {
        issuer: config.issuer,
        code_challenge_methods_supported: ['S256'],
    },
    authorizationEndpoint: `${config.issuer}/protocol/openid-connect/auth`,
    tokenEndpoint: `${config.issuer}/protocol/openid-connect/token`,
    revocationEndpoint: `${config.issuer}/protocol/openid-connect/revoke`,
    endSessionEndpoint: `${config.issuer}/protocol/openid-connect/logout`,
}

describe('OIDC mobile client', () => {
    test('posts authorization, refresh, and revocation forms through the existing HTTP dependency', async () => {
        const request = jest.fn()
            .mockResolvedValueOnce({
                data: {
                    access_token: 'access-1',
                    refresh_token: 'refresh-1',
                    id_token: 'id-1',
                    expires_in: 300,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    access_token: 'access-2',
                    refresh_token: 'refresh-2',
                    expires_in: 300,
                },
            })
            .mockResolvedValueOnce({ data: null })
        const transport = createOidcHttpTransport({ request })

        await expect(transport.exchangeCode({
            clientId: config.clientId,
            code: 'authorization-code',
            redirectUri: config.redirectUri,
            extraParams: { code_verifier: 'code-verifier' },
        }, discovery)).resolves.toMatchObject({
            accessToken: 'access-1',
            refreshToken: 'refresh-1',
        })
        await expect(transport.refreshToken({
            clientId: config.clientId,
            refreshToken: 'refresh-1',
            scopes: ['openid'],
        }, discovery)).resolves.toMatchObject({
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
        })
        await expect(transport.revokeToken({
            clientId: config.clientId,
            token: 'refresh-2',
            tokenTypeHint: 'refresh_token',
        }, discovery)).resolves.toBeUndefined()

        expect(request).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: discovery.tokenEndpoint,
            method: 'POST',
            data: expect.stringContaining('code_verifier=code-verifier'),
        }))
        expect(request).toHaveBeenNthCalledWith(2, expect.objectContaining({
            data: expect.stringContaining('refresh_token=refresh-1'),
        }))
        expect(request).toHaveBeenNthCalledWith(3, expect.objectContaining({
            url: discovery.revocationEndpoint,
            data: expect.stringContaining('token=refresh-2'),
        }))
    })

    test('uses authorization code with PKCE S256 and exchanges the code', async () => {
        const promptAsync = jest.fn(async () => ({
            type: 'success',
            params: { code: 'authorization-code' },
        }))
        const AuthRequestClass = jest.fn().mockImplementation((requestConfig) => ({
            codeVerifier: 'code-verifier',
            promptAsync,
            requestConfig,
        }))
        const exchangeCode = jest.fn(async () => ({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            idToken: 'id-token',
            issuedAt: 10,
            expiresIn: 300,
        }))
        const client = createOidcClient({
            config,
            AuthRequestClass,
            fetchDiscovery: jest.fn(async () => discovery),
            exchangeCode,
        })

        await expect(client.signIn()).resolves.toEqual({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            idToken: 'id-token',
            issuedAt: 10,
            expiresIn: 300,
        })
        expect(AuthRequestClass).toHaveBeenCalledWith({
            clientId: 'bovina-mobile',
            redirectUri: 'bovina://auth',
            responseType: ResponseType.Code,
            scopes: ['openid'],
            usePKCE: true,
            codeChallengeMethod: CodeChallengeMethod.S256,
        })
        expect(promptAsync).toHaveBeenCalledWith(discovery)
        expect(exchangeCode).toHaveBeenCalledWith({
            clientId: 'bovina-mobile',
            code: 'authorization-code',
            redirectUri: 'bovina://auth',
            extraParams: { code_verifier: 'code-verifier' },
        }, discovery)
    })

    test('treats browser cancellation as no session', async () => {
        const exchangeCode = jest.fn()
        const client = createOidcClient({
            config,
            AuthRequestClass: jest.fn().mockImplementation(() => ({
                codeVerifier: 'code-verifier',
                promptAsync: jest.fn(async () => ({ type: 'cancel' })),
            })),
            fetchDiscovery: jest.fn(async () => discovery),
            exchangeCode,
        })

        await expect(client.signIn()).resolves.toBeNull()
        expect(exchangeCode).not.toHaveBeenCalled()
    })

    test('uses discovery for refresh and best-effort remote logout', async () => {
        const refreshToken = jest.fn(async () => ({
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            issuedAt: 20,
            expiresIn: 300,
        }))
        const revokeToken = jest.fn(async () => undefined)
        const webBrowser = {
            openAuthSessionAsync: jest.fn(async () => ({ type: 'success' })),
        }
        const client = createOidcClient({
            config,
            fetchDiscovery: jest.fn(async () => discovery),
            refreshToken,
            revokeToken,
            webBrowser,
        })

        await expect(client.refresh('refresh-1')).resolves.toMatchObject({
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
        })
        await expect(client.logoutRemote({
            refreshToken: 'refresh-2',
            idToken: 'id-token',
        })).resolves.toBe(true)
        expect(revokeToken).toHaveBeenCalledWith({
            clientId: 'bovina-mobile',
            token: 'refresh-2',
            tokenTypeHint: 'refresh_token',
        }, discovery)
        expect(webBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
            expect.stringContaining('id_token_hint=id-token'),
            'bovina://auth'
        )
        expect(webBrowser.openAuthSessionAsync.mock.invocationCallOrder[0]).toBeLessThan(
            revokeToken.mock.invocationCallOrder[0]
        )
    })
})
