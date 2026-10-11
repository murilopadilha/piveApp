import { createOidcClient } from './oidcClient'
import { secureSessionStore } from './secureSessionStore'

const ACCESS_TOKEN_MARGIN_MS = 30000

export class SessionExpiredError extends Error {
    constructor() {
        super('A sessão expirou. Entre novamente.')
        this.name = 'SessionExpiredError'
        this.code = 'SESSION_EXPIRED'
    }
}

const requireTokenResponse = (response, fallbackTokens = {}) => {
    const refreshToken = response?.refreshToken ?? fallbackTokens.refreshToken

    if (
        typeof response?.accessToken !== 'string' ||
        !response.accessToken ||
        typeof refreshToken !== 'string' ||
        !refreshToken
    ) {
        throw new SessionExpiredError()
    }

    const issuedAt = Number(response.issuedAt) || Math.floor(Date.now() / 1000)
    const expiresIn = Number(response.expiresIn) || 0

    return {
        accessToken: response.accessToken,
        refreshToken,
        idToken: response.idToken ?? fallbackTokens.idToken ?? null,
        expiresAt: (issuedAt + expiresIn) * 1000,
    }
}

export const createAuthSessionManager = ({
    oidcClient = createOidcClient(),
    sessionStore = secureSessionStore,
    now = () => Date.now(),
} = {}) => {
    let tokens = null
    let refreshPromise = null
    let revision = 0

    const persist = async (nextTokens) => {
        await sessionStore.save({
            refreshToken: nextTokens.refreshToken,
        })
    }

    const adopt = async (response, fallbackTokens, expectedRevision) => {
        const nextTokens = requireTokenResponse(response, fallbackTokens)

        if (revision !== expectedRevision) {
            throw new SessionExpiredError()
        }

        await persist(nextTokens)

        if (revision !== expectedRevision) {
            throw new SessionExpiredError()
        }

        tokens = nextTokens
        return { accessToken: nextTokens.accessToken }
    }

    const clearLocalSession = async () => {
        revision += 1
        tokens = null
        await sessionStore.clear()
    }

    const refresh = async ({ force = false } = {}) => {
        if (
            !force &&
            tokens?.accessToken &&
            now() < tokens.expiresAt - ACCESS_TOKEN_MARGIN_MS
        ) {
            return { accessToken: tokens.accessToken }
        }

        if (refreshPromise) {
            return refreshPromise
        }

        if (!tokens?.refreshToken) {
            throw new SessionExpiredError()
        }

        const expectedRevision = revision
        const refreshToken = tokens.refreshToken
        const idToken = tokens.idToken
        refreshPromise = oidcClient.refresh(refreshToken)
            .then(response => adopt(response, {
                refreshToken,
                idToken,
            }, expectedRevision))
            .catch(async (error) => {
                if (revision === expectedRevision) {
                    await clearLocalSession()
                }
                throw error instanceof SessionExpiredError
                    ? error
                    : new SessionExpiredError()
            })
            .finally(() => {
                refreshPromise = null
            })

        return refreshPromise
    }

    return {
        async signIn() {
            const response = await oidcClient.signIn()

            if (!response) {
                return null
            }

            revision += 1
            tokens = null
            return adopt(response, {}, revision)
        },

        async restoreSession() {
            const stored = await sessionStore.load()

            if (!stored) {
                return null
            }

            revision += 1
            tokens = {
                accessToken: null,
                refreshToken: stored.refreshToken,
                idToken: stored.idToken ?? null,
                expiresAt: 0,
            }

            return refresh({ force: true })
        },

        getValidAccessToken() {
            return refresh({ force: false }).then(value => value.accessToken)
        },

        refreshAfterUnauthorized() {
            return refresh({ force: true }).then(value => value.accessToken)
        },

        clearLocalSession,

        async logout({ onLocalCleared } = {}) {
            const remoteTokens = tokens
            await clearLocalSession()
            await onLocalCleared?.()

            if (!remoteTokens) {
                return true
            }

            try {
                return await oidcClient.logoutRemote(remoteTokens)
            } catch {
                return false
            }
        },
    }
}

let defaultManager = null

export const getDefaultAuthSessionManager = () => {
    if (!defaultManager) {
        defaultManager = createAuthSessionManager()
    }

    return defaultManager
}
