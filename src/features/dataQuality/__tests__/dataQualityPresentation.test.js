import {
    getDataQualityErrorMessage,
    getDataQualitySeverityTone,
} from '../dataQualityPresentation'

describe('M9A Data Quality presentation', () => {
    test('uses visual tones without closing the severity contract', () => {
        expect(getDataQualitySeverityTone('INFO')).toBe('info')
        expect(getDataQualitySeverityTone('ERROR')).toBe('error')
        expect(getDataQualitySeverityTone('FUTURE')).toBe('neutral')
    })

    test('uses structured Problem Details without parsing detail', () => {
        expect(getDataQualityErrorMessage({
            kind: 'validation',
            code: 'INVALID_PAGE',
            detail: 'internal words must not drive UI logic',
        })).toBe('A busca ou página solicitada não é válida.')
        expect(getDataQualityErrorMessage({ kind: 'canceled' })).toBeNull()
    })
})
