import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { targetOrganizationQueryKey } from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import { allocateMatings } from '../api/matingApi'

const CONCURRENCY_CODES = new Set([
    'OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT',
    'CONCURRENT_WRITE_CONFLICT',
    'CONSTRAINT_CONFLICT',
])

export const isAmbiguousMatingCommandError = error => (
    error?.kind === TARGET_ERROR_KINDS.NETWORK ||
    error?.kind === TARGET_ERROR_KINDS.TIMEOUT
)

export const isMatingConcurrencyError = error => (
    CONCURRENCY_CODES.has(error?.code)
)

export const useAllocateMatingsMutation = ({
    organizationId,
    oocyteCollectionId,
}) => {
    const queryClient = useQueryClient()
    const { expireSession } = useSession()
    const invalidateAllocationState = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'matings',
                    'list'
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'oocyteCollections',
                    'detail',
                    oocyteCollectionId
                ),
            }),
        ])
    }, [oocyteCollectionId, organizationId, queryClient])

    return useMutation({
        mutationFn: allocateMatings,
        retry: false,
        onSuccess: invalidateAllocationState,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }

            if (isMatingConcurrencyError(error)) {
                void invalidateAllocationState()
            }
        },
    })
}
