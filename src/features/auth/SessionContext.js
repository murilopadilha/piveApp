import React from 'react'

import { setTargetAccessToken } from '../../api/target/requestContext'

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

export function SessionProvider({ children, restoreSession }) {
    const [session, setSession] = React.useState({
        status: SESSION_STATUS.RESTORING,
        accessToken: null,
    })

    React.useEffect(() => {
        let isActive = true

        const restore = async () => {
            if (!restoreSession) {
                setTargetAccessToken(null)
                setSession(expiredSession)
                return
            }

            try {
                const restoredSession = await restoreSession()

                if (!isActive) {
                    return
                }

                if (!restoredSession?.accessToken) {
                    setTargetAccessToken(null)
                    setSession(expiredSession)
                    return
                }

                const accessToken = requireAccessToken(restoredSession.accessToken)
                setTargetAccessToken(accessToken)
                setSession({
                    status: SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION,
                    accessToken,
                })
            } catch {
                if (isActive) {
                    setTargetAccessToken(null)
                    setSession(expiredSession)
                }
            }
        }

        restore()

        return () => {
            isActive = false
        }
    }, [restoreSession])

    const establishSession = React.useCallback((accessTokenValue) => {
        const accessToken = requireAccessToken(accessTokenValue)
        setTargetAccessToken(accessToken)
        setSession({
            status: SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION,
            accessToken,
        })
    }, [])

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
        setTargetAccessToken(null)
        setSession(expiredSession)
    }, [])

    const value = React.useMemo(() => ({
        ...session,
        establishSession,
        markOrganizationReady,
        markOrganizationMissing,
        expireSession,
    }), [
        establishSession,
        expireSession,
        markOrganizationMissing,
        markOrganizationReady,
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
