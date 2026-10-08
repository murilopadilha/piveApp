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
    DEFAULT_ANIMAL_PAGE_SIZE,
    getAnimalById,
    getAnimalIdentifiers,
    getAnimalOwnerById,
    getAnimalOwnership,
    getAnimals,
    getBreedById,
} from '../api/animalApi'

export const animalsQueryKey = ({ organizationId, query, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'animals',
        'search',
        { query, size }
    )
)

export const animalDetailQueryKey = ({ organizationId, animalId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'animals',
        'detail',
        animalId
    )
)

export const animalIdentifiersQueryKey = ({ organizationId, animalId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'animals',
        animalId,
        'identifiers'
    )
)

export const animalOwnershipQueryKey = ({ organizationId, animalId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'animals',
        animalId,
        'ownership'
    )
)

export const breedDetailQueryKey = ({ organizationId, breedId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'breeds',
        'detail',
        breedId
    )
)

export const animalOwnerDetailQueryKey = ({ organizationId, ownerId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'owners',
        'detail',
        ownerId
    )
)

export const getNextAnimalPageParam = lastPage => (
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

export const useAnimalsQuery = ({
    organizationId,
    query = '',
    size = DEFAULT_ANIMAL_PAGE_SIZE,
    enabled = true,
}) => {
    const normalizedQuery = query.trim()
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? animalsQueryKey({ organizationId, query: normalizedQuery, size })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getAnimals({
            query: normalizedQuery,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextAnimalPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useAnimalDetailQuery = ({
    organizationId,
    animalId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && animalId
            ? animalDetailQueryKey({ organizationId, animalId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getAnimalById({ animalId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(animalId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

const useAnimalHistoryQuery = ({
    organizationId,
    animalId,
    size,
    enabled,
    key,
    queryFn,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId && animalId
            ? key({ organizationId, animalId })
            : organizationFallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => queryFn({
            animalId,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextAnimalPageParam,
        enabled: enabled && Boolean(organizationId) && Boolean(animalId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useAnimalIdentifiersQuery = ({
    organizationId,
    animalId,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
    enabled = true,
}) => useAnimalHistoryQuery({
    organizationId,
    animalId,
    size,
    enabled,
    key: animalIdentifiersQueryKey,
    queryFn: getAnimalIdentifiers,
})

export const useAnimalOwnershipQuery = ({
    organizationId,
    animalId,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
    enabled = true,
}) => useAnimalHistoryQuery({
    organizationId,
    animalId,
    size,
    enabled,
    key: animalOwnershipQueryKey,
    queryFn: getAnimalOwnership,
})

export const useBreedDetailQuery = ({
    organizationId,
    breedId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && breedId
            ? breedDetailQueryKey({ organizationId, breedId })
            : organizationFallbackKey,
        queryFn: ({ signal }) => getBreedById({ breedId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(breedId),
    })

    useExpireSessionOnUnauthorized([result.error])

    return result
}

export const useAnimalOwnersQueries = ({
    organizationId,
    ownerIds,
    enabled = true,
}) => {
    const uniqueOwnerIds = React.useMemo(
        () => [...new Set(ownerIds.filter(Boolean))],
        [ownerIds]
    )
    const results = useQueries({
        queries: uniqueOwnerIds.map(ownerId => ({
            queryKey: organizationId
                ? animalOwnerDetailQueryKey({ organizationId, ownerId })
                : organizationFallbackKey,
            queryFn: ({ signal }) => getAnimalOwnerById({ ownerId, signal }),
            enabled: enabled && Boolean(organizationId),
        })),
    })

    useExpireSessionOnUnauthorized(results.map(result => result.error))

    return uniqueOwnerIds.map((ownerId, index) => ({
        ownerId,
        ...results[index],
    }))
}
