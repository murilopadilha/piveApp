import React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_OPERATIONAL_LOOKUP_PAGE_SIZE,
    getEstablishments,
    getFarmProperties,
    getOperationalLocations,
    getProfessionals,
} from '../api/operationalLookupApi'
import { getNextOpuPageParam } from './useOpuQueries'

const useLookupQuery = ({
    organizationId,
    type,
    query,
    enabled,
    load,
    keyContext = null,
}) => {
    const normalizedQuery = query.trim()
    const { expireSession } = useSession()

    const result = useInfiniteQuery({
        queryKey: organizationId
            ? targetOrganizationQueryKey(
                organizationId,
                'opuLookups',
                type,
                keyContext,
                { query: normalizedQuery }
            )
            : targetOrganizationScopeQueryKey(),
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => load({
            query: normalizedQuery,
            page: pageParam,
            size: DEFAULT_OPERATIONAL_LOOKUP_PAGE_SIZE,
            signal,
        }),
        getNextPageParam: getNextOpuPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    React.useEffect(() => {
        if (result.error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
            expireSession()
        }
    }, [expireSession, result.error])

    return result
}

export const useEstablishmentsLookup = options => useLookupQuery({
    ...options,
    type: 'establishments',
    load: getEstablishments,
})

export const useFarmPropertiesLookup = options => useLookupQuery({
    ...options,
    type: 'farmProperties',
    load: getFarmProperties,
})

export const useProfessionalsLookup = options => useLookupQuery({
    ...options,
    type: 'professionals',
    load: getProfessionals,
})

export const useOperationalLocationsLookup = ({
    establishmentId,
    ...options
}) => useLookupQuery({
    ...options,
    type: 'operationalLocations',
    keyContext: establishmentId,
    enabled: options.enabled && Boolean(establishmentId),
    load: params => getOperationalLocations({ establishmentId, ...params }),
})
