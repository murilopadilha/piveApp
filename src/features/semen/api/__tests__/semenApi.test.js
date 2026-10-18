import targetApiClient from '../../../../api/target/client'
import {
    getExternalEstablishmentById,
    getSemenBatchById,
    getSemenBatches,
    mapSemenBatch,
    normalizeSemenBatchPageParams,
} from '../semenApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn() },
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

const batch = {
    id: 'batch-a',
    batchCode: 'LOTE-42',
    sireId: 'animal-sire',
    producerEstablishmentId: 'producer-a',
    provenanceCode: 'CERTIFIED',
    verificationStatus: 'VERIFIED',
    semenType: 'CONVENTIONAL',
    ownerId: 'owner-a',
    receivedAt: '2026-10-01T12:00:00Z',
    status: 'ACTIVE',
    version: 0,
    provenance,
}

describe('target Semen batch API', () => {
    test('searches only by implemented batchCode query and page contract', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [batch], page: 1, size: 20 },
        })

        await expect(getSemenBatches({
            query: ' LOTE ', page: 1, size: 20, signal,
        })).resolves.toMatchObject({
            items: [{
                id: 'batch-a',
                batchCode: 'LOTE-42',
                sireId: 'animal-sire',
            }],
            page: 1,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/semen-batches', {
            params: { q: 'LOTE', page: 1, size: 20 },
            signal,
        })
    })

    test('loads batch and external producer by encoded stable IDs', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({ data: batch })
            .mockResolvedValueOnce({
                data: {
                    id: 'producer-a',
                    legalPartyId: null,
                    name: 'Central Genética',
                    establishmentType: 'SEMEN_CENTER',
                    registrationNumber: null,
                    registrationAuthority: null,
                    country: 'BR',
                    verificationStatus: 'VERIFIED',
                    verificationDocumentId: null,
                    status: 'ACTIVE',
                    version: 0,
                },
            })

        await expect(getSemenBatchById({ semenBatchId: 'batch/a' }))
            .resolves.toMatchObject({ batchCode: 'LOTE-42' })
        await expect(getExternalEstablishmentById({
            externalEstablishmentId: 'producer/a',
        })).resolves.toMatchObject({ name: 'Central Genética' })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            1,
            '/semen-batches/batch%2Fa',
            { signal: undefined }
        )
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2,
            '/external-establishments/producer%2Fa',
            { signal: undefined }
        )
    })

    test('does not invent physical inventory fields', () => {
        const mapped = mapSemenBatch(batch)

        expect(mapped).not.toHaveProperty('quantity')
        expect(mapped).not.toHaveProperty('strawBalance')
        expect(mapped).not.toHaveProperty('storage')
        expect(mapped).not.toHaveProperty('expiration')
    })

    test('validates search and pagination bounds', () => {
        expect(normalizeSemenBatchPageParams()).toEqual({
            q: '', page: 0, size: 20,
        })
        expect(() => normalizeSemenBatchPageParams({
            query: 'x'.repeat(201),
        })).toThrow(TypeError)
        expect(() => normalizeSemenBatchPageParams({ size: 101 }))
            .toThrow(TypeError)
    })

    test('normalizes wrong-tenant and network failures', async () => {
        targetApiClient.get
            .mockRejectedValueOnce({
                response: { status: 404, data: { code: 'SEMEN_BATCH_NOT_FOUND' } },
            })
            .mockRejectedValueOnce({ code: 'ERR_NETWORK', request: {} })

        await expect(getSemenBatchById({ semenBatchId: 'missing' }))
            .rejects.toMatchObject({
                kind: 'notFound', code: 'SEMEN_BATCH_NOT_FOUND',
            })
        await expect(getSemenBatches({ page: 0 })).rejects.toMatchObject({
            kind: 'network',
        })
    })
})
