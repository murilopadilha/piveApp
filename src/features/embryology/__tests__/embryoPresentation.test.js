import {
    getEmbryoCommandErrorMessage,
    getEmbryoErrorMessage,
} from '../embryoPresentation'

describe('M7A Embryo Problem Details presentation', () => {
    test.each([
        'INVALID_HOLD_TYPE',
        'HOLD_REASON_REQUIRED',
        'HOLD_RELEASE_REASON_REQUIRED',
        'EMBRYO_HOLD_NOT_FOUND',
        'EMBRYO_HOLD_MISMATCH',
        'EMBRYO_ON_HOLD',
        'IDEMPOTENCY_KEY_REUSED',
        'COMMAND_IN_PROGRESS',
        'CONSTRAINT_CONFLICT',
        'CONCURRENT_WRITE_CONFLICT',
    ])('maps %s by code without parsing detail', (code) => {
        expect(getEmbryoCommandErrorMessage({
            kind: 'conflict', code, detail: 'untrusted detail',
        })).not.toContain('untrusted detail')
    })

    test('maps pagination and audit-filter errors structurally', () => {
        expect(getEmbryoErrorMessage({
            kind: 'validation', code: 'INVALID_PAGE', detail: 'ignored',
        })).toBe('A página solicitada não é válida.')
        expect(getEmbryoErrorMessage({
            kind: 'validation', code: 'INVALID_AUDIT_FILTER', detail: 'ignored',
        })).toBe('O filtro de auditoria não é válido.')
    })
})
