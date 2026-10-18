import {
    cleanupDocumentTemporaryFiles,
    createDocumentTemporaryFileUri,
    encodeDocumentBinaryAsBase64,
    getDocumentTemporaryDirectory,
    getSafeDocumentExtension,
    normalizeDocumentBinary,
    removeDocumentTemporaryFile,
    validateDocumentBinarySize,
    writeDocumentTemporaryFile,
} from '../documentBinary'

const fileSystem = () => ({
    cacheDirectory: 'file:///cache/',
    EncodingType: { Base64: 'base64' },
    makeDirectoryAsync: jest.fn(() => Promise.resolve()),
    writeAsStringAsync: jest.fn(() => Promise.resolve()),
    deleteAsync: jest.fn(() => Promise.resolve()),
})

describe('M7B2A temporary document binary handling', () => {
    test('normalizes the real ArrayBuffer representation and exact views', () => {
        const buffer = Uint8Array.from([1, 2, 3]).buffer
        expect(normalizeDocumentBinary(buffer)).toBe(buffer)

        const view = new Uint8Array(Uint8Array.from([9, 1, 2, 8]).buffer, 1, 2)
        expect(new Uint8Array(normalizeDocumentBinary(view)))
            .toEqual(Uint8Array.from([1, 2]))
        expect(() => normalizeDocumentBinary(new ArrayBuffer(0)))
            .toThrow(expect.objectContaining({ code: 'INVALID_DOCUMENT_BINARY' }))
        expect(() => normalizeDocumentBinary('AQID'))
            .toThrow(expect.objectContaining({ code: 'INVALID_DOCUMENT_BINARY' }))
    })

    test('validates byte length without assuming Content-Length', () => {
        const buffer = Uint8Array.from([1, 2, 3]).buffer
        expect(validateDocumentBinarySize(buffer, 3)).toBe(buffer)
        expect(() => validateDocumentBinarySize(buffer, 4)).toThrow(
            expect.objectContaining({ code: 'DOCUMENT_BINARY_SIZE_MISMATCH' })
        )
    })

    test('encodes bytes temporarily as base64 for Expo FileSystem', () => {
        const buffer = Uint8Array.from([0, 1, 2, 253, 254, 255]).buffer
        expect(encodeDocumentBinaryAsBase64(buffer)).toBe('AAEC/f7/')
    })

    test.each([
        ['report.PDF', '.pdf'],
        ['archive.tar.gz', '.gz'],
        ['../../secret.pdf', '.pdf'],
        ['name.very-long-extension', ''],
        ['name.pd/f', ''],
        ['name', ''],
        ['.hidden', ''],
    ])('derives only a safe extension from %s', (name, expected) => {
        expect(getSafeDocumentExtension(name)).toBe(expected)
    })

    test('creates an app-controlled path inside only the feature cache', () => {
        const fs = fileSystem()
        const uri = createDocumentTemporaryFileUri({
            originalFileName: '../../private.PDF',
            fileSystem: fs,
            createId: () => '0199f000-0000-7000-8000-000000000001',
        })

        expect(getDocumentTemporaryDirectory(fs))
            .toBe('file:///cache/bovina-documents/')
        expect(uri).toBe(
            'file:///cache/bovina-documents/0199f000-0000-7000-8000-000000000001.pdf'
        )
        expect(uri).not.toContain('private')
        expect(uri).not.toContain('..')
    })

    test('writes and removes only an owned ephemeral file', async () => {
        const fs = fileSystem()
        const uri = await writeDocumentTemporaryFile({
            buffer: Uint8Array.from([1, 2, 3]).buffer,
            originalFileName: 'evidence.pdf',
            fileSystem: fs,
            createId: () => '0199f000-0000-7000-8000-000000000002',
        })

        expect(fs.makeDirectoryAsync).toHaveBeenCalledWith(
            'file:///cache/bovina-documents/',
            { intermediates: true }
        )
        expect(fs.writeAsStringAsync).toHaveBeenCalledWith(
            uri,
            'AQID',
            { encoding: 'base64' }
        )
        await expect(removeDocumentTemporaryFile({ uri, fileSystem: fs }))
            .resolves.toBe(true)
        expect(fs.deleteAsync).toHaveBeenCalledWith(uri, { idempotent: true })
        await expect(removeDocumentTemporaryFile({
            uri: 'file:///cache/unowned.pdf',
            fileSystem: fs,
        })).resolves.toBe(false)
    })

    test('best-effort removes a partially written file when writing fails', async () => {
        const fs = fileSystem()
        fs.writeAsStringAsync.mockRejectedValueOnce(new Error('disk failed'))

        await expect(writeDocumentTemporaryFile({
            buffer: Uint8Array.from([1, 2, 3]).buffer,
            originalFileName: 'evidence.pdf',
            fileSystem: fs,
            createId: () => '0199f000-0000-7000-8000-000000000003',
        })).rejects.toMatchObject({
            code: 'DOCUMENT_TEMPORARY_FILE_WRITE_FAILED',
        })
        expect(fs.deleteAsync).toHaveBeenCalledWith(
            'file:///cache/bovina-documents/0199f000-0000-7000-8000-000000000003.pdf',
            { idempotent: true }
        )
    })

    test('orphan cleanup deletes only the feature-owned directory', async () => {
        const fs = fileSystem()
        await expect(cleanupDocumentTemporaryFiles({ fileSystem: fs }))
            .resolves.toBe(true)
        expect(fs.deleteAsync).toHaveBeenCalledWith(
            'file:///cache/bovina-documents/',
            { idempotent: true }
        )
        expect(fs.deleteAsync).not.toHaveBeenCalledWith(
            'file:///cache/',
            expect.anything()
        )

        fs.deleteAsync.mockRejectedValueOnce(new Error('cleanup failed'))
        await expect(cleanupDocumentTemporaryFiles({ fileSystem: fs }))
            .resolves.toBe(false)
    })
})
