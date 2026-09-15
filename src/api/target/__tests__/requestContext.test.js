import {
    TARGET_API_VERSION_PATH,
    resolveTargetApiBaseUrl,
} from '../../../config/targetApi'
import {
    TargetRequestContextError,
    applyTargetRequestContext,
    getTargetRuntimeContext,
    resetTargetRuntimeContext,
    setTargetAccessToken,
    setTargetOrganizationId,
} from '../requestContext'
import {
    TARGET_API_TIMEOUT_MS,
    TargetApiConfigurationError,
    createTargetApiClient,
} from '../client'
import legacyApiClient from '../../client'

afterEach(() => {
    resetTargetRuntimeContext()
})

describe('target API configuration', () => {
    test('requires an explicit URL and appends the target version path once', () => {
        expect(resolveTargetApiBaseUrl(undefined)).toBeNull()
        expect(resolveTargetApiBaseUrl('  ')).toBeNull()
        expect(resolveTargetApiBaseUrl('https://api.example.test/')).toBe(
            `https://api.example.test${TARGET_API_VERSION_PATH}`
        )
        expect(resolveTargetApiBaseUrl('https://api.example.test/api/v1/')).toBe(
            'https://api.example.test/api/v1'
        )
    })
})

describe('target request context', () => {
    test('stores only normalized runtime auth and Organization context', () => {
        setTargetAccessToken(' token-value ')
        setTargetOrganizationId(' organization-a ')

        expect(getTargetRuntimeContext()).toEqual({
            accessToken: 'token-value',
            organizationId: 'organization-a',
        })
    })

    test('rejects an authenticated target request without a token', () => {
        expect(() => applyTargetRequestContext({ headers: {} }, {
            context: { accessToken: null, organizationId: 'organization-a' },
        })).toThrow(TargetRequestContextError)
    })

    test('rejects an Organization-scoped request without an active Organization', () => {
        expect(() => applyTargetRequestContext({ headers: {} }, {
            context: { accessToken: 'token', organizationId: null },
        })).toThrow(expect.objectContaining({ code: 'ORGANIZATION_REQUIRED' }))
    })

    test('allows bootstrap requests to opt out of Organization scope', () => {
        const config = applyTargetRequestContext({
            headers: {},
            targetContext: { organizationScoped: false },
        }, {
            context: { accessToken: 'token', organizationId: null },
        })

        expect(config.headers).toMatchObject({
            Authorization: 'Bearer token',
        })
        expect(config).not.toHaveProperty('targetContext')
    })

    test('adds standard command/version headers and configured context headers', () => {
        const signal = new AbortController().signal
        const config = applyTargetRequestContext({
            headers: {},
            signal,
            targetContext: {
                correlationId: 'trace-1',
                idempotencyKey: 'command-1',
                expectedVersion: '"version-3"',
            },
        }, {
            context: {
                accessToken: 'token',
                organizationId: 'organization-a',
            },
            organizationHeaderName: 'Configured-Organization-Header',
            correlationHeaderName: 'Configured-Correlation-Header',
        })

        expect(config.headers).toEqual({
            Authorization: 'Bearer token',
            'Configured-Organization-Header': 'organization-a',
            'Configured-Correlation-Header': 'trace-1',
            'Idempotency-Key': 'command-1',
            'If-Match': '"version-3"',
        })
        expect(config.signal).toBe(signal)
    })

    test('does not invent Organization or correlation header names', () => {
        const config = applyTargetRequestContext({
            headers: {},
            targetContext: { correlationId: 'trace-1' },
        }, {
            context: {
                accessToken: 'token',
                organizationId: 'organization-a',
            },
        })

        expect(config.headers).toEqual({ Authorization: 'Bearer token' })
    })
})

describe('target Axios client', () => {
    test('is a separate client from the legacy API boundary', () => {
        const targetClient = createTargetApiClient({
            baseURL: 'https://api.example.test/api/v1',
        })

        expect(targetClient).not.toBe(legacyApiClient)
        expect(targetClient.defaults.baseURL).toBe(
            'https://api.example.test/api/v1'
        )
        expect(legacyApiClient.defaults.baseURL).not.toBe(
            targetClient.defaults.baseURL
        )
    })

    test('injects context while preserving AbortSignal and timeout', async () => {
        const signal = new AbortController().signal
        const client = createTargetApiClient({
            baseURL: 'https://api.example.test/api/v1',
            getRequestContext: () => ({
                accessToken: 'token',
                organizationId: 'organization-a',
            }),
        })

        const response = await client.get('/clients', {
            signal,
            targetContext: { idempotencyKey: 'command-1' },
            adapter: async config => ({
                data: null,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
            }),
        })

        expect(response.config.baseURL).toBe('https://api.example.test/api/v1')
        expect(response.config.timeout).toBe(TARGET_API_TIMEOUT_MS)
        expect(response.config.signal).toBe(signal)
        expect(response.config.headers.get('Authorization')).toBe('Bearer token')
        expect(response.config.headers.get('Idempotency-Key')).toBe('command-1')
    })

    test('fails before transport when the target URL is unresolved', async () => {
        const client = createTargetApiClient({
            baseURL: null,
            getRequestContext: () => ({
                accessToken: 'token',
                organizationId: 'organization-a',
            }),
        })

        await expect(client.get('/clients')).rejects.toBeInstanceOf(
            TargetApiConfigurationError
        )
    })
})
