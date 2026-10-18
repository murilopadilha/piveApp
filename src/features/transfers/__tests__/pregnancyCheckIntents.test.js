import { validate, version } from 'uuid'

import {
    createPregnancyCheckIntent,
    createPregnancyCheckInvalidationIntent,
    getDeviceIanaTimezone,
    isValidIanaTimezone,
    markPregnancyCheckIntentSent,
    PREGNANCY_CHECK_RESULTS,
} from '../pregnancyCheckIntents'

const fields = {
    transferId: 'transfer-a',
    transferPerformedAt: '2026-10-11T12:00:00Z',
    checkedAt: '2026-10-11T12:00:00Z',
    timezone: 'America/Sao_Paulo',
    result: 'PREGNANT',
    methodCode: ' org_method ',
    observations: ' observed ',
    professionalId: 'professional-a',
}

describe('PregnancyCheck command intentions', () => {
    test('creates a one-item atomic UUIDv7 intention and normalizes input', () => {
        const intent = createPregnancyCheckIntent(fields)
        const item = intent.payload.items[0]

        expect(intent.payload.items).toHaveLength(1)
        expect(intent.idempotencyKey).toBe(intent.payload.batchId)
        ;[intent.payload.batchId, item.itemId, item.id].forEach((id) => {
            expect(validate(id)).toBe(true)
            expect(version(id)).toBe(7)
        })
        expect(item).toMatchObject({
            transferId: 'transfer-a',
            checkedAt: '2026-10-11T12:00:00.000Z',
            timezone: 'America/Sao_Paulo',
            result: 'PREGNANT',
            methodCode: 'ORG_METHOD',
            observations: 'observed',
            professionalId: 'professional-a',
            supersedesCheckId: null,
            correctionReason: null,
        })
        expect(intent.payload).not.toHaveProperty('source')
    })

    test('same intention preserves IDs, key and payload while new intention changes them', () => {
        const first = markPregnancyCheckIntentSent(createPregnancyCheckIntent(fields))
        const retry = first
        const second = createPregnancyCheckIntent(fields)

        expect(retry).toBe(first)
        expect(retry.payload).toBe(first.payload)
        expect(retry.idempotencyKey).toBe(first.idempotencyKey)
        expect(retry.payload.items[0].itemId).toBe(first.payload.items[0].itemId)
        expect(retry.payload.items[0].id).toBe(first.payload.items[0].id)
        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.items[0].itemId).not.toBe(first.payload.items[0].itemId)
        expect(second.payload.items[0].id).not.toBe(first.payload.items[0].id)
    })

    test.each(PREGNANCY_CHECK_RESULTS)('accepts the real result %s', result => {
        expect(createPregnancyCheckIntent({ ...fields, result }).payload.items[0].result)
            .toBe(result)
    })

    test.each(['UNKNOWN', 'CALVED', 'ABORTED'])('rejects invented result %s', result => {
        expect(() => createPregnancyCheckIntent({ ...fields, result })).toThrow(TypeError)
    })

    test('accepts checkedAt equality and rejects a check before Transfer', () => {
        expect(() => createPregnancyCheckIntent(fields)).not.toThrow()
        expect(() => createPregnancyCheckIntent({
            ...fields, checkedAt: '2026-10-11T11:59:59Z',
        })).toThrow('checkedAt cannot precede')
    })

    test('requires an IANA timezone without hardcoding a global default', () => {
        expect(isValidIanaTimezone('America/Sao_Paulo')).toBe(true)
        expect(isValidIanaTimezone('BRT')).toBe(false)
        expect(typeof getDeviceIanaTimezone()).toBe('string')
        expect(() => createPregnancyCheckIntent({ ...fields, timezone: 'GMT-3' }))
            .toThrow('valid IANA timezone')
    })

    test('validates free method code without a hardcoded catalog', () => {
        expect(createPregnancyCheckIntent({
            ...fields, methodCode: ' organization_code_7 ',
        }).payload.items[0].methodCode).toBe('ORGANIZATION_CODE_7')
        expect(() => createPregnancyCheckIntent({ ...fields, methodCode: '' }))
            .toThrow(TypeError)
        expect(() => createPregnancyCheckIntent({ ...fields, methodCode: 'invalid code' }))
            .toThrow(TypeError)
        expect(() => createPregnancyCheckIntent({ ...fields, methodCode: `A${'B'.repeat(48)}` }))
            .toThrow(TypeError)
    })

    test('omits blank observations and enforces its backend maximum', () => {
        expect(createPregnancyCheckIntent({
            ...fields, observations: '   ',
        }).payload.items[0].observations).toBeNull()
        expect(() => createPregnancyCheckIntent({
            ...fields, observations: 'a'.repeat(2001),
        })).toThrow(TypeError)
    })

    test('creates append-only correction only with superseded ID and reason', () => {
        const correction = createPregnancyCheckIntent({
            ...fields,
            supersedesCheckId: 'check-old',
            correctionReason: ' Corrected evidence ',
        })

        expect(correction.payload.items[0]).toMatchObject({
            supersedesCheckId: 'check-old',
            correctionReason: 'Corrected evidence',
        })
        expect(() => createPregnancyCheckIntent({
            ...fields, supersedesCheckId: 'check-old', correctionReason: '',
        })).toThrow(TypeError)
    })

    test('creates a stable independent invalidation intention', () => {
        const first = createPregnancyCheckInvalidationIntent({
            checkId: 'check-a', reason: ' Evidence withdrawn ',
        })
        const retry = first
        const next = createPregnancyCheckInvalidationIntent({
            checkId: 'check-a', reason: 'Evidence withdrawn',
        })

        expect(validate(first.idempotencyKey)).toBe(true)
        expect(version(first.idempotencyKey)).toBe(7)
        expect(first.payload).toEqual({ reason: 'Evidence withdrawn' })
        expect(retry).toBe(first)
        expect(next.idempotencyKey).not.toBe(first.idempotencyKey)
    })
})
