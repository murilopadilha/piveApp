import { validate, version } from 'uuid'

import {
    createCollectionBatchIntent,
    createCollectionCorrectionIntent,
    createCollectionDraftItem,
    createOpenOpuIntent,
    createSessionTransitionIntent,
    renewCollectionBatchIntent,
    updateCollectionBatchIntent,
    updateCollectionDraftItem,
    validateCollectionDraftItem,
} from '../opuIntents'

const fields = {
    establishmentId: 'establishment-id',
    operationalLocationId: null,
    farmPropertyId: 'farm-id',
    clientId: null,
    leadProfessionalId: 'professional-id',
    performedAt: '2026-10-09T12:00:00.000Z',
    timezone: 'America/Sao_Paulo',
    notes: '',
}

const createItem = () => createCollectionDraftItem({
    donorId: 'animal-id',
    collectedAt: '2026-10-09T12:10:00.000Z',
    totalRecovered: '4',
    viable: '3',
    folliclesAspirated: '0',
})

describe('OPU command intentions', () => {
    it('creates version 7 IDs once for an open intention', () => {
        const intent = createOpenOpuIntent(fields)

        expect(validate(intent.idempotencyKey)).toBe(true)
        expect(version(intent.idempotencyKey)).toBe(7)
        expect(version(intent.payload.id)).toBe(7)
        expect(createOpenOpuIntent(fields).idempotencyKey)
            .not.toBe(intent.idempotencyKey)
    })

    it('keeps transition identity when the same intention is retried', () => {
        const intent = createSessionTransitionIntent({
            opuSessionId: 'opu-id',
            expectedVersion: 1,
            action: 'start',
        })
        const retry = intent

        expect(retry.idempotencyKey).toBe(intent.idempotencyKey)
        expect(createSessionTransitionIntent({
            opuSessionId: 'opu-id',
            expectedVersion: 1,
            action: 'start',
        }).idempotencyKey).not.toBe(intent.idempotencyKey)
    })

    it('preserves collection and item IDs after edits and dry-run updates', () => {
        const item = createItem()
        const edited = updateCollectionDraftItem(item, { viable: '2' })
        const batch = createCollectionBatchIntent({
            opuSessionId: 'opu-id',
            expectedSessionVersion: 1,
            items: [item],
        })
        const updated = updateCollectionBatchIntent(batch, {
            expectedSessionVersion: 1,
            items: [edited],
        })

        expect(edited.itemId).toBe(item.itemId)
        expect(edited.collectionId).toBe(item.collectionId)
        expect(updated.idempotencyKey).toBe(batch.idempotencyKey)
        expect(updated.payload.batchId).toBe(batch.idempotencyKey)
        expect(updated.payload.items[0].itemId).toBe(item.itemId)
        expect(updated.payload.items[0].id).toBe(item.collectionId)
        expect(updated.payload.items[0].folliclesAspirated).toBe(0)
    })

    it('uses a new batch key only for a renewed intention', () => {
        const item = createItem()
        const first = createCollectionBatchIntent({
            opuSessionId: 'opu-id',
            expectedSessionVersion: 1,
            items: [item],
        })
        const renewed = renewCollectionBatchIntent(first, {
            expectedSessionVersion: 2,
            items: [item],
        })

        expect(renewed.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(renewed.payload.batchId).toBe(renewed.idempotencyKey)
        expect(renewed.payload.items[0].itemId).toBe(item.itemId)
        expect(renewed.payload.items[0].id).toBe(item.collectionId)
    })

    it('validates the real count invariants without hiding zero', () => {
        expect(validateCollectionDraftItem(createItem())).toMatchObject({
            totalRecovered: 4,
            viable: 3,
            folliclesAspirated: 0,
        })
        expect(() => validateCollectionDraftItem({
            ...createItem(),
            totalRecovered: '2',
            viable: '3',
        })).toThrow('viable cannot exceed totalRecovered')
    })

    it('creates a correction intention with payload versions and counts', () => {
        const intent = createCollectionCorrectionIntent({
            oocyteCollectionId: 'collection-id',
            expectedVersion: 2,
            totalRecovered: '5',
            viable: '4',
            folliclesAspirated: '',
            notes: 'Ajuste',
            reason: 'Conferência de campo',
        })

        expect(version(intent.idempotencyKey)).toBe(7)
        expect(intent.payload).toEqual({
            expectedVersion: 2,
            counts: {
                totalRecovered: 5,
                viable: 4,
                folliclesAspirated: null,
            },
            notes: 'Ajuste',
            reason: 'Conferência de campo',
        })
    })
})
