import targetApiClient from '../../../../api/target/client'
import {
    allocateMatings,
    getMatingById,
    getMatings,
    mapMatingDetail,
    normalizeMatingPageParams,
} from '../matingApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}))

const provenance = {
    originType: 'MANUAL',
    sourceDocumentId: null,
    importBatchId: null,
    apiClientId: null,
    recordedByUserId: 'actor-a',
    recordedAt: '2026-10-09T12:00:00Z',
    confirmedByUserId: null,
    confirmedAt: null,
    derivationReference: null,
}

const semenBatch = {
    id: 'batch-a', batchCode: 'LOTE-42', sireId: 'sire-a',
    producerEstablishmentId: 'producer-a', provenanceCode: 'CERTIFIED',
    verificationStatus: 'VERIFIED', semenType: null, ownerId: null,
    receivedAt: null, status: 'ACTIVE', version: 0, provenance,
}

const mating = {
    id: 'mating-a', collectionId: 'collection-a', semenBatchId: 'batch-a',
    allocatedOocytes: 4, fertilizedAt: '2026-10-09T13:00:00Z', method: 'IVF',
    responsibleProfessionalId: null, status: 'FERTILIZED', version: 0,
    provenance,
}

const detail = {
    mating,
    lineage: {
        collectionId: 'collection-a',
        donorId: 'donor-a',
        semen: {
            batch: semenBatch,
            sire: {
                id: 'sire-a', name: 'Sire A', sex: 'MALE', status: 'ACTIVE',
                version: 2,
                identifiers: [{ type: 'REGISTRATION', issuer: null, value: 'S-42' }],
            },
            producer: {
                id: 'producer-a', legalPartyId: null, name: 'Central Genética',
                establishmentType: 'SEMEN_CENTER', registrationNumber: null,
                registrationAuthority: null, country: 'BR',
                verificationStatus: 'VERIFIED', verificationDocumentId: null,
                status: 'ACTIVE', version: 0,
            },
        },
    },
}

describe('target Mating API', () => {
    test('lists by implemented filters without textual search', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [mating], page: 0, size: 20 },
        })

        await expect(getMatings({
            collectionId: 'collection-a', page: 0, size: 20, signal,
        })).resolves.toMatchObject({
            items: [{ id: 'mating-a', allocatedOocytes: 4 }],
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/matings', {
            params: { collectionId: 'collection-a', page: 0, size: 20 },
            signal,
        })
        expect(normalizeMatingPageParams()).not.toHaveProperty('q')
        expect(normalizeMatingPageParams()).not.toHaveProperty('status')
    })

    test('loads detail with the immutable core lineage snapshot', async () => {
        targetApiClient.get.mockResolvedValueOnce({ data: detail })

        await expect(getMatingById({ matingId: 'mating/a' }))
            .resolves.toMatchObject({
                mating: { id: 'mating-a', status: 'FERTILIZED' },
                lineage: {
                    donorId: 'donor-a',
                    semen: {
                        batch: { id: 'batch-a' },
                        sire: { id: 'sire-a', sex: 'MALE' },
                        producer: { id: 'producer-a' },
                    },
                },
            })
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/matings/mating%2Fa',
            { signal: undefined }
        )
        expect(mapMatingDetail(detail)).not.toHaveProperty('embryos')
    })

    test('posts one atomic bulk with batch identity as Idempotency-Key', async () => {
        const intent = {
            idempotencyKey: 'batch-a',
            payload: {
                batchId: 'batch-a',
                items: [{ itemId: 'item-a', id: 'mating-a' }],
            },
        }
        targetApiClient.post.mockResolvedValueOnce({
            data: {
                batchId: 'batch-a',
                items: [{ itemId: 'item-a', matingId: 'mating-a', status: 'APPLIED' }],
            },
        })

        await expect(allocateMatings(intent)).resolves.toEqual({
            batchId: 'batch-a',
            items: [{ itemId: 'item-a', matingId: 'mating-a', status: 'APPLIED' }],
        })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/matings:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: 'batch-a' } }
        )
        expect(intent.payload).not.toHaveProperty('expectedCollectionVersion')
    })

    test('normalizes over-allocation and concurrent errors by code', async () => {
        targetApiClient.post
            .mockRejectedValueOnce({
                response: {
                    status: 409,
                    data: { code: 'OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT' },
                },
            })
            .mockRejectedValueOnce({
                response: {
                    status: 409,
                    data: { code: 'CONCURRENT_WRITE_CONFLICT' },
                },
            })

        await expect(allocateMatings({ payload: {} })).rejects.toMatchObject({
            kind: 'conflict', code: 'OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT',
        })
        await expect(allocateMatings({ payload: {} })).rejects.toMatchObject({
            kind: 'conflict', code: 'CONCURRENT_WRITE_CONFLICT',
        })
    })
})
