import React from 'react'

import { useSession } from '../../auth/SessionContext'
import { useOrganization } from '../../organizations/OrganizationContext'
import { cleanupDocumentTemporaryFiles } from '../documentBinary'

export default function DocumentTemporaryFilesLifecycle() {
    const session = useSession()
    const { activeOrganizationId } = useOrganization()
    const hasAuthenticatedSession = Boolean(session.accessToken)

    React.useEffect(() => {
        void cleanupDocumentTemporaryFiles()
    }, [activeOrganizationId, hasAuthenticatedSession])

    return null
}
