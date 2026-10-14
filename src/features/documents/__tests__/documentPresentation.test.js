import {
    formatDocumentSize,
    getDocumentErrorMessage,
} from '../documentPresentation'

describe('M7B1 Document presentation', () => {
    test('formats byte metadata without changing the wire value', () => {
        expect(formatDocumentSize(512)).toBe('512 B')
        expect(formatDocumentSize(2048)).toBe('2.0 KiB')
        expect(formatDocumentSize(2 * 1024 * 1024)).toBe('2.0 MiB')
    })

    test('maps structured Problem Details without parsing detail', () => {
        expect(getDocumentErrorMessage({
            kind: 'not_found', code: 'DOCUMENT_NOT_FOUND',
            detail: 'do not parse me',
        })).toBe('Documento não encontrado nesta organização.')
        expect(getDocumentErrorMessage({
            kind: 'validation', code: 'INVALID_PAGE',
        })).toBe('A página solicitada não é válida.')
    })
})
