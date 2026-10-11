import React from 'react'
import {
    useInfiniteQuery,
    useQueries,
    useQuery,
} from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_EMBRYO_PAGE_SIZE,
    getAssessmentVersionById,
    getEmbryoById,
    getEmbryoEvaluations,
    getEmbryos,
} from '../api/embryoApi'

export const embryosQueryKey = ({
    organizationId,
    matingId = null,
    query,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'embryos',
    'search',
    { matingId, query, size }
)

export const embryoDetailQueryKey = ({ organizationId, embryoId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'embryos',
        'detail',
        embryoId
    )
)

export const embryoEvaluationsQueryKey = ({ organizationId, embryoId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'embryos',
        embryoId,
        'evaluations'
    )
)

export const assessmentVersionDetailQueryKey = ({
    organizationId,
    schemeVersionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'assessmentVersions',
    'detail',
    schemeVersionId
)

export const getNextEmbryoPageParam = lastPage => (
    lastPage.items.length < lastPage.size
        ? undefined
        : lastPage.page + 1
)

const organizationFallbackKey = targetOrganizationScopeQueryKey()

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

export const useEmbryosQuery = ({
    organizationId,
    matingId = null,
    query = '',
    size = DEFAULT_EMBRYO_PAGE_SIZE,
    enabled = true,
}) => {
    const normalizedQuery = query.trim()
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? embryosQueryKey({
                organizationId,
                matingId,
                query: normalizedQuery,
                size,
            })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getEmbryos({
            matingId,
            query: normalizedQuery,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextEmbryoPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useEmbryoDetailQuery = ({
    organizationId,
    embryoId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && embryoId
            ? embryoDetailQueryKey({ organizationId, embryoId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getEmbryoById({ embryoId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(embryoId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useEmbryoEvaluationsQuery = ({
    organizationId,
    embryoId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && embryoId
            ? embryoEvaluationsQueryKey({ organizationId, embryoId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getEmbryoEvaluations({ embryoId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(embryoId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useAssessmentVersionsQueries = ({
    organizationId,
    evaluations,
    enabled = true,
}) => {
    const versionIds = React.useMemo(
        () => [...new Set(
            evaluations.map(evaluation => evaluation.schemeVersionId)
        )],
        [evaluations]
    )
    const results = useQueries({
        queries: versionIds.map(schemeVersionId => ({
            queryKey: organizationId
                ? assessmentVersionDetailQueryKey({
                    organizationId,
                    schemeVersionId,
                })
                : organizationFallbackKey,
            queryFn: ({ signal }) => getAssessmentVersionById({
                schemeVersionId,
                signal,
            }),
            enabled: enabled && Boolean(organizationId),
        })),
    })

    useExpireSessionOnUnauthorized(results.map(result => result.error))

    return versionIds.map((schemeVersionId, index) => ({
        schemeVersionId,
        ...results[index],
    }))
}
