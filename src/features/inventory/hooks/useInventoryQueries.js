import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_INVENTORY_PAGE_SIZE,
    getEmbryoPackageById,
    getEmbryoPackageItems,
    getEmbryoPackages,
    getInventoryMovementLedger,
    getInventoryProjectionCheck,
    getStorageLocationById,
    getStorageLocations,
} from '../api/inventoryApi'

const fallbackKey = targetOrganizationScopeQueryKey()

export const embryoPackagesQueryKey = ({
    organizationId,
    query = '',
    locationId = null,
    ownerId = null,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'embryoPackages',
    'search',
    { query, locationId, ownerId, size }
)

export const embryoPackageDetailQueryKey = ({ organizationId, packageId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'embryoPackages',
        'detail',
        packageId
    )
)

export const embryoPackageItemsQueryKey = ({ organizationId, packageId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'embryoPackages',
        packageId,
        'items'
    )
)

export const storageLocationsQueryKey = ({ organizationId, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'storageLocations',
        'list',
        { size }
    )
)

export const storageLocationDetailQueryKey = ({
    organizationId,
    storageLocationId,
}) => targetOrganizationQueryKey(
    organizationId,
    'storageLocations',
    'detail',
    storageLocationId
)

export const inventoryMovementsQueryKey = ({
    organizationId,
    packageId,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'inventoryMovements',
    packageId,
    { size }
)

export const inventoryProjectionQueryKey = ({ organizationId, packageId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'inventoryMovements',
        packageId,
        'projectionCheck'
    )
)

export const getNextInventoryPageParam = lastPage => (
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

const useTenantInfiniteQuery = ({
    organizationId,
    queryKey,
    queryFn,
    enabled,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId ? queryKey : fallbackKey,
        initialPageParam: 0,
        queryFn,
        getNextPageParam: getNextInventoryPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

const useTenantQuery = ({
    organizationId,
    resourceId,
    queryKey,
    queryFn,
    enabled,
}) => {
    const result = useQuery({
        queryKey: organizationId && resourceId ? queryKey : fallbackKey,
        queryFn,
        enabled: enabled && Boolean(organizationId) && Boolean(resourceId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useEmbryoPackagesQuery = ({
    organizationId,
    query = '',
    locationId = null,
    ownerId = null,
    size = DEFAULT_INVENTORY_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId ? embryoPackagesQueryKey({
        organizationId,
        query,
        locationId,
        ownerId,
        size,
    }) : fallbackKey,
    queryFn: ({ pageParam, signal }) => getEmbryoPackages({
        query,
        locationId,
        ownerId,
        page: pageParam,
        size,
        signal,
    }),
    enabled,
})

export const useEmbryoPackageDetailQuery = ({
    organizationId,
    packageId,
    enabled = true,
}) => useTenantQuery({
    organizationId,
    resourceId: packageId,
    queryKey: organizationId && packageId
        ? embryoPackageDetailQueryKey({ organizationId, packageId })
        : fallbackKey,
    queryFn: ({ signal }) => getEmbryoPackageById({ packageId, signal }),
    enabled,
})

export const useEmbryoPackageItemsQuery = ({
    organizationId,
    packageId,
    enabled = true,
}) => useTenantQuery({
    organizationId,
    resourceId: packageId,
    queryKey: organizationId && packageId
        ? embryoPackageItemsQueryKey({ organizationId, packageId })
        : fallbackKey,
    queryFn: ({ signal }) => getEmbryoPackageItems({ packageId, signal }),
    enabled,
})

export const useStorageLocationsQuery = ({
    organizationId,
    size = DEFAULT_INVENTORY_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId
        ? storageLocationsQueryKey({ organizationId, size })
        : fallbackKey,
    queryFn: ({ pageParam, signal }) => getStorageLocations({
        page: pageParam,
        size,
        signal,
    }),
    enabled,
})

export const useStorageLocationDetailQuery = ({
    organizationId,
    storageLocationId,
    enabled = true,
}) => useTenantQuery({
    organizationId,
    resourceId: storageLocationId,
    queryKey: organizationId && storageLocationId
        ? storageLocationDetailQueryKey({
            organizationId,
            storageLocationId,
        })
        : fallbackKey,
    queryFn: ({ signal }) => getStorageLocationById({
        storageLocationId,
        signal,
    }),
    enabled,
})

export const useInventoryMovementsQuery = ({
    organizationId,
    packageId,
    size = DEFAULT_INVENTORY_PAGE_SIZE,
    enabled = true,
}) => useTenantInfiniteQuery({
    organizationId,
    queryKey: organizationId && packageId
        ? inventoryMovementsQueryKey({ organizationId, packageId, size })
        : fallbackKey,
    queryFn: ({ pageParam, signal }) => getInventoryMovementLedger({
        packageId,
        page: pageParam,
        size,
        signal,
    }),
    enabled: enabled && Boolean(packageId),
})

export const useInventoryProjectionQuery = ({
    organizationId,
    packageId,
    enabled = true,
}) => useTenantQuery({
    organizationId,
    resourceId: packageId,
    queryKey: organizationId && packageId
        ? inventoryProjectionQueryKey({ organizationId, packageId })
        : fallbackKey,
    queryFn: ({ signal }) => getInventoryProjectionCheck({ packageId, signal }),
    enabled,
})
