import {
    clearTargetOrganizationServerState,
    clearTargetSessionServerState,
    createTargetQueryClient,
} from '../targetQueryClient'
import {
    targetBootstrapQueryKey,
    targetOrganizationQueryKey,
} from '../targetQueryKeys'

describe('target server-state foundation', () => {
    test('provides an explicit bootstrap namespace without an Organization', () => {
        expect(targetBootstrapQueryKey('session', 'me')).toEqual([
            'target',
            'bootstrap',
            'session',
            'me',
        ])
    })

    test('partitions Organization-owned keys by a required stable ID', () => {
        expect(
            targetOrganizationQueryKey(
                'organization-a',
                'clients',
                'client-1'
            )
        ).toEqual([
            'target',
            'organization',
            'organization-a',
            'clients',
            'client-1',
        ])
        expect(() => targetOrganizationQueryKey('', 'clients')).toThrow(TypeError)
        expect(() => targetOrganizationQueryKey(12, 'clients')).toThrow(TypeError)
    })

    test('does not retry target queries or mutations by default', () => {
        const queryClient = createTargetQueryClient()

        expect(queryClient.getDefaultOptions()).toMatchObject({
            queries: { retry: false },
            mutations: { retry: false },
        })
    })

    test('removes every tenant cache without clearing bootstrap state', async () => {
        const queryClient = createTargetQueryClient()
        const bootstrapKey = targetBootstrapQueryKey('session', 'me')
        const organizationAKey = targetOrganizationQueryKey(
            'organization-a',
            'clients'
        )
        const organizationBKey = targetOrganizationQueryKey(
            'organization-b',
            'clients'
        )

        queryClient.setQueryData(bootstrapKey, { id: 'user-1' })
        queryClient.setQueryData(organizationAKey, ['client-a'])
        queryClient.setQueryData(organizationBKey, ['client-b'])

        expect(queryClient.getQueryData(organizationAKey)).toEqual(['client-a'])
        expect(queryClient.getQueryData(organizationBKey)).toEqual(['client-b'])

        await clearTargetOrganizationServerState(queryClient)

        expect(queryClient.getQueryData(bootstrapKey)).toEqual({ id: 'user-1' })
        expect(queryClient.getQueryData(organizationAKey)).toBeUndefined()
        expect(queryClient.getQueryData(organizationBKey)).toBeUndefined()

        queryClient.clear()
    })

    test('cancels an active tenant query without canceling bootstrap state', async () => {
        const queryClient = createTargetQueryClient()
        const bootstrapKey = targetBootstrapQueryKey('session', 'me')
        const organizationKey = targetOrganizationQueryKey(
            'organization-a',
            'clients'
        )
        let organizationSignal

        queryClient.setQueryData(bootstrapKey, { id: 'user-1' })
        const organizationRequest = queryClient.fetchQuery({
            queryKey: organizationKey,
            queryFn: ({ signal }) => {
                organizationSignal = signal

                return new Promise(() => {})
            },
        })
        const settledOrganizationRequest = organizationRequest.catch(error => error)

        await clearTargetOrganizationServerState(queryClient)

        expect(organizationSignal.aborted).toBe(true)
        expect((await settledOrganizationRequest).message).toBe('CancelledError')
        expect(queryClient.getQueryData(bootstrapKey)).toEqual({ id: 'user-1' })
        expect(queryClient.getQueryData(organizationKey)).toBeUndefined()

        queryClient.clear()
    })

    test('clears bootstrap and tenant state when the session ends', async () => {
        const queryClient = createTargetQueryClient()
        const bootstrapKey = targetBootstrapQueryKey('session', 'me')
        const organizationKey = targetOrganizationQueryKey(
            'organization-a',
            'clients'
        )

        queryClient.setQueryData(bootstrapKey, { id: 'user-1' })
        queryClient.setQueryData(organizationKey, ['client-a'])

        await clearTargetSessionServerState(queryClient)

        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    })
})
