import {
    OIDC_NATIVE_REDIRECT_URI,
    OIDC_REDIRECT_SCHEME,
    OidcConfigurationError,
    resolveOidcConfig,
} from '../oidc'

describe('OIDC configuration', () => {
    test('derives the native redirect with the approved scheme', () => {
        const createRedirectUri = jest.fn(() => OIDC_NATIVE_REDIRECT_URI)

        expect(resolveOidcConfig({
            issuer: ' http://localhost:8180/realms/bovina/ ',
            clientId: ' bovina-mobile ',
            createRedirectUri,
        })).toEqual({
            issuer: 'http://localhost:8180/realms/bovina',
            clientId: 'bovina-mobile',
            redirectUri: 'bovina://auth',
            scopes: ['openid'],
        })
        expect(createRedirectUri).toHaveBeenCalledWith({
            scheme: OIDC_REDIRECT_SCHEME,
            path: 'auth',
            native: OIDC_NATIVE_REDIRECT_URI,
        })
    })

    test('requires public issuer and client configuration', () => {
        expect(() => resolveOidcConfig({
            issuer: '',
            clientId: 'bovina-mobile',
        })).toThrow(OidcConfigurationError)
    })
})
