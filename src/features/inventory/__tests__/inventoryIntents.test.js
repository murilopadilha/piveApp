import { validate as validateUuid, version as uuidVersion } from 'uuid'

import { createUuidV7 } from '../../../utils/uuid'
import {
    createInventoryMovementBatchIntent,
    createInventoryMovementIntent,
    markInventoryMovementIntentSent,
    validateInventoryMovement,
} from '../inventoryIntents'

const base = {
    packageId: 'package-a',
    expectedVersion: 3,
    occurredAt: '2026-10-12T11:00:00Z',
    reason: '  operação local  ',
}

describe('M6A movement intentions', () => {
    test.each([
        ['RECEIVE', null, 'location-a'],
        ['STORE', null, 'location-a'],
        ['MOVE', 'location-a', 'location-b'],
        ['WITHDRAW', 'location-a', null],
    ])('creates exact %s semantics', (type, expectedLocationId, destinationId) => {
        const intent = createInventoryMovementIntent({
            ...base, type, expectedLocationId, destinationId,
        })

        expect(validateUuid(intent.payload.id)).toBe(true)
        expect(uuidVersion(intent.payload.id)).toBe(7)
        expect(intent.idempotencyKey).toBe(intent.payload.id)
        expect(intent.payload).toEqual({
            id: intent.idempotencyKey,
            packageId: 'package-a',
            type,
            expectedLocationId,
            destinationId,
            expectedVersion: 3,
            occurredAt: '2026-10-12T11:00:00Z',
            reason: 'operação local',
        })
    })

    test.each([
        ['RECEIVE', 'location-a', 'location-b'],
        ['STORE', null, null],
        ['MOVE', null, 'location-b'],
        ['MOVE', 'location-a', 'location-a'],
        ['WITHDRAW', 'location-a', 'location-b'],
    ])('rejects invalid %s location combinations', (
        type,
        expectedLocationId,
        destinationId
    ) => {
        expect(() => createInventoryMovementIntent({
            ...base, type, expectedLocationId, destinationId,
        })).toThrow(TypeError)
    })

    test('same intention preserves exact key, payload and expected state', () => {
        const intent = createInventoryMovementIntent({
            ...base,
            type: 'MOVE',
            expectedLocationId: 'location-a',
            destinationId: 'location-b',
        })
        const sent = markInventoryMovementIntentSent(intent)

        expect(sent.idempotencyKey).toBe(intent.idempotencyKey)
        expect(sent.payload).toBe(intent.payload)
        expect(sent.payload.expectedVersion).toBe(3)
        expect(sent.payload.expectedLocationId).toBe('location-a')
    })

    test('new intention receives a different key after an edit', () => {
        const first = createInventoryMovementIntent({
            ...base,
            type: 'MOVE',
            expectedLocationId: 'location-a',
            destinationId: 'location-b',
        })
        const second = createInventoryMovementIntent({
            ...base,
            type: 'MOVE',
            expectedLocationId: 'location-a',
            destinationId: 'location-c',
        })

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.destinationId).toBe('location-c')
    })

    test('creates a 1..100 atomic batch identity without changing item IDs', () => {
        const first = createInventoryMovementIntent({
            ...base, type: 'RECEIVE', expectedLocationId: null,
            destinationId: 'location-a',
        }).payload
        const stableMovementId = createUuidV7()
        const second = validateInventoryMovement({
            ...base, id: stableMovementId, type: 'MOVE',
            expectedLocationId: 'location-a', destinationId: 'location-b',
            expectedVersion: 4,
        })
        const batch = createInventoryMovementBatchIntent([first, second])

        expect(validateUuid(batch.payload.batchId)).toBe(true)
        expect(uuidVersion(batch.payload.batchId)).toBe(7)
        expect(batch.idempotencyKey).toBe(batch.payload.batchId)
        expect(batch.payload.items[0].id).toBe(first.id)
        expect(batch.payload.items[1].id).toBe(stableMovementId)
    })

    test('enforces bulk bounds and excludes future movement types', () => {
        expect(() => createInventoryMovementBatchIntent([])).toThrow(TypeError)
        expect(() => createInventoryMovementBatchIntent(
            Array.from({ length: 101 }, () => ({}))
        )).toThrow(TypeError)
        for (const type of ['SHIP', 'RETURN', 'DISPOSE', 'ADJUST']) {
            expect(() => createInventoryMovementIntent({
                ...base,
                type,
                expectedLocationId: null,
                destinationId: 'location-a',
            })).toThrow(TypeError)
        }
    })

    test('validates version, timestamp and optional reason limit', () => {
        expect(() => createInventoryMovementIntent({
            ...base, type: 'STORE', expectedLocationId: null,
            destinationId: 'location-a', expectedVersion: -1,
        })).toThrow(TypeError)
        expect(() => createInventoryMovementIntent({
            ...base, type: 'STORE', expectedLocationId: null,
            destinationId: 'location-a', occurredAt: 'invalid',
        })).toThrow(TypeError)
        expect(() => createInventoryMovementIntent({
            ...base, type: 'STORE', expectedLocationId: null,
            destinationId: 'location-a', reason: 'x'.repeat(501),
        })).toThrow(TypeError)
    })
})
