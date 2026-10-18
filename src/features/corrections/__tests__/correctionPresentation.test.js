import {
    formatCorrectionStatus,
    formatHistoricalSemantics,
    getCorrectionErrorMessage,
} from '../correctionPresentation'
import {
    CORRECTION_PERMISSIONS,
    hasCorrectionPermission,
} from '../correctionPermissions'

describe('M7C1 Correction presentation and permissions', () => {
    test('pretty-prints valid JSON without interpreting its domain meaning', () => {
        expect(formatHistoricalSemantics('{"semantics":"review"}'))
            .toBe('{' + '\n  "semantics": "review"' + '\n}')
    })

    test('falls back to the exact historical string when JSON parsing fails', () => {
        expect(formatHistoricalSemantics('historical text { invalid'))
            .toBe('historical text { invalid')
    })

    test('uses neutral factual labels and preserves unknown backend statuses', () => {
        expect(formatCorrectionStatus('REQUESTED')).toBe('Solicitação registrada')
        expect(formatCorrectionStatus('REJECTED')).toBe('Rejeitada')
        expect(formatCorrectionStatus('APPLIED')).toBe('APPLIED')
    })

    test('requires only compliance:read', () => {
        expect(CORRECTION_PERMISSIONS).toEqual({ READ: 'compliance:read' })
        expect(hasCorrectionPermission(
            { permissions: ['compliance:read'] },
            CORRECTION_PERMISSIONS.READ
        )).toBe(true)
        expect(hasCorrectionPermission(
            { permissions: ['lineage:correct', 'master-data:read'] },
            CORRECTION_PERMISSIONS.READ
        )).toBe(false)
    })

    test('uses the same safe message for missing and wrong-tenant correction', () => {
        expect(getCorrectionErrorMessage({
            kind: 'notFound',
            code: 'CORRECTION_SUBJECT_NOT_FOUND',
        })).toBe('Solicitação de correção não encontrada nesta organização.')
    })
})
