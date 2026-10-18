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
import { getClientById } from '../../clients/api/clientApi'
import {
    getEstablishmentById,
    getFarmPropertyById,
    getOperationalLocationById,
    getProfessionalById,
} from '../api/operationalLookupApi'
import {
    DEFAULT_OPU_PAGE_SIZE,
    getOocyteCollectionById,
    getOocyteCollectionDonorSnapshot,
    getOpuSessionById,
    getOpuSessionCollections,
    getOpuSessionSummary,
    getOpuSessions,
} from '../api/opuApi'

export const opuSessionsQueryKey = ({ organizationId, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'opuSessions',
        'list',
        { size }
    )
)

export const opuSessionDetailQueryKey = ({
    organizationId,
    opuSessionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'opuSessions',
    'detail',
    opuSessionId
)

export const opuSessionSummaryQueryKey = ({
    organizationId,
    opuSessionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'opuSessions',
    opuSessionId,
    'summary'
)

export const opuSessionCollectionsQueryKey = ({
    organizationId,
    opuSessionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'opuSessions',
    opuSessionId,
    'collections'
)

export const oocyteCollectionDetailQueryKey = ({
    organizationId,
    oocyteCollectionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'oocyteCollections',
    'detail',
    oocyteCollectionId
)

export const oocyteCollectionDonorSnapshotQueryKey = ({
    organizationId,
    oocyteCollectionId,
}) => targetOrganizationQueryKey(
    organizationId,
    'oocyteCollections',
    oocyteCollectionId,
    'donorSnapshot'
)

export const opuReferenceQueryKey = ({ organizationId, type, id }) => (
    targetOrganizationQueryKey(
        organizationId,
        'opuReferences',
        type,
        id
    )
)

export const getNextOpuPageParam = lastPage => (
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

const organizationFallbackKey = targetOrganizationScopeQueryKey()

export const useOpuSessionsQuery = ({
    organizationId,
    size = DEFAULT_OPU_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? opuSessionsQueryKey({ organizationId, size })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getOpuSessions({
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextOpuPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useOpuSessionDetailQuery = ({
    organizationId,
    opuSessionId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && opuSessionId
            ? opuSessionDetailQueryKey({ organizationId, opuSessionId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getOpuSessionById({ opuSessionId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(opuSessionId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useOpuSessionSummaryQuery = ({
    organizationId,
    opuSessionId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && opuSessionId
            ? opuSessionSummaryQueryKey({ organizationId, opuSessionId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getOpuSessionSummary({ opuSessionId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(opuSessionId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useOpuSessionCollectionsQuery = ({
    organizationId,
    opuSessionId,
    size = DEFAULT_OPU_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId && opuSessionId
            ? opuSessionCollectionsQueryKey({ organizationId, opuSessionId })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getOpuSessionCollections({
            opuSessionId,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextOpuPageParam,
        enabled: enabled && Boolean(organizationId) && Boolean(opuSessionId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useOocyteCollectionDetailQuery = ({
    organizationId,
    oocyteCollectionId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && oocyteCollectionId
            ? oocyteCollectionDetailQueryKey({
                organizationId,
                oocyteCollectionId,
            })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getOocyteCollectionById({
            oocyteCollectionId,
            signal,
        }),
        enabled: enabled && Boolean(organizationId) &&
            Boolean(oocyteCollectionId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useOocyteCollectionDonorSnapshotQuery = ({
    organizationId,
    oocyteCollectionId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && oocyteCollectionId
            ? oocyteCollectionDonorSnapshotQueryKey({
                organizationId,
                oocyteCollectionId,
            })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getOocyteCollectionDonorSnapshot({
            oocyteCollectionId,
            signal,
        }),
        enabled: enabled && Boolean(organizationId) &&
            Boolean(oocyteCollectionId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useOpuReferenceQueries = ({
    organizationId,
    session,
    canReadMasterData,
    canReadClient,
    enabled = true,
}) => {
    const definitions = React.useMemo(() => {
        if (!organizationId || !session || !enabled) {
            return []
        }

        const references = []

        if (canReadMasterData) {
            references.push(
                {
                    type: 'establishment',
                    id: session.establishmentId,
                    load: signal => getEstablishmentById({
                        establishmentId: session.establishmentId,
                        signal,
                    }),
                },
                {
                    type: 'farmProperty',
                    id: session.farmPropertyId,
                    load: signal => getFarmPropertyById({
                        farmPropertyId: session.farmPropertyId,
                        signal,
                    }),
                },
                {
                    type: 'professional',
                    id: session.leadProfessionalId,
                    load: signal => getProfessionalById({
                        professionalId: session.leadProfessionalId,
                        signal,
                    }),
                }
            )

            if (session.operationalLocationId) {
                references.push({
                    type: 'operationalLocation',
                    id: session.operationalLocationId,
                    load: signal => getOperationalLocationById({
                        establishmentId: session.establishmentId,
                        operationalLocationId: session.operationalLocationId,
                        signal,
                    }),
                })
            }
        }

        if (canReadClient && session.clientId) {
            references.push({
                type: 'client',
                id: session.clientId,
                load: signal => getClientById({
                    clientId: session.clientId,
                    signal,
                }),
            })
        }

        return references
    }, [
        canReadClient,
        canReadMasterData,
        enabled,
        organizationId,
        session,
    ])
    const results = useQueries({
        queries: definitions.map(definition => ({
            queryKey: opuReferenceQueryKey({
                organizationId,
                type: definition.type,
                id: definition.id,
            }),
            queryFn: ({ signal }) => definition.load(signal),
        })),
    })

    useExpireSessionOnUnauthorized(results.map(result => result.error))

    return definitions.reduce((references, definition, index) => ({
        ...references,
        [definition.type]: results[index],
    }), {})
}
