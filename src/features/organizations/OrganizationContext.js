import React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { setTargetOrganizationId } from '../../api/target/requestContext'
import {
    SESSION_STATUS,
    useSession,
} from '../auth/SessionContext'
import {
    clearTargetOrganizationServerState,
    clearTargetSessionServerState,
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

    React.useEffect(() => {
        if (session.status !== SESSION_STATUS.EXPIRED) {
            return
        }

        contextChangeIdRef.current += 1
        setTargetOrganizationId(null)
        setActiveOrganizationId(null)
        void clearTargetSessionServerState(queryClient)
    }, [queryClient, session.status])

    const selectOrganization = React.useCallback(async (organizationIdValue) => {
        if (!session.accessToken) {
            throw new Error('An authenticated session is required to select an Organization.')
        }

        const organizationId = requireOrganizationId(organizationIdValue)

        if (organizationId === activeOrganizationId) {
            session.markOrganizationReady()
            return
        }

        const contextChangeId = ++contextChangeIdRef.current
        await clearTargetOrganizationServerState(queryClient)

        if (contextChangeId !== contextChangeIdRef.current) {
            return
        }

        setTargetOrganizationId(organizationId)
        setActiveOrganizationId(organizationId)
        session.markOrganizationReady()
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
