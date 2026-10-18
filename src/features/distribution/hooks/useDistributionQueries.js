import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    analyzeRecallImpact,
    DEFAULT_DISTRIBUTION_PAGE_SIZE,
    getRecallById,
    getRecalls,
    getShipmentById,
    getShipments,
    validateShipment,
} from '../api/distributionApi'

const fallbackKey = targetOrganizationScopeQueryKey()

export const shipmentsQueryKey = ({ organizationId, query, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'shipments',
        'search',
        { q: query, size }
    )
)

export const shipmentDetailQueryKey = ({ organizationId, shipmentId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'shipments',
        'detail',
        shipmentId
    )
)

export const shipmentValidationQueryKey = ({
    organizationId,
    shipmentId,
    movementAt,
}) => targetOrganizationQueryKey(
    organizationId,
    'shipments',
    shipmentId,
    'validation',
    { movementAt }
)

export const recallsQueryKey = ({ organizationId, query, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'recalls',
        'search',
        { q: query, size }
    )
)

export const recallDetailQueryKey = ({ organizationId, recallId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'recalls',
        'detail',
        recallId
    )
)

export const recallImpactQueryKey = ({
    organizationId,
    recallId,
    cutoff,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'recalls',
    recallId,
    'impact',
    { cutoff: cutoff ?? null, size }
)

export const getNextShipmentPageParam = lastPage => (
    lastPage.items.length < lastPage.size ? undefined : lastPage.page + 1
)

export const getNextRecallPageParam = lastPage => (
    lastPage.items.length < lastPage.size ? undefined : lastPage.page + 1
)

export const getNextRecallImpactPageParam = lastPage => (
    lastPage.materials.length < lastPage.size
        ? undefined
        : {
            page: lastPage.page + 1,
            cutoff: lastPage.analysisCutoff,
        }
)

const useExpireSessionOnUnauthorized = (errors) => {
    const { expireSession } = useSession()
    const unauthorized = errors.some(
        error => error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED
    )

    React.useEffect(() => {
        if (unauthorized) expireSession()
    }, [expireSession, unauthorized])
}

export const useShipmentsQuery = ({
    organizationId,
    query = '',
    size = DEFAULT_DISTRIBUTION_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? shipmentsQueryKey({ organizationId, query, size })
            : [...fallbackKey, 'shipments', 'disabled'],
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getShipments({
            query,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextShipmentPageParam,
        enabled: enabled && Boolean(organizationId),
    })
    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useShipmentDetailQuery = ({
    organizationId,
    shipmentId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && shipmentId
            ? shipmentDetailQueryKey({ organizationId, shipmentId })
            : [...fallbackKey, 'shipments', 'detail', 'disabled'],
        queryFn: ({ signal }) => getShipmentById({ shipmentId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(shipmentId),
    })
    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useShipmentValidationQuery = ({
    organizationId,
    shipmentId,
    movementAt,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && shipmentId && movementAt
            ? shipmentValidationQueryKey({
                organizationId,
                shipmentId,
                movementAt,
            })
            : [...fallbackKey, 'shipments', 'validation', 'disabled'],
        queryFn: ({ signal }) => validateShipment({
            shipmentId,
            movementAt,
            signal,
        }),
        enabled: enabled && Boolean(organizationId) &&
            Boolean(shipmentId) && Boolean(movementAt),
        staleTime: 0,
    })
    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useRecallsQuery = ({
    organizationId,
    query = '',
    size = DEFAULT_DISTRIBUTION_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? recallsQueryKey({ organizationId, query, size })
            : [...fallbackKey, 'recalls', 'disabled'],
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getRecalls({
            query,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextRecallPageParam,
        enabled: enabled && Boolean(organizationId),
    })
    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useRecallDetailQuery = ({
    organizationId,
    recallId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && recallId
            ? recallDetailQueryKey({ organizationId, recallId })
            : [...fallbackKey, 'recalls', 'detail', 'disabled'],
        queryFn: ({ signal }) => getRecallById({ recallId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(recallId),
    })
    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useRecallImpactQuery = ({
    organizationId,
    recallId,
    cutoff = null,
    size = DEFAULT_DISTRIBUTION_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId && recallId
            ? recallImpactQueryKey({
                organizationId,
                recallId,
                cutoff,
                size,
            })
            : [...fallbackKey, 'recalls', 'impact', 'disabled'],
        initialPageParam: { page: 0, cutoff },
        queryFn: ({ pageParam, signal }) => analyzeRecallImpact({
            recallId,
            cutoff: pageParam.cutoff,
            page: pageParam.page,
            size,
            signal,
        }),
        getNextPageParam: getNextRecallImpactPageParam,
        enabled: enabled && Boolean(organizationId) && Boolean(recallId),
        staleTime: 0,
    })
    useExpireSessionOnUnauthorized([result.error])
    return result
}
