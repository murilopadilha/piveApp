import React from 'react'

import {
    SESSION_STATUS,
    useSession,
} from '../../auth/SessionContext'
import {
    useEffectiveContextQuery,
    useMembershipsQuery,
} from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../OrganizationContext'

const isAuthenticated = status => (
    status === SESSION_STATUS.AUTHENTICATED_WITHOUT_ORGANIZATION ||
    status === SESSION_STATUS.AUTHENTICATED_READY
)

export default function useAuthenticatedOrganization() {
    const session = useSession()
    const organization = useOrganization()
    const autoSelectionIdRef = React.useRef(null)
    const membershipsQuery = useMembershipsQuery({
        enabled: Boolean(session.accessToken) && isAuthenticated(session.status),
    })
    const memberships = membershipsQuery.data ?? []

    const selectMembership = React.useCallback((organizationId) => {
        const membership = memberships.find(
            item => item.organizationId === organizationId
        )

        if (!membership) {
            throw new Error('Organization selection requires an active membership.')
        }

        return organization.selectOrganization(membership.organizationId)
    }, [memberships, organization])

    React.useEffect(() => {
        if (!membershipsQuery.isSuccess) {
            return
        }

        const activeOrganizationIsAuthorized = memberships.some(
            membership => (
                membership.organizationId === organization.activeOrganizationId
            )
        )

        if (
            organization.activeOrganizationId &&
            !activeOrganizationIsAuthorized
        ) {
            autoSelectionIdRef.current = null
            void organization.clearOrganization()
            return
        }

        if (organization.activeOrganizationId) {
            autoSelectionIdRef.current = null
            return
        }

        if (
            memberships.length === 1 &&
            autoSelectionIdRef.current !== memberships[0].organizationId
        ) {
            autoSelectionIdRef.current = memberships[0].organizationId
            void selectMembership(memberships[0].organizationId)
        }
    }, [
        memberships,
        membershipsQuery.isSuccess,
        organization,
        selectMembership,
    ])

    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: organization.activeOrganizationId,
        enabled: session.status === SESSION_STATUS.AUTHENTICATED_READY,
    })

    return {
        activeOrganizationId: organization.activeOrganizationId,
        memberships,
        membershipsQuery,
        effectiveContext: effectiveContextQuery.data ?? null,
        effectiveContextQuery,
        requiresOrganizationSelection: memberships.length > 1 &&
            !organization.activeOrganizationId,
        hasNoMemberships: membershipsQuery.isSuccess && memberships.length === 0,
        isReady: session.status === SESSION_STATUS.AUTHENTICATED_READY &&
            effectiveContextQuery.isSuccess,
        selectMembership,
    }
}
