import { validate, version } from 'uuid'

import {
    createEmbryoBatchIntent,
    createEmbryoDraftItem,
    markEmbryoBatchIntentSent,
    renewEmbryoDraftItems,
    updateEmbryoDraftItem,
} from '../embryoIntents'

describe('Embryo identification intentions', () => {
    test('creates stable UUIDv7 identities and a matching idempotency key', () => {
        const item = createEmbryoDraftItem({
            matingId: 'mating-a',
            humanCode: ' EMB-001 ',
            identifiedAt: '2026-10-11T10:00:00Z',
        })
        const intent = markEmbryoBatchIntentSent(
            createEmbryoBatchIntent([item])
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
        const intent = markEmbryoBatchIntentSent(createEmbryoBatchIntent([
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
        const first = createEmbryoBatchIntent([firstItem])
        const renewedItem = updateEmbryoDraftItem(
            renewEmbryoDraftItems([firstItem])[0],
            { humanCode: 'EMB-002' }
        )
        const second = createEmbryoBatchIntent([renewedItem])

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.items[0].itemId)
            .not.toBe(first.payload.items[0].itemId)
        expect(second.payload.items[0].id)
            .not.toBe(first.payload.items[0].id)
    })

    test('enforces one to 200 items and the humanCode contract', () => {
        expect(() => createEmbryoBatchIntent([])).toThrow()
        expect(() => createEmbryoBatchIntent(Array.from(
            { length: 201 },
            () => createEmbryoDraftItem({ matingId: 'mating-a', humanCode: 'X' })
        ))).toThrow()
        expect(() => createEmbryoBatchIntent([
            createEmbryoDraftItem({ matingId: 'mating-a', humanCode: '' }),
        ])).toThrow()
        expect(() => createEmbryoBatchIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a', humanCode: 'x'.repeat(161),
            }),
        ])).toThrow()
    })

    test('does not invent a fertilization-time constraint for identifiedAt', () => {
        const intent = createEmbryoBatchIntent([
            createEmbryoDraftItem({
                matingId: 'mating-a',
                humanCode: 'EMB-001',
                identifiedAt: '2020-01-01T00:00:00Z',
            }),
        ])

        expect(intent.payload.items[0].identifiedAt)
            .toBe('2020-01-01T00:00:00Z')
    })
})
