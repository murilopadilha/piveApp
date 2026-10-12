import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { targetOrganizationQueryKey } from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    closeRecipientCycle,
    openRecipientCycle,
} from '../api/transferApi'

const STALE_CODES = new Set([
    'STALE_RECIPIENT_CYCLE_VERSION',
    'CONCURRENT_WRITE_CONFLICT',
    'CONSTRAINT_CONFLICT',
])

export const isAmbiguousRecipientCycleError = error => (
    error?.kind === TARGET_ERROR_KINDS.NETWORK ||
    error?.kind === TARGET_ERROR_KINDS.TIMEOUT
)

export const isStaleRecipientCycleError = error => STALE_CODES.has(error?.code)

const useCommandMutation = ({ mutationFn, onSuccess, onStale }) => {
    const { expireSession } = useSession()

    return useMutation({
        mutationFn,
        retry: false,
        onSuccess,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }
            if (isStaleRecipientCycleError(error)) {
                onStale?.()
            }
        },
    })
}

export const useOpenRecipientCycleMutation = ({ organizationId }) => {
    const queryClient = useQueryClient()

    return useCommandMutation({
        mutationFn: openRecipientCycle,
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: targetOrganizationQueryKey(
                organizationId,
                'recipientCycles',
                'search'
            ),
        }),
    })
}

export const useCloseRecipientCycleMutation = ({
    organizationId,
    recipientCycleId,
}) => {
    const queryClient = useQueryClient()
    const invalidateCycle = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'recipientCycles',
                    'search'
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'recipientCycles',
                    'detail',
                    recipientCycleId
                ),
            }),
        ])
    }, [organizationId, queryClient, recipientCycleId])

    return useCommandMutation({
        mutationFn: closeRecipientCycle,
        onSuccess: invalidateCycle,
        onStale: invalidateCycle,
    })
}
