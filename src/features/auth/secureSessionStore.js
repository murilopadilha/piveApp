import * as SecureStore from 'expo-secure-store'

import { getOidcConfig } from '../../config/oidc'

const SESSION_KEY = 'bovina.target.oidc.session.v1'
const SESSION_VERSION = 1

const isStoredSession = (value, config) => (
    value?.version === SESSION_VERSION &&
    value?.issuer === config.issuer &&
    value?.clientId === config.clientId &&
    typeof value?.refreshToken === 'string' &&
    Boolean(value.refreshToken)
)

export const createSecureSessionStore = ({
    secureStore = SecureStore,
    getConfig = getOidcConfig,
} = {}) => ({
    async load() {
        const serialized = await secureStore.getItemAsync(SESSION_KEY)

        if (!serialized) {
            return null
        }

        try {
            const stored = JSON.parse(serialized)
            const config = getConfig()

            if (!isStoredSession(stored, config)) {
                await secureStore.deleteItemAsync(SESSION_KEY)
                return null
            }

            return {
                refreshToken: stored.refreshToken,
            }
        } catch {
            await secureStore.deleteItemAsync(SESSION_KEY)
            return null
        }
    },

    async save({ refreshToken }) {
        if (typeof refreshToken !== 'string' || !refreshToken) {
            throw new TypeError('refreshToken must be a non-empty string.')
        }

        const config = getConfig()
        await secureStore.setItemAsync(SESSION_KEY, JSON.stringify({
            version: SESSION_VERSION,
            issuer: config.issuer,
            clientId: config.clientId,
            refreshToken,
        }), {
            keychainAccessible: secureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        })
    },

    clear() {
        return secureStore.deleteItemAsync(SESSION_KEY)
    },
})

export const secureSessionStore = createSecureSessionStore()
