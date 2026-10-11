import React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { setTargetOrganizationId } from '../../api/target/requestContext'
import { useSession } from '../auth/SessionContext'
import {
    clearTargetOrganizationServerState,
} from '../../serverState/targetQueryClient'

const OrganizationContext = React.createContext(null)

const requireOrganizationId = (organizationId) => {
    if (typeof organizationId !== 'string' || !organizationId.trim()) {
        throw new TypeError('organizationId must be a non-empty stable ID string.')
    }

    return organizationId.trim()
}

export function OrganizationProvider({ children }) {
    const queryClient = useQueryClient()
    const session = useSession()
    const [activeOrganizationId, setActiveOrganizationId] = React.useState(null)
    const contextChangeIdRef = React.useRef(0)
    const hasAuthenticatedSessionRef = React.useRef(Boolean(session.accessToken))
    hasAuthenticatedSessionRef.current = Boolean(session.accessToken)

    React.useEffect(() => {
        if (session.accessToken) {
            return
        }

        contextChangeIdRef.current += 1
        setTargetOrganizationId(null)
        setActiveOrganizationId(null)
    }, [session.accessToken])

    const selectOrganization = React.useCallback(async (organizationIdValue) => {
        if (!hasAuthenticatedSessionRef.current) {
            return false
        }

        const organizationId = requireOrganizationId(organizationIdValue)

        if (organizationId === activeOrganizationId) {
            session.markOrganizationReady()
            return true
        }

        const contextChangeId = ++contextChangeIdRef.current
        await clearTargetOrganizationServerState(queryClient)

        if (contextChangeId !== contextChangeIdRef.current) {
            return false
        }

        setTargetOrganizationId(organizationId)
        setActiveOrganizationId(organizationId)
        session.markOrganizationReady()
        return true
    }, [activeOrganizationId, queryClient, session])

    const clearOrganization = React.useCallback(async () => {
        const contextChangeId = ++contextChangeIdRef.current
        await clearTargetOrganizationServerState(queryClient)

        if (contextChangeId !== contextChangeIdRef.current) {
            return
        }

        setTargetOrganizationId(null)
        setActiveOrganizationId(null)
        session.markOrganizationMissing()
    }, [queryClient, session])

    const value = React.useMemo(() => ({
        activeOrganizationId,
        selectOrganization,
        clearOrganization,
    }), [activeOrganizationId, clearOrganization, selectOrganization])

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    )
}

export const useOrganization = () => {
    const context = React.useContext(OrganizationContext)

    if (!context) {
        throw new Error('useOrganization must be used within OrganizationProvider.')
    }

    return context
}
