import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { targetOrganizationQueryKey } from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    identifyEmbryos,
    openEmbryoHold,
    releaseEmbryoHold,
} from '../api/embryoApi'

const CONCURRENCY_CODES = new Set([
    'EMBRYO_COUNT_EXCEEDS_ALLOCATION',
    'MATING_NOT_OPEN',
    'CONCURRENT_WRITE_CONFLICT',
    'CONSTRAINT_CONFLICT',
])

const HOLD_CONFLICT_CODES = new Set([
    'EMBRYO_HOLD_NOT_FOUND',
    'EMBRYO_HOLD_MISMATCH',
    'EMBRYO_ON_HOLD',
    'CONCURRENT_WRITE_CONFLICT',
    'CONSTRAINT_CONFLICT',
])

export const isAmbiguousEmbryoCommandError = error => (
    error?.kind === TARGET_ERROR_KINDS.NETWORK ||
    error?.kind === TARGET_ERROR_KINDS.TIMEOUT
)

export const isEmbryoConcurrencyError = error => (
    CONCURRENCY_CODES.has(error?.code)
)

export const isEmbryoHoldConflict = error => (
    HOLD_CONFLICT_CODES.has(error?.code)
)

export const useIdentifyEmbryosMutation = ({
    organizationId,
    matingId,
}) => {
    const queryClient = useQueryClient()
    const { expireSession } = useSession()
    const invalidateEmbryologyState = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'embryos'
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'matings',
                    'detail',
                    matingId
                ),
            }),
        ])
    }, [matingId, organizationId, queryClient])

    return useMutation({
        mutationFn: identifyEmbryos,
        retry: false,
        onSuccess: invalidateEmbryologyState,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }

            if (isEmbryoConcurrencyError(error)) {
                void invalidateEmbryologyState()
            }
        },
    })
}

const useEmbryoHoldMutation = ({
    organizationId,
    embryoId,
    mutationFn,
}) => {
    const queryClient = useQueryClient()
    const { expireSession } = useSession()
    const invalidateEmbryo = React.useCallback(async () => {
        await queryClient.invalidateQueries({
            queryKey: targetOrganizationQueryKey(
                organizationId,
                'embryos',
                'detail',
                embryoId
            ),
        })
    }, [embryoId, organizationId, queryClient])

    return useMutation({
        mutationFn,
        retry: false,
        onSuccess: invalidateEmbryo,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }

            if (isEmbryoHoldConflict(error)) {
                void invalidateEmbryo()
            }
        },
    })
}

export const useOpenEmbryoHoldMutation = ({ organizationId, embryoId }) => (
    useEmbryoHoldMutation({
        organizationId,
        embryoId,
        mutationFn: openEmbryoHold,
    })
)

export const useReleaseEmbryoHoldMutation = ({ organizationId, embryoId }) => (
    useEmbryoHoldMutation({
        organizationId,
        embryoId,
        mutationFn: releaseEmbryoHold,
    })
)
