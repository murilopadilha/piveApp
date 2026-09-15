import React from 'react'
import { Pressable, Text, View } from 'react-native'
import {
    act,
    fireEvent,
    render,
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
})
