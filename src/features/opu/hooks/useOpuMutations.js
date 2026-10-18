import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { targetOrganizationQueryKey } from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    correctOocyteCollection,
    dryRunOpuCollections,
    openOpuSession,
    recordOpuCollections,
    transitionOpuSession,
} from '../api/opuApi'

const STALE_CODES = new Set([
    'STALE_SESSION_VERSION',
    'STALE_COLLECTION_VERSION',
    'CONCURRENT_WRITE_CONFLICT',
])

export const isAmbiguousCommandError = error => (
    error?.kind === TARGET_ERROR_KINDS.NETWORK ||
    error?.kind === TARGET_ERROR_KINDS.TIMEOUT
)

export const isStaleCommandError = error => STALE_CODES.has(error?.code)

const useCommandMutation = ({
    mutationFn,
    onSuccess,
    onStale,
}) => {
    const { expireSession } = useSession()

    return useMutation({
        mutationFn,
        retry: false,
        onSuccess,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }

            if (isStaleCommandError(error)) {
                onStale?.()
            }
        },
    })
}

export const useOpenOpuMutation = ({ organizationId }) => {
    const queryClient = useQueryClient()

    return useCommandMutation({
        mutationFn: openOpuSession,
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: targetOrganizationQueryKey(
                organizationId,
                'opuSessions',
                'list'
            ),
        }),
    })
}

export const useOpuTransitionMutation = ({
    organizationId,
    opuSessionId,
}) => {
    const queryClient = useQueryClient()
    const invalidateSession = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'opuSessions',
                    'list'
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'opuSessions',
                    'detail',
                    opuSessionId
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'opuSessions',
                    opuSessionId
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'oocyteCollections'
                ),
            }),
        ])
    }, [organizationId, opuSessionId, queryClient])

    return useCommandMutation({
        mutationFn: transitionOpuSession,
        onSuccess: invalidateSession,
        onStale: invalidateSession,
    })
}

export const useOpuCollectionsDryRunMutation = () => useCommandMutation({
    mutationFn: dryRunOpuCollections,
})

export const useRecordOpuCollectionsMutation = ({
    organizationId,
    opuSessionId,
}) => {
    const queryClient = useQueryClient()
    const invalidateCollections = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'opuSessions',
                    'detail',
                    opuSessionId
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'opuSessions',
                    opuSessionId
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'oocyteCollections'
                ),
            }),
        ])
    }, [organizationId, opuSessionId, queryClient])

    return useCommandMutation({
        mutationFn: recordOpuCollections,
        onSuccess: invalidateCollections,
        onStale: invalidateCollections,
    })
}

export const useCorrectOocyteCollectionMutation = ({
    organizationId,
    opuSessionId,
    oocyteCollectionId,
}) => {
    const queryClient = useQueryClient()
    const invalidateCollection = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'oocyteCollections',
                    'detail',
                    oocyteCollectionId
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'opuSessions',
                    opuSessionId
                ),
            }),
        ])
    }, [
        oocyteCollectionId,
        opuSessionId,
        organizationId,
        queryClient,
    ])

    return useCommandMutation({
        mutationFn: correctOocyteCollection,
        onSuccess: invalidateCollection,
        onStale: invalidateCollection,
    })
}
