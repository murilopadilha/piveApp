import React from 'react'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { shareKnownDocumentVersion } from '../documentSharing'

export const useDocumentVersionSharing = ({
    organizationId,
    documentId,
    refreshMetadata,
}) => {
    const [busyVersionId, setBusyVersionId] = React.useState(null)
    const [error, setError] = React.useState(null)
    const organizationIdRef = React.useRef(organizationId)
    const operationRef = React.useRef(null)
    const mountedRef = React.useRef(true)
    organizationIdRef.current = organizationId

    React.useEffect(() => () => {
        mountedRef.current = false
        operationRef.current?.controller.abort()
    }, [])

    React.useEffect(() => {
        const operation = operationRef.current

        if (operation && operation.organizationId !== organizationId) {
            operation.controller.abort()
        }
    }, [organizationId])

    const openOrShare = React.useCallback(async (version) => {
        if (operationRef.current || !organizationId || !documentId) {
            return false
        }

        const controller = new AbortController()
        const operation = {
            controller,
            organizationId,
            versionId: version?.id ?? null,
        }
        operationRef.current = operation
        setBusyVersionId(operation.versionId)
        setError(null)

        try {
            await shareKnownDocumentVersion({
                organizationId,
                documentId,
                version,
                signal: controller.signal,
                getOrganizationId: () => organizationIdRef.current,
            })
            return true
        } catch (nextError) {
            const changedOrganization = (
                organizationIdRef.current !== operation.organizationId
            )
            const canceled = nextError?.kind === TARGET_ERROR_KINDS.CANCELED

            if (mountedRef.current) {
                if (changedOrganization) {
                    setError({ code: 'DOCUMENT_ORGANIZATION_CHANGED' })
                } else if (!canceled) {
                    setError(nextError)
                }
            }
            if (
                nextError?.code === 'DOCUMENT_NOT_FOUND' ||
                nextError?.code === 'DOCUMENT_BINARY_SIZE_MISMATCH'
            ) {
                try {
                    await refreshMetadata?.()
                } catch {
                    // The original binary failure remains the user-facing result.
                }
            }
            return false
        } finally {
            if (operationRef.current === operation) {
                operationRef.current = null
                if (mountedRef.current) {
                    setBusyVersionId(null)
                }
            }
        }
    }, [documentId, organizationId, refreshMetadata])

    return {
        busyVersionId,
        error,
        isBusy: busyVersionId != null,
        openOrShare,
        clearError: () => setError(null),
    }
}
