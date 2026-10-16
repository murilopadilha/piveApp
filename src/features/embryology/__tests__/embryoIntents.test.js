import { validate, version } from 'uuid'

import {
    createOpenEmbryoHoldIntent,
    createReleaseEmbryoHoldIntent,
    createEmbryoBatchIntent,
    createEmbryoDraftItem,
    EMBRYO_IDENTIFIED_BEFORE_FERTILIZATION,
    markEmbryoHoldIntentSent,
    markEmbryoBatchIntentSent,
    normalizeEmbryoHoldType,
    renewEmbryoDraftItems,
    updateEmbryoDraftItem,
} from '../embryoIntents'

const fertilizedAt = '2026-10-11T10:00:00.000Z'
const createIdentificationIntent = items => createEmbryoBatchIntent(items, {
    fertilizedAt,
})

describe('Embryo identification intentions', () => {
    test('creates stable UUIDv7 identities and a matching idempotency key', () => {
        const item = createEmbryoDraftItem({
            matingId: 'mating-a',
            humanCode: ' EMB-001 ',
            identifiedAt: '2026-10-11T10:00:00Z',
        })
        const intent = markEmbryoBatchIntentSent(
            createIdentificationIntent([item])
        )

        expect(validate(intent.idempotencyKey)).toBe(true)
        expect(version(intent.idempotencyKey)).toBe(7)
        expect(version(intent.payload.items[0].itemId)).toBe(7)
        expect(version(intent.payload.items[0].id)).toBe(7)
        expect(intent.idempotencyKey).toBe(intent.payload.batchId)
        expect(intent.payload.items[0]).toMatchObject({
            matingId: 'mating-a',
            humanCode: 'EMB-001',
            ownerId: null,
        })
        expect(intent.payload).not.toHaveProperty('expectedMatingVersion')
    })

    test('preserves the same object, IDs and payload for retry', () => {
        const intent = markEmbryoBatchIntentSent(createIdentificationIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a',
                humanCode: 'EMB-001',
            }),
        ]))
        const retry = intent

        expect(retry).toBe(intent)
        expect(retry.payload).toBe(intent.payload)
        expect(retry.idempotencyKey).toBe(intent.idempotencyKey)
    })

    test('renews item and Embryo IDs before editing a sent intention', () => {
        const firstItem = createEmbryoDraftItem({
            matingId: 'mating-a', humanCode: 'EMB-001',
        })
        const first = createIdentificationIntent([firstItem])
        const renewedItem = updateEmbryoDraftItem(
            renewEmbryoDraftItems([firstItem])[0],
            { humanCode: 'EMB-002' }
        )
        const second = createIdentificationIntent([renewedItem])

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.items[0].itemId)
            .not.toBe(first.payload.items[0].itemId)
        expect(second.payload.items[0].id)
            .not.toBe(first.payload.items[0].id)
    })

    test('enforces one to 200 items and the humanCode contract', () => {
        expect(() => createIdentificationIntent([])).toThrow()
        expect(() => createIdentificationIntent(Array.from(
            { length: 201 },
            () => createEmbryoDraftItem({ matingId: 'mating-a', humanCode: 'X' })
        ))).toThrow()
        expect(() => createIdentificationIntent([
            createEmbryoDraftItem({ matingId: 'mating-a', humanCode: '' }),
        ])).toThrow()
        expect(() => createIdentificationIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a', humanCode: 'x'.repeat(161),
            }),
        ])).toThrow()
    })

    test('preserves invalid timestamp validation', () => {
        expect(() => createIdentificationIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a',
                humanCode: 'EMB-001',
                identifiedAt: 'not-a-timestamp',
            }),
        ])).toThrow('matingId and identifiedAt are required.')
    })

    test('blocks identification before fertilization by structured code', () => {
        expect(() => createIdentificationIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a',
                humanCode: 'EMB-001',
                identifiedAt: '2026-10-11T09:59:59.999Z',
            }),
        ])).toThrow(expect.objectContaining({
            code: EMBRYO_IDENTIFIED_BEFORE_FERTILIZATION,
        }))
    })

    test.each([
        '2026-10-11T10:00:00.000Z',
        '2026-10-11T10:00:00.001Z',
    ])('allows identification at or after fertilization: %s', (identifiedAt) => {
        const intent = createIdentificationIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a',
                humanCode: 'EMB-001',
                identifiedAt,
            }),
        ])

        expect(intent.payload.items[0].identifiedAt)
            .toBe(identifiedAt)
    })

    test('compares instants temporally instead of comparing timestamp strings', () => {
        const intent = createEmbryoBatchIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a',
                humanCode: 'EMB-001',
                identifiedAt: '2026-10-11T07:00:00-03:00',
            }),
        ], { fertilizedAt: '2026-10-11T10:00:00Z' })

        expect(intent.payload.items[0].identifiedAt)
            .toBe('2026-10-11T07:00:00-03:00')
    })
})

describe('Embryo hold command intentions', () => {
    test('creates independent stable UUIDv7 hold ID and idempotency key', () => {
        const intent = markEmbryoHoldIntentSent(createOpenEmbryoHoldIntent({
            embryoId: 'embryo-a',
            type: ' quality_review ',
            reason: ' Review required ',
        }))

        expect(intent.holdId).toBe(intent.payload.id)
        expect(intent.idempotencyKey).not.toBe(intent.holdId)
        expect(intent.holdId.slice(14, 15)).toBe('7')
        expect(intent.idempotencyKey.slice(14, 15)).toBe('7')
        expect(intent.payload).toEqual({
            id: intent.holdId,
            type: 'QUALITY_REVIEW',
            reason: 'Review required',
        })
        expect(intent.sent).toBe(true)
    })

    test('creates a release intention with its own stable key', () => {
        const intent = markEmbryoHoldIntentSent(createReleaseEmbryoHoldIntent({
            embryoId: 'embryo-a',
            holdId: 'hold-a',
            reason: ' Released after review ',
        }))

        expect(intent).toMatchObject({
            embryoId: 'embryo-a',
            holdId: 'hold-a',
            sent: true,
            payload: { reason: 'Released after review' },
        })
        expect(intent.idempotencyKey.slice(14, 15)).toBe('7')
    })

    test('validates the free operational code without a catalog', () => {
        expect(normalizeEmbryoHoldType('custom_42')).toBe('CUSTOM_42')
        expect(() => normalizeEmbryoHoldType('')).toThrow(TypeError)
        expect(() => normalizeEmbryoHoldType('42_CUSTOM')).toThrow(TypeError)
        expect(() => normalizeEmbryoHoldType('INVALID-CODE')).toThrow(TypeError)
        expect(() => normalizeEmbryoHoldType(`A${'B'.repeat(48)}`)).toThrow(TypeError)
    })

    test('requires open and release reasons within the backend maximum', () => {
        expect(() => createOpenEmbryoHoldIntent({
            embryoId: 'embryo-a', type: 'CUSTOM', reason: '',
        })).toThrow(TypeError)
        expect(() => createOpenEmbryoHoldIntent({
            embryoId: 'embryo-a', type: 'CUSTOM', reason: 'x'.repeat(501),
        })).toThrow(TypeError)
        expect(() => createReleaseEmbryoHoldIntent({
            embryoId: 'embryo-a', holdId: 'hold-a', reason: ' ',
        })).toThrow(TypeError)
        expect(() => createReleaseEmbryoHoldIntent({
            embryoId: 'embryo-a', holdId: 'hold-a', reason: 'x'.repeat(501),
        })).toThrow(TypeError)
    })

    test('creates new identities for an edited post-send intention', () => {
        const first = createOpenEmbryoHoldIntent({
            embryoId: 'embryo-a', type: 'CUSTOM', reason: 'First',
        })
        const second = createOpenEmbryoHoldIntent({
            embryoId: 'embryo-a', type: 'CUSTOM', reason: 'Second',
        })

        expect(second.holdId).not.toBe(first.holdId)
        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
    })
})
