import React from 'react'
import {
    useInfiniteQuery,
    useQuery,
} from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_CLIENT_PAGE_SIZE,
    getClientById,
    getClients,
} from '../api/clientApi'

export const clientsQueryKey = ({ organizationId, query, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'clients',
        'search',
        { query, size }
    )
)

export const clientDetailQueryKey = ({ organizationId, clientId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'clients',
        'detail',
        clientId
    )
)

export const getNextClientPageParam = (lastPage) => (
    lastPage.items.length < lastPage.size
        ? undefined
        : lastPage.page + 1
)

const useExpireSessionOnUnauthorized = (error) => {
    const { expireSession } = useSession()

    React.useEffect(() => {
        if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
            expireSession()
        }
    }, [error, expireSession])
}

export const useClientsQuery = ({
    organizationId,
    query = '',
    size = DEFAULT_CLIENT_PAGE_SIZE,
    enabled = true,
}) => {
    const normalizedQuery = query.trim()
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? clientsQueryKey({
                organizationId,
                query: normalizedQuery,
                size,
            })
            : targetOrganizationScopeQueryKey(),
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getClients({
            query: normalizedQuery,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextClientPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}

export const useClientDetailQuery = ({
    organizationId,
    clientId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && clientId
            ? clientDetailQueryKey({ organizationId, clientId })
            : targetOrganizationScopeQueryKey(),
        queryFn: ({ signal }) => getClientById({ clientId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(clientId),
    })

    useExpireSessionOnUnauthorized(result.error)

    return result
}
