import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_TRANSFER_PAGE_SIZE,
    getPregnancyChecks,
    getPregnancyFollowUps,
    getPregnancyOutcome,
    getRecipientCycleById,
    getRecipientCycles,
    getTransferById,
    getTransfers,
} from '../api/transferApi'

const fallbackKey = targetOrganizationScopeQueryKey()

export const recipientCyclesQueryKey = ({
    organizationId,
    recipientId = null,
    status = null,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'recipientCycles',
    'search',
    { recipientId, status, size }
)

export const recipientCycleDetailQueryKey = ({
    organizationId,
    recipientCycleId,
}) => targetOrganizationQueryKey(
    organizationId,
    'recipientCycles',
    'detail',
    recipientCycleId
)

export const transfersQueryKey = ({
    organizationId,
    recipientCycleId = null,
    embryoId = null,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'transfers',
    'search',
    { recipientCycleId, embryoId, size }
)

export const transferDetailQueryKey = ({ organizationId, transferId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'transfers',
        'detail',
        transferId
    )
)

export const pregnancyChecksQueryKey = ({ organizationId, transferId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'transfers',
        transferId,
        'pregnancyChecks'
    )
)

export const pregnancyOutcomeQueryKey = ({ organizationId, transferId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'transfers',
        transferId,
        'pregnancyOutcome'
    )
)

export const pregnancyFollowUpsQueryKey = ({
    organizationId,
    cohort,
    asOf,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'pregnancyFollowUps',
    { cohort, asOf, size }
)

export const getNextTransferPageParam = lastPage => (
    lastPage.items.length < lastPage.size
        ? undefined
        : lastPage.page + 1
)

const useExpireSessionOnUnauthorized = (errors) => {
    const { expireSession } = useSession()
    const unauthorized = errors.some(
        error => error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED
    )

    React.useEffect(() => {
        if (unauthorized) {
            expireSession()
        }
    }, [expireSession, unauthorized])
}

const useTenantInfiniteQuery = ({
    organizationId,
    queryKey,
    queryFn,
    enabled,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId ? queryKey : fallbackKey,
        initialPageParam: 0,
        queryFn,
        getNextPageParam: getNextTransferPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useRecipientCyclesQuery = ({
    organizationId,
    recipientId = null,
    status = null,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId ? recipientCyclesQueryKey({
        organizationId, recipientId, status, size,
    }) : fallbackKey,
    queryFn: ({ pageParam, signal }) => getRecipientCycles({
        recipientId,
        status,
        page: pageParam,
        size,
        signal,
    }),
    enabled,
})

export const useRecipientCycleDetailQuery = ({
    organizationId,
    recipientCycleId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && recipientCycleId
            ? recipientCycleDetailQueryKey({ organizationId, recipientCycleId })
            : fallbackKey,
        queryFn: ({ signal }) => getRecipientCycleById({
            recipientCycleId,
            signal,
        }),
        enabled: enabled && Boolean(organizationId) && Boolean(recipientCycleId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useTransfersQuery = ({
    organizationId,
    recipientCycleId = null,
    embryoId = null,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId ? transfersQueryKey({
        organizationId, recipientCycleId, embryoId, size,
    }) : fallbackKey,
    queryFn: ({ pageParam, signal }) => getTransfers({
        recipientCycleId,
        embryoId,
        page: pageParam,
        size,
        signal,
    }),
    enabled,
})

const useTenantQuery = ({ organizationId, id, queryKey, queryFn, enabled }) => {
    const result = useQuery({
        queryKey: organizationId && id ? queryKey : fallbackKey,
        queryFn,
        enabled: enabled && Boolean(organizationId) && Boolean(id),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useTransferDetailQuery = ({
    organizationId,
    transferId,
    enabled = true,
}) => useTenantQuery({
    organizationId,
    id: transferId,
    queryKey: organizationId && transferId
        ? transferDetailQueryKey({ organizationId, transferId })
        : fallbackKey,
    queryFn: ({ signal }) => getTransferById({ transferId, signal }),
    enabled,
})

export const usePregnancyChecksQuery = ({
    organizationId,
    transferId,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId && transferId
        ? pregnancyChecksQueryKey({ organizationId, transferId })
        : fallbackKey,
    queryFn: ({ pageParam, signal }) => getPregnancyChecks({
        transferId,
        page: pageParam,
        size,
        signal,
    }),
    enabled: enabled && Boolean(transferId),
})

export const usePregnancyOutcomeQuery = ({
    organizationId,
    transferId,
    enabled = true,
}) => useTenantQuery({
    organizationId,
    id: transferId,
    queryKey: organizationId && transferId
        ? pregnancyOutcomeQueryKey({ organizationId, transferId })
        : fallbackKey,
    queryFn: ({ signal }) => getPregnancyOutcome({ transferId, signal }),
    enabled,
})

export const usePregnancyFollowUpsQuery = ({
    organizationId,
    cohort,
    asOf,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId ? pregnancyFollowUpsQueryKey({
        organizationId, cohort, asOf, size,
    }) : fallbackKey,
    queryFn: ({ pageParam, signal }) => getPregnancyFollowUps({
        cohort,
        asOf,
        page: pageParam,
        size,
        signal,
    }),
    enabled: enabled && Boolean(cohort) && Boolean(asOf),
})
