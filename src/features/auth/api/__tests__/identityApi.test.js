import targetApiClient from '../../../../api/target/client'
import {
    getEffectiveContext,
    getMemberships,
    mapEffectiveContext,
    mapMemberships,
} from '../identityApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}))

describe('target identity API', () => {
    test('loads memberships as authenticated bootstrap state without Organization scope', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: [{
                organizationId: 'organization-a',
                actorId: 'actor-a',
                permissions: ['master-data:read'],
            }],
        })

        await expect(getMemberships({ signal })).resolves.toEqual([{
            organizationId: 'organization-a',
            actorId: 'actor-a',
            permissions: ['master-data:read'],
        }])
        expect(targetApiClient.get).toHaveBeenCalledWith('/me/memberships', {
            signal,
            targetContext: { organizationScoped: false },
        })
    })

    test('loads the Organization-scoped effective context', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: {
                tenantId: 'organization-a',
                actorId: 'actor-a',
                permissions: ['master-data:read', 'client:read'],
                correlationId: 'correlation-a',
            },
        })

        await expect(getEffectiveContext({ signal })).resolves.toEqual({
            tenantId: 'organization-a',
            actorId: 'actor-a',
            permissions: ['master-data:read', 'client:read'],
            correlationId: 'correlation-a',
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/me', { signal })
    })

    test('rejects membership and effective-context contract drift', () => {
        expect(() => mapMemberships({ items: [] })).toThrow(TypeError)
        expect(() => mapMemberships([{
            organizationId: 'organization-a',
            actorId: 'actor-a',
            permissions: null,
        }])).toThrow(TypeError)
        expect(() => mapEffectiveContext({
            tenantId: 'organization-a',
            actorId: 'actor-a',
            permissions: [],
        })).toThrow(TypeError)
    })

    test('normalizes backend failures instead of exposing raw errors', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 403,
                data: {
                    code: 'ACCESS_DENIED',
                    detail: 'Access denied',
                    traceId: 'trace-a',
                },
            },
        })

        await expect(getMemberships()).rejects.toMatchObject({
            kind: 'forbidden',
            status: 403,
            code: 'ACCESS_DENIED',
            traceId: 'trace-a',
        })
    })
})
