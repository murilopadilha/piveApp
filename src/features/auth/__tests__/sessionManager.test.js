import {
    SessionExpiredError,
    createAuthSessionManager,
} from '../sessionManager'

const response = ({
    accessToken = 'access-1',
    refreshToken = 'refresh-1',
    idToken = 'id-1',
    issuedAt = 100,
    expiresIn = 300,
} = {}) => ({
    accessToken,
    refreshToken,
    idToken,
    issuedAt,
    expiresIn,
})

const createHarness = ({ stored = null, now = 100000 } = {}) => {
    const oidcClient = {
        signIn: jest.fn(async () => response()),
        refresh: jest.fn(async () => response({
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            idToken: 'id-2',
        })),
        logoutRemote: jest.fn(async () => true),
    }
    const sessionStore = {
        load: jest.fn(async () => stored),
        save: jest.fn(async () => undefined),
        clear: jest.fn(async () => undefined),
    }
    const manager = createAuthSessionManager({
        oidcClient,
        sessionStore,
        now: () => now,
    })

    return { manager, oidcClient, sessionStore }
}

describe('authentication session manager', () => {
    test('keeps the access token in memory and persists only restoration material', async () => {
        const { manager, sessionStore } = createHarness()

        await expect(manager.signIn()).resolves.toEqual({
            accessToken: 'access-1',
        })
        expect(sessionStore.save).toHaveBeenCalledWith({
            refreshToken: 'refresh-1',
        })
        expect(sessionStore.save.mock.calls[0][0]).not.toHaveProperty('accessToken')
        await expect(manager.getValidAccessToken()).resolves.toBe('access-1')
    })

    test('does not persist a partial session when login is canceled', async () => {
        const { manager, oidcClient, sessionStore } = createHarness()
        oidcClient.signIn.mockResolvedValue(null)

        await expect(manager.signIn()).resolves.toBeNull()
        expect(sessionStore.save).not.toHaveBeenCalled()
        expect(sessionStore.clear).not.toHaveBeenCalled()
    })

    test('restores by refreshing and persists a rotated refresh token', async () => {
        const { manager, oidcClient, sessionStore } = createHarness({
            stored: { refreshToken: 'stored-refresh', idToken: 'stored-id' },
        })

        await expect(manager.restoreSession()).resolves.toEqual({
            accessToken: 'access-2',
        })
        expect(oidcClient.refresh).toHaveBeenCalledWith('stored-refresh')
        expect(sessionStore.save).toHaveBeenCalledWith({
            refreshToken: 'refresh-2',
        })
    })

    test('coalesces concurrent refreshes into one request', async () => {
        let resolveRefresh
        const { manager, oidcClient } = createHarness({
            stored: { refreshToken: 'stored-refresh' },
        })
        oidcClient.refresh.mockImplementation(() => new Promise((resolve) => {
            resolveRefresh = resolve
        }))

        const restore = manager.restoreSession()
        await Promise.resolve()
        const simultaneous = manager.refreshAfterUnauthorized()
        resolveRefresh(response({ accessToken: 'shared-access' }))

        await expect(Promise.all([restore, simultaneous])).resolves.toEqual([
            { accessToken: 'shared-access' },
            'shared-access',
        ])
        expect(oidcClient.refresh).toHaveBeenCalledTimes(1)
    })

    test('clears once when refresh can no longer recover the session', async () => {
        const { manager, oidcClient, sessionStore } = createHarness({
            stored: { refreshToken: 'expired-refresh' },
        })
        oidcClient.refresh.mockRejectedValue(new Error('invalid_grant'))

        const first = manager.restoreSession()
        await Promise.resolve()
        const second = manager.refreshAfterUnauthorized()

        await expect(first).rejects.toBeInstanceOf(SessionExpiredError)
        await expect(second).rejects.toBeInstanceOf(SessionExpiredError)
        expect(oidcClient.refresh).toHaveBeenCalledTimes(1)
        expect(sessionStore.clear).toHaveBeenCalledTimes(1)
    })

    test('always clears local credentials when remote logout fails', async () => {
        const { manager, oidcClient, sessionStore } = createHarness()
        await manager.signIn()
        oidcClient.logoutRemote.mockRejectedValue(new Error('offline'))

        await expect(manager.logout()).resolves.toBe(false)
        expect(sessionStore.clear).toHaveBeenCalledTimes(1)
        await expect(manager.getValidAccessToken()).rejects.toBeInstanceOf(
            SessionExpiredError
        )
    })

    test('runs coordinated cleanup after local credentials are cleared', async () => {
        const { manager, sessionStore } = createHarness()
        const onLocalCleared = jest.fn(async () => undefined)
        await manager.signIn()

        await manager.logout({ onLocalCleared })

        expect(sessionStore.clear).toHaveBeenCalledTimes(1)
        expect(onLocalCleared).toHaveBeenCalledTimes(1)
        expect(sessionStore.clear.mock.invocationCallOrder[0]).toBeLessThan(
            onLocalCleared.mock.invocationCallOrder[0]
        )
    })

    test('creates a fresh session after logout without retaining old tokens', async () => {
        const { manager, oidcClient, sessionStore } = createHarness()
        oidcClient.signIn
            .mockResolvedValueOnce(response())
            .mockResolvedValueOnce(response({
                accessToken: 'access-second',
                refreshToken: 'refresh-second',
                idToken: 'id-second',
            }))

        await manager.signIn()
        await manager.logout()
        await expect(manager.signIn()).resolves.toEqual({
            accessToken: 'access-second',
        })

        expect(oidcClient.signIn).toHaveBeenCalledTimes(2)
        expect(sessionStore.clear).toHaveBeenCalledTimes(1)
        expect(sessionStore.save).toHaveBeenLastCalledWith({
            refreshToken: 'refresh-second',
        })
        await expect(manager.getValidAccessToken()).resolves.toBe('access-second')
    })

    test('creates a fresh session after an unrecoverable refresh expiration', async () => {
        const { manager, oidcClient, sessionStore } = createHarness({
            stored: { refreshToken: 'expired-refresh' },
        })
        oidcClient.refresh.mockRejectedValueOnce(new Error('invalid_grant'))
        oidcClient.signIn.mockResolvedValueOnce(response({
            accessToken: 'access-after-expiration',
            refreshToken: 'refresh-after-expiration',
        }))

        await expect(manager.restoreSession()).rejects.toBeInstanceOf(
            SessionExpiredError
        )
        await expect(manager.signIn()).resolves.toEqual({
            accessToken: 'access-after-expiration',
        })

        expect(sessionStore.clear).toHaveBeenCalledTimes(1)
        expect(sessionStore.save).toHaveBeenLastCalledWith({
            refreshToken: 'refresh-after-expiration',
        })
        await expect(manager.getValidAccessToken()).resolves.toBe(
            'access-after-expiration'
        )
    })
})
