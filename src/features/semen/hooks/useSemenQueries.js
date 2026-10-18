import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_SEMEN_BATCH_PAGE_SIZE,
    getExternalEstablishmentById,
    getSemenBatchById,
    getSemenBatches,
} from '../api/semenApi'

export const semenBatchesQueryKey = ({ organizationId, query, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'semenBatches',
        'search',
        { query, size }
    )
)

export const semenBatchDetailQueryKey = ({
    organizationId,
    semenBatchId,
}) => targetOrganizationQueryKey(
    organizationId,
    'semenBatches',
    'detail',
    semenBatchId
)

export const externalEstablishmentDetailQueryKey = ({
    organizationId,
    externalEstablishmentId,
}) => targetOrganizationQueryKey(
    organizationId,
    'externalEstablishments',
    'detail',
    externalEstablishmentId
)

export const getNextSemenBatchPageParam = lastPage => (
    lastPage.items.length < lastPage.size
        ? undefined
        : lastPage.page + 1
)

const organizationFallbackKey = targetOrganizationScopeQueryKey()

const useExpireSessionOnUnauthorized = (error) => {
    const { expireSession } = useSession()

    React.useEffect(() => {
        if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
            expireSession()
        }
    }, [error, expireSession])
}

export const useSemenBatchesQuery = ({
    organizationId,
    query = '',
    size = DEFAULT_SEMEN_BATCH_PAGE_SIZE,
    enabled = true,
}) => {
    const normalizedQuery = query.trim()
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? semenBatchesQueryKey({
                organizationId,
                query: normalizedQuery,
                size,
            })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getSemenBatches({
            query: normalizedQuery,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextSemenBatchPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}

export const useSemenBatchDetailQuery = ({
    organizationId,
    semenBatchId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && semenBatchId
            ? semenBatchDetailQueryKey({ organizationId, semenBatchId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getSemenBatchById({ semenBatchId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(semenBatchId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}

export const useExternalEstablishmentDetailQuery = ({
    organizationId,
    externalEstablishmentId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && externalEstablishmentId
            ? externalEstablishmentDetailQueryKey({
                organizationId,
                externalEstablishmentId,
            })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getExternalEstablishmentById({
            externalEstablishmentId,
            signal,
        }),
        enabled: enabled && Boolean(organizationId) &&
            Boolean(externalEstablishmentId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}
