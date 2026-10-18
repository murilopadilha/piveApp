import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_MATING_PAGE_SIZE,
    getMatingById,
    getMatings,
} from '../api/matingApi'

export const matingsQueryKey = ({
    organizationId,
    collectionId = null,
    semenBatchId = null,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'matings',
    'list',
    { collectionId, semenBatchId, size }
)

export const matingDetailQueryKey = ({ organizationId, matingId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'matings',
        'detail',
        matingId
    )
)

export const getNextMatingPageParam = lastPage => (
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

export const useMatingsQuery = ({
    organizationId,
    collectionId = null,
    semenBatchId = null,
    size = DEFAULT_MATING_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? matingsQueryKey({
                organizationId,
                collectionId,
                semenBatchId,
                size,
            })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getMatings({
            collectionId,
            semenBatchId,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextMatingPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}

export const useMatingDetailQuery = ({
    organizationId,
    matingId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && matingId
            ? matingDetailQueryKey({ organizationId, matingId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getMatingById({ matingId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(matingId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}
