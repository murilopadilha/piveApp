import React from 'react'

import { setTargetAccessToken } from '../../api/target/requestContext'
import { configureTargetAuthRuntime } from '../../api/target/authRuntime'
import { getDefaultAuthSessionManager } from './sessionManager'

export const SESSION_STATUS = Object.freeze({
    RESTORING: 'restoring',
    AUTHENTICATED_WITHOUT_ORGANIZATION: 'authenticatedWithoutOrganization',
    AUTHENTICATED_READY: 'authenticatedReady',
    EXPIRED: 'expired',
})

const SessionContext = React.createContext(null)

const expiredSession = Object.freeze({
    status: SESSION_STATUS.EXPIRED,
    accessToken: null,
})

const requireAccessToken = (accessToken) => {
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
        throw new TypeError('accessToken must be a non-empty string.')
    }

    return accessToken.trim()
}

export function SessionProvider({
    children,
    restoreSession,
    authManager,
    clearSessionServerState = async () => undefined,
}) {
    const [session, setSession] = React.useState({
        status: SESSION_STATUS.RESTORING,
        accessToken: null,
    })
    const [isAuthenticating, setIsAuthenticating] = React.useState(false)
    const [authError, setAuthError] = React.useState(null)
    const managerRef = React.useRef(authManager ?? null)
    const signInPromiseRef = React.useRef(null)
    const expirationPromiseRef = React.useRef(null)
    const logoutPromiseRef = React.useRef(null)
    const isExpiredRef = React.useRef(false)

    const getManager = React.useCallback(() => {
        if (!managerRef.current) {
            managerRef.current = getDefaultAuthSessionManager()
        }

        return managerRef.current
    }, [])

    const updateAccessToken = React.useCallback((accessTokenValue) => {
        const accessToken = requireAccessToken(accessTokenValue)
        isExpiredRef.current = false
        setTargetAccessToken(accessToken)
        setSession(currentSession => ({
            status: currentSession.status === SESSION_STATUS.AUTHENTICATED_READY
                ? SESSION_STATUS.AUTHENTICATED_READY
                : SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION,
            accessToken,
        }))
        return accessToken
    }, [])

    React.useEffect(() => {
        let isActive = true

        const restore = async () => {
            try {
                const restoredSession = restoreSession
                    ? await restoreSession()
                    : await getManager().restoreSession()

                if (!isActive) {
                    return
                }

                if (!restoredSession?.accessToken) {
                    isExpiredRef.current = true
                    setTargetAccessToken(null)
                    setSession(expiredSession)
                    return
                }

                updateAccessToken(restoredSession.accessToken)
            } catch {
                if (isActive) {
                    isExpiredRef.current = true
                    setTargetAccessToken(null)
                    setSession(expiredSession)
                }
            }
        }

        restore()

        return () => {
            isActive = false
        }
    }, [getManager, restoreSession, updateAccessToken])

    const establishSession = React.useCallback((accessTokenValue) => {
        updateAccessToken(accessTokenValue)
    }, [updateAccessToken])

    const markOrganizationReady = React.useCallback(() => {
        setSession(currentSession => (
            currentSession.accessToken
                ? {
                    ...currentSession,
                    status: SESSION_STATUS.AUTHENTICATED_READY,
                }
                : expiredSession
        ))
    }, [])

    const markOrganizationMissing = React.useCallback(() => {
        setSession(currentSession => (
            currentSession.accessToken
                ? {
                    ...currentSession,
                    status: SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION,
                }
                : expiredSession
        ))
    }, [])

    const expireSession = React.useCallback(() => {
        if (expirationPromiseRef.current) {
            return expirationPromiseRef.current
        }

        if (isExpiredRef.current) {
            return Promise.resolve(true)
        }

        isExpiredRef.current = true
        setTargetAccessToken(null)
        setSession({
            status: SESSION_STATUS.RESTORING,
            accessToken: null,
        })
        setAuthError(null)

        const clearLocalSession = managerRef.current
            ? () => managerRef.current.clearLocalSession()
            : restoreSession
                ? async () => undefined
                : () => getManager().clearLocalSession()

        expirationPromiseRef.current = (async () => {
            let cleanupSucceeded = true

            try {
                await clearLocalSession()
            } catch {
                cleanupSucceeded = false
            }

            try {
                await clearSessionServerState()
            } catch {
                cleanupSucceeded = false
            }

            return cleanupSucceeded
        })()
            .finally(() => {
                setSession(expiredSession)
                expirationPromiseRef.current = null
            })

        return expirationPromiseRef.current
    }, [clearSessionServerState, getManager, restoreSession])

    const signIn = React.useCallback(() => {
        if (signInPromiseRef.current) {
            return signInPromiseRef.current
        }

        setIsAuthenticating(true)
        setAuthError(null)

        signInPromiseRef.current = (async () => {
            try {
                const authenticated = await getManager().signIn()

                if (!authenticated?.accessToken) {
                    return false
                }

                updateAccessToken(authenticated.accessToken)
                return true
            } catch {
                setAuthError('Não foi possível entrar. Verifique a conexão e tente novamente.')
                return false
            } finally {
                setIsAuthenticating(false)
                signInPromiseRef.current = null
            }
        })()

        return signInPromiseRef.current
    }, [getManager, updateAccessToken])

    const logout = React.useCallback(() => {
        if (logoutPromiseRef.current) {
            return logoutPromiseRef.current
        }

        isExpiredRef.current = true
        setTargetAccessToken(null)
        setSession({
            status: SESSION_STATUS.RESTORING,
            accessToken: null,
        })
        setAuthError(null)

        let serverStateCleanupFinished = false
        const clearAfterLocalCredentials = async () => {
            try {
                await clearSessionServerState()
            } finally {
                serverStateCleanupFinished = true
            }
        }

        logoutPromiseRef.current = (async () => {
            let remoteLogoutSucceeded = false

            try {
                remoteLogoutSucceeded = await getManager().logout({
                    onLocalCleared: clearAfterLocalCredentials,
                })
            } catch {
                remoteLogoutSucceeded = false
            } finally {
                if (!serverStateCleanupFinished) {
                    try {
                        await clearAfterLocalCredentials()
                    } catch {
                        serverStateCleanupFinished = true
                    }
                }
                setSession(expiredSession)
                logoutPromiseRef.current = null
            }

            return remoteLogoutSucceeded
        })()

        return logoutPromiseRef.current
    }, [clearSessionServerState, getManager])

    React.useEffect(() => configureTargetAuthRuntime({
        getValidAccessToken: async () => {
            try {
                const accessToken = await getManager().getValidAccessToken()
                return updateAccessToken(accessToken)
            } catch (error) {
                await expireSession()
                throw error
            }
        },
        recoverUnauthorized: async () => {
            const accessToken = await getManager().refreshAfterUnauthorized()
            return updateAccessToken(accessToken)
        },
        onSessionExpired: expireSession,
    }), [expireSession, getManager, updateAccessToken])

    const value = React.useMemo(() => ({
        ...session,
        authError,
        isAuthenticating,
        establishSession,
        signIn,
        logout,
        markOrganizationReady,
        markOrganizationMissing,
        expireSession,
    }), [
        establishSession,
        authError,
        expireSession,
        isAuthenticating,
        logout,
        markOrganizationMissing,
        markOrganizationReady,
        signIn,
        session,
    ])

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    )
}

export const useSession = () => {
    const context = React.useContext(SessionContext)

    if (!context) {
        throw new Error('useSession must be used within SessionProvider.')
    }

    return context
}
