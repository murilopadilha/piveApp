import { validate, version } from 'uuid'

import {
    createMatingBatchIntent,
    createMatingDraftItem,
    markMatingBatchIntentSent,
    renewMatingDraftItems,
    updateMatingDraftItem,
} from '../matingIntents'

const item = overrides => createMatingDraftItem({
    collectionId: 'collection-a',
    semenBatchId: 'batch-a',
    semenBatchCode: 'LOTE-42',
    allocatedOocytes: '3',
    fertilizedAt: '2026-10-09T13:00:00.000Z',
    method: 'IVF',
    ...overrides,
})

describe('Mating command intentions', () => {
    test('creates stable UUIDv7 batch, item and Mating identities', () => {
        const draft = item()
        const intent = createMatingBatchIntent({
            items: [draft],
            collectedAt: '2026-10-09T12:00:00.000Z',
        })

        expect(validate(draft.itemId)).toBe(true)
        expect(version(draft.itemId)).toBe(7)
        expect(validate(draft.matingId)).toBe(true)
        expect(version(draft.matingId)).toBe(7)
        expect(version(intent.payload.batchId)).toBe(7)
        expect(intent.idempotencyKey).toBe(intent.payload.batchId)
        expect(intent.payload.items[0]).toEqual({
            itemId: draft.itemId,
            id: draft.matingId,
            collectionId: 'collection-a',
            semenBatchId: 'batch-a',
            allocatedOocytes: 3,
            fertilizedAt: '2026-10-09T13:00:00.000Z',
            method: 'IVF',
            responsibleProfessionalId: null,
        })
    })

    test('keeps the same frozen intention for an ambiguous retry', () => {
        const draft = item()
        const prepared = createMatingBatchIntent({
            items: [draft],
            collectedAt: '2026-10-09T12:00:00.000Z',
        })
        const sent = markMatingBatchIntentSent(prepared)

        expect(sent.idempotencyKey).toBe(prepared.idempotencyKey)
        expect(sent.payload).toBe(prepared.payload)
        expect(sent.payload.items[0].itemId).toBe(draft.itemId)
        expect(sent.payload.items[0].id).toBe(draft.matingId)
    })

    test('creates new IDs before editing a previously sent intention', () => {
        const original = item()
        const renewed = renewMatingDraftItems([original])

        expect(renewed[0].itemId).not.toBe(original.itemId)
        expect(renewed[0].matingId).not.toBe(original.matingId)
        expect(renewed[0].semenBatchId).toBe(original.semenBatchId)

        const first = createMatingBatchIntent({
            items: [original], collectedAt: '2026-10-09T12:00:00Z',
        })
        const second = createMatingBatchIntent({
            items: renewed, collectedAt: '2026-10-09T12:00:00Z',
        })
        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
    })

    test('preserves item identities while editing before the first send', () => {
        const original = item()
        const changed = updateMatingDraftItem(original, {
            allocatedOocytes: '2',
        })

        expect(changed).toMatchObject({
            itemId: original.itemId,
            matingId: original.matingId,
            allocatedOocytes: '2',
        })
    })

    test('validates positive allocation and fertilization timing', () => {
        expect(() => createMatingBatchIntent({
            items: [item({ allocatedOocytes: '0' })],
            collectedAt: '2026-10-09T12:00:00Z',
        })).toThrow(TypeError)
        expect(() => createMatingBatchIntent({
            items: [item({ fertilizedAt: '2026-10-09T11:59:59Z' })],
            collectedAt: '2026-10-09T12:00:00Z',
        })).toThrow(TypeError)
    })
})
