import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { targetOrganizationQueryKey } from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    invalidatePregnancyCheck,
    recordPregnancyCheck,
} from '../api/transferApi'
import {
    pregnancyChecksQueryKey,
    pregnancyOutcomeQueryKey,
} from './useTransferQueries'

const CONFLICT_CODES = new Set([
    'DUPLICATE_SUPERSEDED_CHECK',
    'CHECK_CORRECTION_TRANSFER_MISMATCH',
    'PREGNANCY_CHECK_ALREADY_INVALIDATED',
    'CONCURRENT_WRITE_CONFLICT',
    'CONSTRAINT_CONFLICT',
])

export const isAmbiguousPregnancyCheckError = error => (
    error?.kind === TARGET_ERROR_KINDS.NETWORK ||
    error?.kind === TARGET_ERROR_KINDS.TIMEOUT
)

export const isPregnancyCheckConflict = error => CONFLICT_CODES.has(error?.code)

const usePregnancyStateInvalidation = ({ organizationId, transferId }) => {
    const queryClient = useQueryClient()

    return React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: pregnancyChecksQueryKey({ organizationId, transferId }),
            }),
            queryClient.invalidateQueries({
                queryKey: pregnancyOutcomeQueryKey({ organizationId, transferId }),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'pregnancyFollowUps'
                ),
            }),
        ])
    }, [organizationId, queryClient, transferId])
}

const usePregnancyCheckMutation = ({
    organizationId,
    transferId,
    mutationFn,
}) => {
    const { expireSession } = useSession()
    const invalidatePregnancyState = usePregnancyStateInvalidation({
        organizationId,
        transferId,
    })

    return useMutation({
        mutationFn,
        retry: false,
        onSuccess: invalidatePregnancyState,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }
            if (isPregnancyCheckConflict(error)) {
                void invalidatePregnancyState()
            }
        },
    })
}

export const useRecordPregnancyCheckMutation = options => (
    usePregnancyCheckMutation({ ...options, mutationFn: recordPregnancyCheck })
)

export const useInvalidatePregnancyCheckMutation = options => (
    usePregnancyCheckMutation({ ...options, mutationFn: invalidatePregnancyCheck })
)
