import targetApiClient from '../../../../api/target/client'
import {
    getEmbryoPackageById,
    getEmbryoPackageItems,
    getEmbryoPackages,
    getInventoryMovementLedger,
    getInventoryProjectionCheck,
    getStorageLocationById,
    getStorageLocations,
    mapEmbryoPackage,
    normalizePackagePageParams,
    recordInventoryMovement,
    recordInventoryMovementBatch,
} from '../inventoryApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}))

const embryoPackage = {
    id: 'package-a',
    establishmentId: 'establishment-a',
    packageCode: 'PKG-001',
    packagingType: 'CONTAINER',
    ownerPartyId: null,
    status: 'SEALED',
    sealedAt: '2026-10-12T10:00:00Z',
    currentLocationId: 'location-a',
    lastMovementSequence: 2,
    version: 3,
}

const location = {
    id: 'location-a',
    establishmentId: 'establishment-a',
    operationalLocationId: null,
    parentId: null,
    typeCode: 'RACK',
    code: 'RACK-A',
    name: 'Rack A',
    status: 'ACTIVE',
    version: 0,
}

const movement = {
    id: 'movement-a',
    sequence: 2,
    type: 'MOVE',
    fromLocationId: 'location-a',
    toLocationId: 'location-b',
    occurredAt: '2026-10-12T11:00:00Z',
    reason: null,
}

afterEach(() => jest.clearAllMocks())

describe('M6A target inventory API', () => {
    test('lists packages using only the real filters and raw page envelope', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [embryoPackage], page: 0, size: 20 },
        })

        await expect(getEmbryoPackages({
            query: ' PKG ',
            locationId: 'location-a',
            ownerId: 'owner-a',
            page: 0,
            size: 20,
            signal,
        })).resolves.toMatchObject({
            items: [{ id: 'package-a', currentLocationId: 'location-a' }],
            page: 0,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/embryo-packages', {
            params: {
                q: 'PKG',
                locationId: 'location-a',
                ownerId: 'owner-a',
                page: 0,
                size: 20,
            },
            signal,
        })
        expect(normalizePackagePageParams()).not.toHaveProperty('status')
        expect(normalizePackagePageParams()).not.toHaveProperty('capacity')
    })

    test('maps only the public package view and reads active items', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({ data: embryoPackage })
            .mockResolvedValueOnce({
                data: [{
                    id: 'item-a',
                    cryopreservationItemId: 'cryo-item-a',
                    embryoId: 'embryo-a',
                    positionCode: null,
                }],
            })

        await expect(getEmbryoPackageById({ packageId: 'package/a' }))
            .resolves.toMatchObject({ status: 'SEALED', version: 3 })
        await expect(getEmbryoPackageItems({ packageId: 'package-a' }))
            .resolves.toEqual([expect.objectContaining({
                embryoId: 'embryo-a', positionCode: null,
            })])
        expect(targetApiClient.get.mock.calls).toEqual([
            ['/embryo-packages/package%2Fa', { signal: undefined }],
            ['/embryo-packages/package-a/items', { signal: undefined }],
        ])
        expect(mapEmbryoPackage(embryoPackage)).not.toHaveProperty('capacity')
        expect(mapEmbryoPackage(embryoPackage)).not.toHaveProperty('memberCount')
        expect(mapEmbryoPackage(embryoPackage)).not.toHaveProperty('packagedAt')
    })

    test('reads flat StorageLocations without hierarchy or capacity contracts', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({
                data: { items: [location], page: 0, size: 20 },
            })
            .mockResolvedValueOnce({ data: location })

        await expect(getStorageLocations({ page: 0, size: 20 }))
            .resolves.toMatchObject({ items: [{ code: 'RACK-A' }] })
        await expect(getStorageLocationById({
            storageLocationId: 'location/a',
        })).resolves.toMatchObject({ typeCode: 'RACK', status: 'ACTIVE' })
        expect(targetApiClient.get.mock.calls).toEqual([
            ['/storage-locations', {
                params: { page: 0, size: 20 }, signal: undefined,
            }],
            ['/storage-locations/location%2Fa', { signal: undefined }],
        ])
    })

    test('reads ordered ledger facts and projection-check', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({
                data: { items: [movement], page: 0, size: 20 },
            })
            .mockResolvedValueOnce({ data: { matchesLedger: true } })

        await expect(getInventoryMovementLedger({
            packageId: 'package-a', page: 0, size: 20,
        })).resolves.toMatchObject({
            items: [{ sequence: 2, type: 'MOVE', reason: null }],
        })
        await expect(getInventoryProjectionCheck({ packageId: 'package-a' }))
            .resolves.toEqual({ matchesLedger: true })
        expect(targetApiClient.get.mock.calls).toEqual([
            ['/inventory-movements/packages/package-a', {
                params: { page: 0, size: 20 }, signal: undefined,
            }],
            ['/inventory-movements/packages/package-a/projection-check', {
                signal: undefined,
            }],
        ])
    })

    test('posts exact single movement with movement ID as key', async () => {
        const intent = {
            idempotencyKey: 'movement-a',
            payload: {
                id: 'movement-a',
                packageId: 'package-a',
                type: 'MOVE',
                expectedLocationId: 'location-a',
                destinationId: 'location-b',
                expectedVersion: 3,
                occurredAt: '2026-10-12T11:00:00Z',
                reason: null,
            },
        }
        targetApiClient.post.mockResolvedValueOnce({
            data: {
                id: 'movement-a',
                packageId: 'package-a',
                sequence: 3,
                currentLocationId: 'location-b',
                version: 4,
            },
        })

        await expect(recordInventoryMovement(intent)).resolves.toMatchObject({
            id: 'movement-a', currentLocationId: 'location-b', version: 4,
        })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/inventory-movements',
            intent.payload,
            { targetContext: { idempotencyKey: 'movement-a' } }
        )
        expect(intent.payload).not.toHaveProperty('expectedInventoryVersion')
        expect(intent.payload).not.toHaveProperty('expectedLocationVersion')
    })

    test('posts atomic bulk with batch ID as key', async () => {
        const intent = {
            idempotencyKey: 'batch-a',
            payload: { batchId: 'batch-a', items: [{ id: 'movement-a' }] },
        }
        targetApiClient.post.mockResolvedValueOnce({
            data: {
                batchId: 'batch-a',
                items: [{
                    id: 'movement-a', packageId: 'package-a', sequence: 1,
                    currentLocationId: 'location-a', version: 3,
                }],
            },
        })

        await expect(recordInventoryMovementBatch(intent)).resolves.toMatchObject({
            batchId: 'batch-a', items: [{ id: 'movement-a' }],
        })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/inventory-movements/bulk',
            intent.payload,
            { targetContext: { idempotencyKey: 'batch-a' } }
        )
    })

    test('normalizes state conflicts by Problem Details code', async () => {
        targetApiClient.post.mockRejectedValueOnce({
            response: {
                status: 409,
                data: { code: 'PACKAGE_NOT_IN_EXPECTED_LOCATION' },
            },
        })

        await expect(recordInventoryMovement({ payload: {} }))
            .rejects.toMatchObject({
                kind: 'conflict', code: 'PACKAGE_NOT_IN_EXPECTED_LOCATION',
            })
    })

    test('rejects invalid search and page inputs before transport', () => {
        expect(() => normalizePackagePageParams({ query: 'x'.repeat(201) }))
            .toThrow(TypeError)
        expect(() => normalizePackagePageParams({ page: 0, size: 101 }))
            .toThrow(TypeError)
    })
})
