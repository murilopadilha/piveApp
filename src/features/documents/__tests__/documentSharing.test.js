import { shareKnownDocumentVersion } from '../documentSharing'

const version = {
    id: 'version-a',
    documentId: 'document-a',
    versionNumber: 1,
    originalFileName: 'evidence.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 3,
    checksum: 'a'.repeat(64),
    uploadedAt: '2026-10-14T10:00:00Z',
}

const dependencies = (overrides = {}) => ({
    organizationId: 'organization-a',
    documentId: 'document-a',
    version,
    getOrganizationId: jest.fn(() => 'organization-a'),
    download: jest.fn(() => Promise.resolve(Uint8Array.from([1, 2, 3]).buffer)),
    isSharingAvailable: jest.fn(() => Promise.resolve(true)),
    share: jest.fn(() => Promise.resolve()),
    writeTemporaryFile: jest.fn(() => Promise.resolve(
        'file:///cache/bovina-documents/random.pdf'
    )),
    removeTemporaryFile: jest.fn(() => Promise.resolve(true)),
    onCleanupFailure: jest.fn(),
    ...overrides,
})

describe('M7B2A download and native share orchestration', () => {
    test('uses authoritative metadata, shares with original MIME and always cleans up', async () => {
        const input = dependencies()

        await expect(shareKnownDocumentVersion(input)).resolves.toBe(true)
        expect(input.download).toHaveBeenCalledWith({
            documentId: 'document-a',
            versionId: 'version-a',
            signal: undefined,
        })
        expect(input.writeTemporaryFile).toHaveBeenCalledWith({
            buffer: expect.any(ArrayBuffer),
            originalFileName: 'evidence.pdf',
        })
        expect(input.share).toHaveBeenCalledWith(
            'file:///cache/bovina-documents/random.pdf',
            {
                mimeType: 'application/pdf',
                dialogTitle: 'Abrir ou compartilhar evidence.pdf',
            }
        )
        expect(input.removeTemporaryFile).toHaveBeenCalledWith({
            uri: 'file:///cache/bovina-documents/random.pdf',
        })
    })

    test('fails before download when native sharing is unavailable', async () => {
        const input = dependencies({
            isSharingAvailable: jest.fn(() => Promise.resolve(false)),
        })

        await expect(shareKnownDocumentVersion(input)).rejects.toMatchObject({
            code: 'DOCUMENT_SHARING_UNAVAILABLE',
        })
        expect(input.download).not.toHaveBeenCalled()
        expect(input.writeTemporaryFile).not.toHaveBeenCalled()
    })

    test('fails closed on size mismatch without writing or sharing', async () => {
        const input = dependencies({
            download: jest.fn(() => Promise.resolve(Uint8Array.from([1, 2]).buffer)),
        })

        await expect(shareKnownDocumentVersion(input)).rejects.toMatchObject({
            code: 'DOCUMENT_BINARY_SIZE_MISMATCH',
        })
        expect(input.writeTemporaryFile).not.toHaveBeenCalled()
        expect(input.share).not.toHaveBeenCalled()
    })

    test('cleans up after a sharing rejection', async () => {
        const input = dependencies({
            share: jest.fn(() => Promise.reject(new Error('share failed'))),
        })

        await expect(shareKnownDocumentVersion(input)).rejects.toThrow('share failed')
        expect(input.removeTemporaryFile).toHaveBeenCalledTimes(1)
    })

    test('does not hide success when cleanup is best-effort', async () => {
        const input = dependencies({
            removeTemporaryFile: jest.fn(() => Promise.resolve(false)),
        })

        await expect(shareKnownDocumentVersion(input)).resolves.toBe(true)
        expect(input.onCleanupFailure).toHaveBeenCalledTimes(1)
    })

    test('blocks Organization A content when tenant changes before response', async () => {
        let currentOrganization = 'organization-a'
        const input = dependencies({
            getOrganizationId: () => currentOrganization,
            download: jest.fn(async () => {
                currentOrganization = 'organization-b'
                return Uint8Array.from([1, 2, 3]).buffer
            }),
        })

        await expect(shareKnownDocumentVersion(input)).rejects.toMatchObject({
            code: 'DOCUMENT_ORGANIZATION_CHANGED',
        })
        expect(input.writeTemporaryFile).not.toHaveBeenCalled()
        expect(input.share).not.toHaveBeenCalled()
    })

    test('blocks Organization A content after response and before temporary write', async () => {
        const organizations = ['organization-a', 'organization-a', 'organization-b']
        const input = dependencies({
            getOrganizationId: () => organizations.shift() ?? 'organization-b',
        })

        await expect(shareKnownDocumentVersion(input)).rejects.toMatchObject({
            code: 'DOCUMENT_ORGANIZATION_CHANGED',
        })
        expect(input.writeTemporaryFile).not.toHaveBeenCalled()
        expect(input.share).not.toHaveBeenCalled()
    })

    test('cleans but never shares when tenant changes after file creation', async () => {
        let currentOrganization = 'organization-a'
        const input = dependencies({
            getOrganizationId: () => currentOrganization,
            writeTemporaryFile: jest.fn(async () => {
                currentOrganization = 'organization-b'
                return 'file:///cache/bovina-documents/random.pdf'
            }),
        })

        await expect(shareKnownDocumentVersion(input)).rejects.toMatchObject({
            code: 'DOCUMENT_ORGANIZATION_CHANGED',
        })
        expect(input.share).not.toHaveBeenCalled()
        expect(input.removeTemporaryFile).toHaveBeenCalledTimes(1)
    })
})
