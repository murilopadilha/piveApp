import { createSecureSessionStore } from '../secureSessionStore'

const config = {
    issuer: 'http://localhost:8180/realms/bovina',
    clientId: 'bovina-mobile',
}

const createStoreHarness = (storedValue = null) => {
    const secureStore = {
        AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
        getItemAsync: jest.fn(async () => storedValue),
        setItemAsync: jest.fn(async () => undefined),
        deleteItemAsync: jest.fn(async () => undefined),
    }

    return {
        secureStore,
        store: createSecureSessionStore({
            secureStore,
            getConfig: () => config,
        }),
    }
}

describe('secure OIDC session storage', () => {
    test('persists refresh material without an access token', async () => {
        const { secureStore, store } = createStoreHarness()

        await store.save({
            refreshToken: 'refresh-token',
            idToken: 'id-token',
            accessToken: 'must-not-be-stored',
        })

        const serialized = secureStore.setItemAsync.mock.calls[0][1]
        const stored = JSON.parse(serialized)

        expect(stored).toEqual({
            version: 1,
            issuer: config.issuer,
            clientId: config.clientId,
            refreshToken: 'refresh-token',
        })
        expect(serialized).not.toContain('must-not-be-stored')
        expect(serialized).not.toContain('id-token')
        expect(secureStore.setItemAsync).toHaveBeenCalledWith(
            'bovina.target.oidc.session.v1',
            expect.any(String),
            { keychainAccessible: 'device-only' }
        )
    })

    test('restores only a session bound to the current issuer and client', async () => {
        const { store } = createStoreHarness(JSON.stringify({
            version: 1,
            issuer: config.issuer,
            clientId: config.clientId,
            refreshToken: 'refresh-token',
            idToken: 'id-token',
        }))

        await expect(store.load()).resolves.toEqual({
            refreshToken: 'refresh-token',
        })
    })

    test('deletes incompatible or corrupt stored sessions', async () => {
        const { secureStore, store } = createStoreHarness('{invalid')

        await expect(store.load()).resolves.toBeNull()
        expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
            'bovina.target.oidc.session.v1'
        )
    })
})
