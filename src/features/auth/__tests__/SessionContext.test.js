import React from 'react'
import {
    act,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import {
    SESSION_STATUS,
    SessionProvider,
    useSession,
} from '../SessionContext'
import { resetTargetAuthRuntime } from '../../../api/target/authRuntime'
import {
    getTargetRuntimeContext,
    resetTargetRuntimeContext,
} from '../../../api/target/requestContext'

const createManager = () => ({
    restoreSession: jest.fn(async () => null),
    signIn: jest.fn(async () => ({ accessToken: 'access-token' })),
    getValidAccessToken: jest.fn(async () => 'access-token'),
    refreshAfterUnauthorized: jest.fn(async () => 'refreshed-token'),
    clearLocalSession: jest.fn(async () => undefined),
    logout: jest.fn(async ({ onLocalCleared } = {}) => {
        await onLocalCleared?.()
        return false
    }),
})

const createWrapper = authManager => function Wrapper({ children }) {
    return (
        <SessionProvider authManager={authManager}>
            {children}
        </SessionProvider>
    )
}

afterEach(() => {
    resetTargetAuthRuntime()
    resetTargetRuntimeContext()
})

describe('SessionContext OIDC lifecycle', () => {
    test('restores to sign-in without exposing an authenticated state', async () => {
        const authManager = createManager()
        const { result } = renderHook(useSession, {
            wrapper: createWrapper(authManager),
        })

        expect(result.current.status).toBe(SESSION_STATUS.RESTORING)
        await waitFor(() => {
            expect(result.current.status).toBe(SESSION_STATUS.EXPIRED)
        })
        expect(getTargetRuntimeContext().accessToken).toBeNull()
    })

    test('establishes the real manager session and performs local-first logout', async () => {
        const authManager = createManager()
        const { result } = renderHook(useSession, {
            wrapper: createWrapper(authManager),
        })
        await waitFor(() => {
            expect(result.current.status).toBe(SESSION_STATUS.EXPIRED)
        })

        await act(async () => {
            await result.current.signIn()
        })
        expect(result.current.status).toBe(
            SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
        )
        expect(getTargetRuntimeContext().accessToken).toBe('access-token')

        await act(async () => {
            await result.current.logout()
        })
        expect(result.current.status).toBe(SESSION_STATUS.EXPIRED)
        expect(getTargetRuntimeContext().accessToken).toBeNull()
        expect(authManager.logout).toHaveBeenCalledTimes(1)
    })

    test('does not expose sign-in until logout server state cleanup finishes', async () => {
        let finishServerStateCleanup
        const authManager = createManager()
        authManager.restoreSession.mockResolvedValue({
            accessToken: 'access-token',
        })
        const clearSessionServerState = jest.fn(() => new Promise((resolve) => {
            finishServerStateCleanup = resolve
        }))
        const wrapper = ({ children }) => (
            <SessionProvider
                authManager={authManager}
                clearSessionServerState={clearSessionServerState}
            >
                {children}
            </SessionProvider>
        )
        const { result } = renderHook(useSession, { wrapper })

        await waitFor(() => {
            expect(result.current.status).toBe(
                SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
            )
        })

        let logoutPromise
        act(() => {
            logoutPromise = result.current.logout()
        })
        expect(result.current.status).toBe(SESSION_STATUS.RESTORING)

        await act(async () => {
            finishServerStateCleanup()
            await logoutPromise
        })

        expect(result.current.status).toBe(SESSION_STATUS.EXPIRED)
        expect(clearSessionServerState).toHaveBeenCalledTimes(1)
    })

    test('coalesces repeated expiration notifications', async () => {
        const authManager = createManager()
        authManager.restoreSession.mockResolvedValue({
            accessToken: 'access-token',
        })
        const { result } = renderHook(useSession, {
            wrapper: createWrapper(authManager),
        })
        await waitFor(() => {
            expect(result.current.status).toBe(
                SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
            )
        })

        await act(async () => {
            await Promise.all([
                result.current.expireSession(),
                result.current.expireSession(),
            ])
        })

        expect(authManager.clearLocalSession).toHaveBeenCalledTimes(1)
        expect(result.current.status).toBe(SESSION_STATUS.EXPIRED)
    })

    test('supports a second login after coordinated logout cleanup', async () => {
        const authManager = createManager()
        authManager.signIn
            .mockResolvedValueOnce({ accessToken: 'first-access' })
            .mockResolvedValueOnce({ accessToken: 'second-access' })
        const clearSessionServerState = jest.fn(async () => undefined)
        const wrapper = ({ children }) => (
            <SessionProvider
                authManager={authManager}
                clearSessionServerState={clearSessionServerState}
            >
                {children}
            </SessionProvider>
        )
        const { result } = renderHook(useSession, { wrapper })

        await waitFor(() => {
            expect(result.current.status).toBe(SESSION_STATUS.EXPIRED)
        })
        await act(async () => {
            await result.current.signIn()
            await result.current.logout()
            await result.current.signIn()
        })

        expect(result.current.status).toBe(
            SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
        )
        expect(result.current.accessToken).toBe('second-access')
        expect(getTargetRuntimeContext().accessToken).toBe('second-access')
        expect(authManager.signIn).toHaveBeenCalledTimes(2)
        expect(clearSessionServerState).toHaveBeenCalledTimes(1)
    })

    test('supports a new login after session expiration cleanup', async () => {
        const authManager = createManager()
        authManager.restoreSession.mockResolvedValue({
            accessToken: 'first-access',
        })
        authManager.signIn.mockResolvedValue({
            accessToken: 'access-after-expiration',
        })
        const clearSessionServerState = jest.fn(async () => undefined)
        const wrapper = ({ children }) => (
            <SessionProvider
                authManager={authManager}
                clearSessionServerState={clearSessionServerState}
            >
                {children}
            </SessionProvider>
        )
        const { result } = renderHook(useSession, { wrapper })

        await waitFor(() => {
            expect(result.current.status).toBe(
                SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
            )
        })
        await act(async () => {
            await result.current.expireSession()
            await result.current.signIn()
        })

        expect(result.current.status).toBe(
            SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION
        )
        expect(result.current.accessToken).toBe('access-after-expiration')
        expect(authManager.clearLocalSession).toHaveBeenCalledTimes(1)
        expect(clearSessionServerState).toHaveBeenCalledTimes(1)
    })
})
