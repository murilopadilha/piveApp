import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_CORRECTION_PAGE_SIZE,
    getCorrectionById,
    getCorrectionImpact,
    getCorrections,
} from '../api/correctionApi'

const fallbackKey = targetOrganizationScopeQueryKey()

export const correctionsQueryKey = ({ organizationId, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'corrections',
        'list',
        { size }
    )
)

export const correctionDetailQueryKey = ({
    organizationId,
    correctionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'corrections',
    'detail',
    correctionId
)

export const correctionImpactQueryKey = ({
    organizationId,
    correctionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'corrections',
    correctionId,
    'impact'
)

export const getNextCorrectionPageParam = lastPage => (
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

export const useCorrectionsQuery = ({
    organizationId,
    size = DEFAULT_CORRECTION_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? correctionsQueryKey({ organizationId, size })
            : fallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getCorrections({
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextCorrectionPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useCorrectionDetailQuery = ({
    organizationId,
    correctionId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && correctionId
            ? correctionDetailQueryKey({ organizationId, correctionId })
            : fallbackKey,
        queryFn: ({ signal }) => getCorrectionById({ correctionId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(correctionId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useCorrectionImpactQuery = ({
    organizationId,
    correctionId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && correctionId
            ? correctionImpactQueryKey({ organizationId, correctionId })
            : fallbackKey,
        queryFn: ({ signal }) => getCorrectionImpact({ correctionId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(correctionId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}
