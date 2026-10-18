import React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_DATA_QUALITY_PAGE_SIZE,
    getDataQualityIssues,
    normalizeDataQualityQuery,
} from '../api/dataQualityApi'

const fallbackKey = targetOrganizationScopeQueryKey()

export const dataQualityQueryKey = ({
    organizationId,
    query,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'dataQuality',
    'search',
    { q: normalizeDataQualityQuery(query), size }
)

export const getNextDataQualityPageParam = lastPage => (
    lastPage.items.length < lastPage.size
        ? undefined
        : lastPage.page + 1
)

const useExpireSessionOnUnauthorized = (error) => {
    const { expireSession } = useSession()
    const unauthorized = error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED

    React.useEffect(() => {
        if (unauthorized) {
            expireSession()
        }
    }, [expireSession, unauthorized])
}

export const useDataQualityIssuesQuery = ({
    organizationId,
    query = '',
    size = DEFAULT_DATA_QUALITY_PAGE_SIZE,
    enabled = true,
}) => {
    const normalizedQuery = normalizeDataQualityQuery(query)
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? dataQualityQueryKey({
                organizationId,
                query: normalizedQuery,
                size,
            })
            : fallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getDataQualityIssues({
            query: normalizedQuery,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextDataQualityPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized(result.error)
    return result
}
