import { validate, version } from 'uuid'

import {
    createCloseRecipientCycleIntent,
    createOpenRecipientCycleIntent,
} from '../recipientCycleIntents'

describe('RecipientCycle command intentions', () => {
    test('creates stable UUIDv7 open identity, key and optional null protocol', () => {
        const intent = createOpenRecipientCycleIntent({
            recipientAnimalId: 'animal-a',
            openedOn: '2026-10-11',
            notes: ' Observed ',
        })

        expect(validate(intent.idempotencyKey)).toBe(true)
        expect(version(intent.idempotencyKey)).toBe(7)
        expect(validate(intent.payload.id)).toBe(true)
        expect(version(intent.payload.id)).toBe(7)
        expect(intent.payload).toMatchObject({
            recipientAnimalId: 'animal-a', protocolVersionId: null,
            openedOn: '2026-10-11', notes: 'Observed',
        })
        expect(intent.payload).not.toHaveProperty('recipientRole')
    })

    test('same intention preserves key, ID and payload while a new one changes IDs', () => {
        const fields = { recipientAnimalId: 'animal-a', openedOn: '2026-10-11' }
        const first = createOpenRecipientCycleIntent(fields)
        const retry = first
        const second = createOpenRecipientCycleIntent(fields)

        expect(retry).toBe(first)
        expect(retry.idempotencyKey).toBe(first.idempotencyKey)
        expect(retry.payload).toBe(first.payload)
        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.id).not.toBe(first.payload.id)
    })

    test('close preserves expectedVersion in a stable intention', () => {
        const intent = createCloseRecipientCycleIntent({
            recipientCycleId: 'cycle-a', expectedVersion: 4,
            closedOn: '2026-10-12', reason: ' Completed ',
        })

        expect(version(intent.idempotencyKey)).toBe(7)
        expect(intent).toMatchObject({
            recipientCycleId: 'cycle-a',
            payload: { expectedVersion: 4, closedOn: '2026-10-12', reason: 'Completed' },
        })
        expect(intent.payload).not.toHaveProperty('status')
    })
})
