import React from 'react'
import { Pressable, Text, View } from 'react-native'
import {
    act,
    fireEvent,
    render,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import TargetFoundationProvider from '../TargetFoundationProvider'
import {
    SESSION_STATUS,
    useSession,
} from '../../features/auth/SessionContext'
import { useOrganization } from '../../features/organizations/OrganizationContext'
import { createTargetQueryClient } from '../../serverState/targetQueryClient'
import {
    targetBootstrapQueryKey,
    targetOrganizationQueryKey,
} from '../../serverState/targetQueryKeys'
import {
    getTargetRuntimeContext,
    resetTargetRuntimeContext,
} from '../../api/target/requestContext'

function FoundationProbe() {
    const session = useSession()
    const organization = useOrganization()

    return (
        <View>
            <Text testID="session-status">{session.status}</Text>
            <Text testID="organization-id">
                {organization.activeOrganizationId ?? 'none'}
            </Text>
            <Pressable
                testID="select-a"
                onPress={() => organization.selectOrganization('organization-a')}
            />
            <Pressable
                testID="select-b"
                onPress={() => organization.selectOrganization('organization-b')}
            />
            <Pressable testID="sign-in" onPress={session.signIn} />
            <Pressable testID="logout" onPress={session.logout} />
            <Pressable testID="expire" onPress={session.expireSession} />
        </View>
    )
}

afterEach(() => {
    resetTargetRuntimeContext()
})

describe('TargetFoundationProvider', () => {
    test('moves from restoring to expired without fake credentials', async () => {
        const queryClient = createTargetQueryClient()
        const screen = render(
            <TargetFoundationProvider queryClient={queryClient}>
                <FoundationProbe />
            </TargetFoundationProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('session-status').props.children).toBe(
                SESSION_STATUS.EXPIRED
            )
        })
        expect(getTargetRuntimeContext()).toEqual({
            accessToken: null,
            organizationId: null,
        })
    })

    test('restores auth without selecting an Organization implicitly', async () => {
        const queryClient = createTargetQueryClient()
        const screen = render(
            <TargetFoundationProvider
                queryClient={queryClient}
                restoreSession={() => Promise.resolve({ accessToken: 'token' })}
            >
                <FoundationProbe />
            </TargetFoundationProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('session-status').props.children).toBe(
                SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
            )
        })
        expect(screen.getByTestId('organization-id').props.children).toBe('none')
    })

    test('clears tenant state but preserves bootstrap state when switching Organizations', async () => {
        const queryClient = createTargetQueryClient()
        const screen = render(
            <TargetFoundationProvider
                queryClient={queryClient}
                restoreSession={() => Promise.resolve({ accessToken: 'token' })}
            >
                <FoundationProbe />
            </TargetFoundationProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('session-status').props.children).toBe(
                SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
            )
        })

        await act(async () => {
            fireEvent.press(screen.getByTestId('select-a'))
        })

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
        queryClient.setQueryData(organizationBKey, ['stale-client-b'])

        await act(async () => {
            fireEvent.press(screen.getByTestId('select-b'))
        })

        expect(queryClient.getQueryData(bootstrapKey)).toEqual({ id: 'user-1' })
        expect(queryClient.getQueryData(organizationAKey)).toBeUndefined()
        expect(queryClient.getQueryData(organizationBKey)).toBeUndefined()
        expect(screen.getByTestId('organization-id').props.children).toBe(
            'organization-b'
        )
        expect(screen.getByTestId('session-status').props.children).toBe(
            SESSION_STATUS.AUTHENTICATED_READY
        )
        expect(getTargetRuntimeContext()).toEqual({
            accessToken: 'token',
            organizationId: 'organization-b',
        })

        queryClient.clear()
    })

    test('expires the session and clears Organization state', async () => {
        const queryClient = createTargetQueryClient()
        const screen = render(
            <TargetFoundationProvider
                queryClient={queryClient}
                restoreSession={() => Promise.resolve({ accessToken: 'token' })}
            >
                <FoundationProbe />
            </TargetFoundationProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('session-status').props.children).toBe(
                SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
            )
        })

        await act(async () => {
            fireEvent.press(screen.getByTestId('select-a'))
        })

        queryClient.setQueryData(
            targetBootstrapQueryKey('session', 'me'),
            { id: 'user-1' }
        )
        queryClient.setQueryData(
            targetOrganizationQueryKey('organization-a', 'clients'),
            ['client-a']
        )
        fireEvent.press(screen.getByTestId('expire'))

        await waitFor(() => {
            expect(screen.getByTestId('organization-id').props.children).toBe('none')
        })
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
        expect(getTargetRuntimeContext()).toEqual({
            accessToken: null,
            organizationId: null,
        })
    })

    test('clears the previous tenant before a second login can start', async () => {
        const queryClient = createTargetQueryClient()
        const authManager = {
            restoreSession: jest.fn(async () => null),
            signIn: jest.fn()
                .mockResolvedValueOnce({ accessToken: 'first-token' })
                .mockResolvedValueOnce({ accessToken: 'second-token' }),
            getValidAccessToken: jest.fn(async () => 'second-token'),
            refreshAfterUnauthorized: jest.fn(async () => 'second-token'),
            clearLocalSession: jest.fn(async () => undefined),
            logout: jest.fn(async ({ onLocalCleared }) => {
                await onLocalCleared()
                return true
            }),
        }
        const screen = render(
            <TargetFoundationProvider
                queryClient={queryClient}
                authManager={authManager}
            >
                <FoundationProbe />
            </TargetFoundationProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('session-status').props.children).toBe(
                SESSION_STATUS.EXPIRED
            )
        })
        await act(async () => {
            fireEvent.press(screen.getByTestId('sign-in'))
        })
        await act(async () => {
            fireEvent.press(screen.getByTestId('select-a'))
        })
        queryClient.setQueryData(
            targetBootstrapQueryKey('identity', 'memberships'),
            [{ organizationId: 'organization-a' }]
        )
        queryClient.setQueryData(
            targetOrganizationQueryKey('organization-a', 'clients'),
            ['client-a']
        )

        await act(async () => {
            fireEvent.press(screen.getByTestId('logout'))
        })

        expect(screen.getByTestId('session-status').props.children).toBe(
            SESSION_STATUS.EXPIRED
        )
        expect(screen.getByTestId('organization-id').props.children).toBe('none')
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)

        await act(async () => {
            fireEvent.press(screen.getByTestId('sign-in'))
        })

        expect(screen.getByTestId('session-status').props.children).toBe(
            SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
        )
        expect(getTargetRuntimeContext()).toEqual({
            accessToken: 'second-token',
            organizationId: null,
        })
    })

    test('uses current authentication state from a previously rendered selection callback', async () => {
        const queryClient = createTargetQueryClient()
        const authManager = {
            restoreSession: jest.fn(async () => null),
            signIn: jest.fn(async () => ({ accessToken: 'access-token' })),
            getValidAccessToken: jest.fn(async () => 'access-token'),
            refreshAfterUnauthorized: jest.fn(async () => 'access-token'),
            clearLocalSession: jest.fn(async () => undefined),
            logout: jest.fn(async () => true),
        }
        const wrapper = ({ children }) => (
            <TargetFoundationProvider
                queryClient={queryClient}
                authManager={authManager}
            >
                {children}
            </TargetFoundationProvider>
        )
        const { result } = renderHook(() => ({
            organization: useOrganization(),
            session: useSession(),
        }), { wrapper })

        await waitFor(() => {
            expect(result.current.session.status).toBe(SESSION_STATUS.EXPIRED)
        })
        const selectFromExpiredRender = (
            result.current.organization.selectOrganization
        )

        await act(async () => {
            await result.current.session.signIn()
        })
        await act(async () => {
            await selectFromExpiredRender('organization-a')
        })

        expect(result.current.organization.activeOrganizationId).toBe(
            'organization-a'
        )
        expect(result.current.session.status).toBe(
            SESSION_STATUS.AUTHENTICATED_READY
        )

        queryClient.clear()
    })

    test('ignores a stale Organization selection after authentication ends', async () => {
        const queryClient = createTargetQueryClient()
        const { result } = renderHook(() => useOrganization(), {
            wrapper: ({ children }) => (
                <TargetFoundationProvider queryClient={queryClient}>
                    {children}
                </TargetFoundationProvider>
            ),
        })

        await expect(
            result.current.selectOrganization('organization-a')
        ).resolves.toBe(false)
        expect(result.current.activeOrganizationId).toBeNull()
        expect(getTargetRuntimeContext().organizationId).toBeNull()

        queryClient.clear()
    })
})
