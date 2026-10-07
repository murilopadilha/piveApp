import {
    act,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import {
    getEffectiveContext,
    getMemberships,
} from '../../../auth/api/identityApi'
import { useSession } from '../../../auth/SessionContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    targetBootstrapQueryKey,
    targetOrganizationQueryKey,
} from '../../../../serverState/targetQueryKeys'
import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import useAuthenticatedOrganization from '../useAuthenticatedOrganization'

jest.mock('../../../auth/api/identityApi', () => ({
    getMemberships: jest.fn(),
    getEffectiveContext: jest.fn(),
}))

const membership = (organizationId, permissions = [
    'master-data:read',
    'client:read',
]) => ({
    organizationId,
    actorId: `actor-${organizationId}`,
    permissions,
})

const effectiveContext = organizationId => ({
    tenantId: organizationId,
    actorId: `actor-${organizationId}`,
    permissions: ['master-data:read', 'client:read'],
    correlationId: `trace-${organizationId}`,
})

const createWrapper = (queryClient) => function Wrapper({ children }) {
    return (
        <TargetFoundationProvider
            queryClient={queryClient}
            restoreSession={() => Promise.resolve({ accessToken: 'token' })}
        >
            {children}
        </TargetFoundationProvider>
    )
}

const createTestQueryClient = () => {
    const queryClient = createTargetQueryClient()

    queryClient.setDefaultOptions({
        ...queryClient.getDefaultOptions(),
        queries: {
            ...queryClient.getDefaultOptions().queries,
            gcTime: Infinity,
        },
    })

    return queryClient
}

afterEach(() => {
    resetTargetRuntimeContext()
})

describe('useAuthenticatedOrganization', () => {
    test('auto-selects a single membership and loads effective context', async () => {
        const queryClient = createTestQueryClient()
        getMemberships.mockResolvedValueOnce([membership('organization-a')])
        getEffectiveContext.mockResolvedValueOnce(
            effectiveContext('organization-a')
        )
        const { result, unmount } = renderHook(
            () => useAuthenticatedOrganization(),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => {
            expect(result.current.isReady).toBe(true)
        })
        expect(result.current.activeOrganizationId).toBe('organization-a')
        expect(result.current.effectiveContext).toEqual(
            effectiveContext('organization-a')
        )
        expect(queryClient.getQueryData(
            targetBootstrapQueryKey('identity', 'memberships')
        )).toEqual([membership('organization-a')])
        expect(queryClient.getQueryData(targetOrganizationQueryKey(
            'organization-a',
            'identity',
            'me'
        ))).toEqual(effectiveContext('organization-a'))

        unmount()
        queryClient.clear()
    })

    test('does not invent a selection or display name for multiple memberships', async () => {
        const queryClient = createTestQueryClient()
        getMemberships.mockResolvedValueOnce([
            membership('organization-a'),
            membership('organization-b'),
        ])
        getEffectiveContext.mockResolvedValueOnce(
            effectiveContext('organization-b')
        )
        const { result, unmount } = renderHook(
            () => useAuthenticatedOrganization(),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => {
            expect(result.current.requiresOrganizationSelection).toBe(true)
        })
        expect(result.current.activeOrganizationId).toBeNull()
        expect(getEffectiveContext).not.toHaveBeenCalled()
        expect(result.current.memberships[0]).not.toHaveProperty('displayName')
        expect(() => result.current.selectMembership('organization-x')).toThrow(
            'Organization selection requires an active membership.'
        )

        await act(async () => {
            await result.current.selectMembership('organization-b')
        })
        await waitFor(() => {
            expect(result.current.isReady).toBe(true)
        })
        expect(result.current.activeOrganizationId).toBe('organization-b')

        unmount()
        queryClient.clear()
    })

    test('preserves bootstrap state and removes all tenant data when switching', async () => {
        const queryClient = createTestQueryClient()
        getMemberships.mockResolvedValueOnce([
            membership('organization-a'),
            membership('organization-b'),
        ])
        getEffectiveContext
            .mockResolvedValueOnce(effectiveContext('organization-a'))
            .mockResolvedValueOnce(effectiveContext('organization-b'))
        const { result, unmount } = renderHook(
            () => useAuthenticatedOrganization(),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => {
            expect(result.current.memberships).toHaveLength(2)
        })
        await act(async () => {
            await result.current.selectMembership('organization-a')
        })
        await waitFor(() => {
            expect(result.current.isReady).toBe(true)
        })

        const bootstrapKey = targetBootstrapQueryKey('identity', 'memberships')
        const organizationAKey = targetOrganizationQueryKey(
            'organization-a',
            'clients',
            'search'
        )
        const organizationBKey = targetOrganizationQueryKey(
            'organization-b',
            'clients',
            'search'
        )
        queryClient.setQueryData(organizationAKey, ['client-a'])
        queryClient.setQueryData(organizationBKey, ['stale-client-b'])

        await act(async () => {
            await result.current.selectMembership('organization-b')
        })

        expect(queryClient.getQueryData(bootstrapKey)).toHaveLength(2)
        expect(queryClient.getQueryData(organizationAKey)).toBeUndefined()
        expect(queryClient.getQueryData(organizationBKey)).toBeUndefined()
        await waitFor(() => {
            expect(result.current.effectiveContext?.tenantId).toBe(
                'organization-b'
            )
        })

        unmount()
        queryClient.clear()
    })

    test('expires the session on an unauthorized bootstrap response', async () => {
        const queryClient = createTestQueryClient()
        getMemberships.mockRejectedValueOnce({ kind: 'unauthorized' })
        const { result, unmount } = renderHook(() => ({
            organization: useAuthenticatedOrganization(),
            session: useSession(),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.session.status).toBe('expired')
        })
        expect(result.current.organization.activeOrganizationId).toBeNull()
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
        unmount()
        queryClient.clear()
    })
})
