import targetApiClient from '../../../../api/target/client'
import {
    closeRecipientCycle,
    getPregnancyChecks,
    getPregnancyFollowUps,
    getPregnancyOutcome,
    getRecipientCycleById,
    getRecipientCycles,
    getTransferById,
    getTransfers,
    mapPregnancyFollowUp,
    normalizePregnancyFollowUpParams,
    normalizeRecipientCyclePageParams,
    openRecipientCycle,
} from '../transferApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}))

const provenance = {
    originType: 'MANUAL', sourceDocumentId: null, importBatchId: null,
    apiClientId: null, recordedByUserId: 'actor-a',
    recordedAt: '2026-10-11T12:00:00Z', confirmedByUserId: null,
    confirmedAt: null, derivationReference: null,
}
const cycle = {
    id: 'cycle-a', recipientAnimalId: 'animal-a', recipientName: 'Receptora A',
    protocolVersionId: null, openedOn: '2026-10-01', closedOn: null,
    status: 'OPEN', notes: null, closureReason: null, version: 0, provenance,
}
const transfer = {
    id: 'transfer-a', reservationId: 'reservation-a', embryoId: 'embryo-a',
    recipientCycleId: 'cycle-a', performedAt: '2026-10-11T12:00:00Z',
    timezone: 'America/Sao_Paulo', origin: 'FRESH', thawEventId: null,
    operatorProfessionalId: 'professional-a', notes: null, provenance,
}
const check = {
    id: 'check-a', transferId: 'transfer-a', checkedAt: '2026-11-10T12:00:00Z',
    timezone: 'America/Sao_Paulo', result: 'PREGNANT', methodCode: 'ULTRASOUND',
    observations: null, professionalId: 'professional-a', supersedesCheckId: null,
    correctionReason: null, provenance,
}
const semenBatch = {
    id: 'batch-a', batchCode: 'LOTE-42', sireId: 'sire-a',
    producerEstablishmentId: 'producer-a', provenanceCode: 'CERTIFIED',
    verificationStatus: 'VERIFIED', semenType: null, ownerId: null,
    receivedAt: null, status: 'ACTIVE', version: 0, provenance,
}
const transferDetail = {
    transfer,
    lineage: {
        embryoId: 'embryo-a', matingId: 'mating-a',
        mating: {
            collectionId: 'collection-a', donorId: 'donor-a',
            semen: {
                batch: semenBatch,
                sire: {
                    id: 'sire-a', name: 'Sire A', sex: 'MALE', status: 'ACTIVE',
                    version: 0, identifiers: [],
                },
                producer: {
                    id: 'producer-a', legalPartyId: null, name: 'Central A',
                    establishmentType: 'SEMEN_CENTER', registrationNumber: null,
                    registrationAuthority: null, country: 'BR',
                    verificationStatus: 'VERIFIED', verificationDocumentId: null,
                    status: 'ACTIVE', version: 0,
                },
            },
        },
    },
}

afterEach(() => jest.clearAllMocks())

describe('M5A target API contracts', () => {
    test('lists and loads RecipientCycles with exact implemented filters', async () => {
        const signal = new AbortController().signal
        targetApiClient.get
            .mockResolvedValueOnce({ data: { items: [cycle], page: 0, size: 20 } })
            .mockResolvedValueOnce({ data: cycle })

        await expect(getRecipientCycles({
            recipientId: 'animal-a', status: 'OPEN', page: 0, size: 20, signal,
        })).resolves.toMatchObject({ items: [{ id: 'cycle-a' }] })
        await expect(getRecipientCycleById({ recipientCycleId: 'cycle/a' }))
            .resolves.toMatchObject({ recipientName: 'Receptora A' })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(1, '/recipient-cycles', {
            params: { recipientId: 'animal-a', status: 'OPEN', page: 0, size: 20 },
            signal,
        })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2, '/recipient-cycles/cycle%2Fa', { signal: undefined }
        )
        expect(normalizeRecipientCyclePageParams()).not.toHaveProperty('role')
    })

    test('opens and closes with stable Idempotency-Key and exact bodies', async () => {
        const openIntent = {
            idempotencyKey: 'open-key',
            payload: {
                id: 'cycle-a', recipientAnimalId: 'animal-a',
                protocolVersionId: null, openedOn: '2026-10-01', notes: null,
            },
        }
        const closeIntent = {
            idempotencyKey: 'close-key', recipientCycleId: 'cycle-a',
            payload: { expectedVersion: 0, closedOn: '2026-10-02', reason: 'Done' },
        }
        targetApiClient.post
            .mockResolvedValueOnce({ data: cycle })
            .mockResolvedValueOnce({ data: { ...cycle, recipientName: null, status: 'CLOSED', version: 1 } })

        await openRecipientCycle(openIntent)
        await expect(closeRecipientCycle(closeIntent)).resolves.toMatchObject({
            recipientName: null, status: 'CLOSED', version: 1,
        })
        expect(targetApiClient.post).toHaveBeenNthCalledWith(
            1, '/recipient-cycles', openIntent.payload,
            { targetContext: { idempotencyKey: 'open-key' } }
        )
        expect(targetApiClient.post).toHaveBeenNthCalledWith(
            2, '/recipient-cycles/cycle-a:close', closeIntent.payload,
            { targetContext: { idempotencyKey: 'close-key' } }
        )
    })

    test('reads performed Transfer list/detail without reservation writes', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({ data: { items: [transfer], page: 0, size: 20 } })
            .mockResolvedValueOnce({ data: transferDetail })

        await expect(getTransfers({
            recipientCycleId: 'cycle-a', embryoId: 'embryo-a', page: 0, size: 20,
        })).resolves.toMatchObject({ items: [{ id: 'transfer-a' }] })
        await expect(getTransferById({ transferId: 'transfer-a' })).resolves.toMatchObject({
            transfer: { id: 'transfer-a', origin: 'FRESH' },
            lineage: { matingId: 'mating-a', mating: { donorId: 'donor-a' } },
        })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(1, '/transfers', {
            params: { recipientCycleId: 'cycle-a', embryoId: 'embryo-a', page: 0, size: 20 },
            signal: undefined,
        })
        expect(targetApiClient.post).not.toHaveBeenCalled()
    })

    test('reads history including invalidation and nullable latest outcome', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({
                data: {
                    items: [{
                        check,
                        invalidationId: 'invalidation-a',
                        invalidationReason: 'Incorrect evidence',
                        invalidatedAt: '2026-11-11T12:00:00Z',
                    }],
                    page: 0,
                    size: 20,
                },
            })
            .mockResolvedValueOnce({
                data: { transferId: 'transfer-a', latestValidCheck: null },
            })

        await expect(getPregnancyChecks({ transferId: 'transfer-a' }))
            .resolves.toMatchObject({
                items: [{ invalidationId: 'invalidation-a' }],
            })
        await expect(getPregnancyOutcome({ transferId: 'transfer-a' }))
            .resolves.toEqual({ transferId: 'transfer-a', latestValidCheck: null })
    })

    test('loads only D30/D60 follow-ups with exact query parameters', async () => {
        const followUp = {
            transferId: 'transfer-a', embryoId: 'embryo-a',
            recipientCycleId: 'cycle-a', recipientAnimalId: 'animal-a',
            performedOn: '2026-10-01', cohort: 'D30', targetDay: 30,
            windowFromDay: 25, windowThroughDay: 35, checkId: null,
            result: null, checkedAt: null, checkedTimezone: null, status: 'DUE',
        }
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [followUp], page: 0, size: 20 },
        })

        await expect(getPregnancyFollowUps({
            cohort: 'D30', asOf: '2026-10-31', page: 0, size: 20,
        })).resolves.toMatchObject({ items: [{ cohort: 'D30', status: 'DUE' }] })
        expect(targetApiClient.get).toHaveBeenCalledWith('/pregnancy-follow-ups', {
            params: { cohort: 'D30', asOf: '2026-10-31', page: 0, size: 20 },
            signal: undefined,
        })
        expect(() => normalizePregnancyFollowUpParams({
            cohort: 'D45', asOf: '2026-10-31', page: 0, size: 20,
        })).toThrow(TypeError)
        expect(mapPregnancyFollowUp(followUp).result).toBeNull()
    })

    test('normalizes wrong-tenant and stale conflicts without parsing detail', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: { status: 404, data: { code: 'RECIPIENT_CYCLE_NOT_FOUND' } },
        })
        targetApiClient.post.mockRejectedValueOnce({
            response: { status: 409, data: { code: 'STALE_RECIPIENT_CYCLE_VERSION' } },
        })

        await expect(getRecipientCycleById({ recipientCycleId: 'missing' }))
            .rejects.toMatchObject({ kind: 'notFound', code: 'RECIPIENT_CYCLE_NOT_FOUND' })
        await expect(closeRecipientCycle({ recipientCycleId: 'cycle-a', payload: {} }))
            .rejects.toMatchObject({ kind: 'conflict', code: 'STALE_RECIPIENT_CYCLE_VERSION' })
    })
})
