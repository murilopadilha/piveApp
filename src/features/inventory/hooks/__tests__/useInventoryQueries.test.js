import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    getEmbryoPackageById,
    getEmbryoPackageItems,
    getEmbryoPackages,
    getInventoryMovementLedger,
    getInventoryProjectionCheck,
    getStorageLocationById,
    getStorageLocations,
} from '../../api/inventoryApi'
import {
    embryoPackageDetailQueryKey,
    embryoPackageItemsQueryKey,
    embryoPackagesQueryKey,
    getNextInventoryPageParam,
    inventoryMovementsQueryKey,
    inventoryProjectionQueryKey,
    storageLocationDetailQueryKey,
    storageLocationsQueryKey,
    useEmbryoPackageDetailQuery,
    useEmbryoPackageItemsQuery,
    useEmbryoPackagesQuery,
    useInventoryMovementsQuery,
    useInventoryProjectionQuery,
    useStorageLocationDetailQuery,
    useStorageLocationsQuery,
} from '../useInventoryQueries'

jest.mock('../../api/inventoryApi', () => ({
    DEFAULT_INVENTORY_PAGE_SIZE: 20,
    getEmbryoPackageById: jest.fn(),
    getEmbryoPackageItems: jest.fn(),
    getEmbryoPackages: jest.fn(),
    getInventoryMovementLedger: jest.fn(),
    getInventoryProjectionCheck: jest.fn(),
    getStorageLocationById: jest.fn(),
    getStorageLocations: jest.fn(),
}))
jest.mock('../../../auth/SessionContext', () => ({
    useSession: () => ({ expireSession: jest.fn() }),
}))

const createWrapper = queryClient => function Wrapper({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

const createTestQueryClient = () => {
    const queryClient = createTargetQueryClient()
    queryClient.setDefaultOptions({
        ...queryClient.getDefaultOptions(),
        queries: {
            ...queryClient.getDefaultOptions().queries,
            gcTime: Infinity,
        },
    })
    return queryClient
}

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('M6A inventory queries', () => {
    test('uses only Organization-scoped query identities', () => {
        expect(embryoPackagesQueryKey({
            organizationId: 'organization-a',
            query: 'PKG', locationId: 'location-a', ownerId: null, size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'embryoPackages', 'search', {
                query: 'PKG', locationId: 'location-a', ownerId: null, size: 20,
            },
        ])
        expect(embryoPackageDetailQueryKey({
            organizationId: 'organization-a', packageId: 'package-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'embryoPackages', 'detail', 'package-a',
        ])
        expect(embryoPackageItemsQueryKey({
            organizationId: 'organization-a', packageId: 'package-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'embryoPackages', 'package-a', 'items',
        ])
        expect(storageLocationsQueryKey({
            organizationId: 'organization-a', size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'storageLocations', 'list', { size: 20 },
        ])
        expect(storageLocationDetailQueryKey({
            organizationId: 'organization-a', storageLocationId: 'location-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'storageLocations', 'detail', 'location-a',
        ])
        expect(inventoryMovementsQueryKey({
            organizationId: 'organization-a', packageId: 'package-a', size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'inventoryMovements', 'package-a', { size: 20 },
        ])
        expect(inventoryProjectionQueryKey({
            organizationId: 'organization-a', packageId: 'package-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'inventoryMovements', 'package-a', 'projectionCheck',
        ])
    })

    test('derives pagination only from the raw server page', () => {
        expect(getNextInventoryPageParam({
            items: Array.from({ length: 20 }), page: 0, size: 20,
        })).toBe(1)
        expect(getNextInventoryPageParam({
            items: Array.from({ length: 19 }), page: 0, size: 20,
        })).toBeUndefined()
    })

    test('loads package, storage, ledger and projection contracts', async () => {
        const queryClient = createTestQueryClient()
        getEmbryoPackages.mockResolvedValue({ items: [], page: 0, size: 20 })
        getEmbryoPackageById.mockResolvedValue({ id: 'package-a' })
        getEmbryoPackageItems.mockResolvedValue([])
        getStorageLocations.mockResolvedValue({ items: [], page: 0, size: 20 })
        getStorageLocationById.mockResolvedValue({ id: 'location-a' })
        getInventoryMovementLedger.mockResolvedValue({ items: [], page: 0, size: 20 })
        getInventoryProjectionCheck.mockResolvedValue({ matchesLedger: true })
        const { result, unmount } = renderHook(() => ({
            packages: useEmbryoPackagesQuery({ organizationId: 'organization-a' }),
            packageDetail: useEmbryoPackageDetailQuery({ organizationId: 'organization-a', packageId: 'package-a' }),
            items: useEmbryoPackageItemsQuery({ organizationId: 'organization-a', packageId: 'package-a' }),
            locations: useStorageLocationsQuery({ organizationId: 'organization-a' }),
            location: useStorageLocationDetailQuery({ organizationId: 'organization-a', storageLocationId: 'location-a' }),
            ledger: useInventoryMovementsQuery({ organizationId: 'organization-a', packageId: 'package-a' }),
            projection: useInventoryProjectionQuery({ organizationId: 'organization-a', packageId: 'package-a' }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(Object.values(result.current).every(query => query.isSuccess))
                .toBe(true)
        })
        expect(getEmbryoPackages).toHaveBeenCalledWith(expect.objectContaining({
            page: 0, signal: expect.any(AbortSignal),
        }))
        expect(getInventoryMovementLedger).toHaveBeenCalledWith({
            packageId: 'package-a', page: 0, size: 20,
            signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its packages in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getEmbryoPackages
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [{ id: 'package-b' }], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useEmbryoPackagesQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('package-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('package-b')

        unmount()
        queryClient.clear()
    })
})
