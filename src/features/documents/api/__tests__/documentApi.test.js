import targetApiClient from '../../../../api/target/client'
import {
    getDocumentById,
    getDocuments,
    getDocumentVersions,
    getDocumentVersionContent,
    mapDocument,
    mapDocumentVersion,
    normalizeDocumentPageParams,
} from '../documentApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}))

const document = {
    id: 'document-a',
    typeCode: 'SOURCE_EVIDENCE',
    status: 'ACTIVE',
    currentVersionId: 'version-b',
    version: 2,
    createdAt: '2026-10-14T10:00:00Z',
}

const version = {
    id: 'version-b',
    documentId: 'document-a',
    versionNumber: 2,
    originalFileName: 'evidence.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4096,
    checksum: 'a'.repeat(64),
    uploadedAt: '2026-10-14T11:00:00Z',
}

afterEach(() => jest.clearAllMocks())

describe('M7B1 target Document API', () => {
    test('lists Documents using page and size only', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [document], page: 0, size: 20 },
        })

        await expect(getDocuments({ page: 0, size: 20, signal }))
            .resolves.toEqual({ items: [document], page: 0, size: 20 })
        expect(targetApiClient.get).toHaveBeenCalledWith('/documents', {
            params: { page: 0, size: 20 },
            signal,
        })
        expect(normalizeDocumentPageParams()).toEqual({ page: 0, size: 20 })
        expect(normalizeDocumentPageParams()).not.toHaveProperty('q')
        expect(normalizeDocumentPageParams()).not.toHaveProperty('type')
        expect(normalizeDocumentPageParams()).not.toHaveProperty('status')
        expect(targetApiClient.post).not.toHaveBeenCalled()
        expect(targetApiClient.put).not.toHaveBeenCalled()
    })

    test('loads detail by stable ID and preserves currentVersionId', async () => {
        targetApiClient.get.mockResolvedValueOnce({ data: document })

        await expect(getDocumentById({ documentId: 'document/a' }))
            .resolves.toEqual(document)
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/documents/document%2Fa',
            { signal: undefined }
        )
        expect(mapDocument(document)).not.toHaveProperty('owner')
        expect(mapDocument(document)).not.toHaveProperty('complianceStatus')
    })

    test('loads immutable version metadata in backend order', async () => {
        const older = { ...version, id: 'version-a', versionNumber: 1 }
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [version, older], page: 0, size: 20 },
        })

        await expect(getDocumentVersions({
            documentId: 'document-a',
            page: 0,
            size: 20,
        })).resolves.toEqual({
            items: [version, older],
            page: 0,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/documents/document-a/versions',
            { params: { page: 0, size: 20 }, signal: undefined }
        )
        expect(mapDocumentVersion(version)).toEqual(version)
        expect(targetApiClient.get.mock.calls[0][0]).not.toContain('/content')
    })

    test('normalizes wrong-tenant DOCUMENT_NOT_FOUND', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 404,
                data: { code: 'DOCUMENT_NOT_FOUND', traceId: 'trace-a' },
            },
        })

        await expect(getDocumentById({ documentId: 'document-a' }))
            .rejects.toMatchObject({
                kind: 'notFound',
                code: 'DOCUMENT_NOT_FOUND',
                traceId: 'trace-a',
            })
    })

    test('downloads exact immutable content through target Axios as arraybuffer', async () => {
        const signal = new AbortController().signal
        const bytes = Uint8Array.from([0, 1, 2, 255]).buffer
        targetApiClient.get.mockResolvedValueOnce({ data: bytes })

        const result = await getDocumentVersionContent({
            documentId: 'document/a',
            versionId: 'version/b',
            signal,
        })

        expect(result).toBe(bytes)
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/documents/document%2Fa/versions/version%2Fb/content',
            { responseType: 'arraybuffer', signal }
        )
        expect(targetApiClient.post).not.toHaveBeenCalled()
        expect(targetApiClient.put).not.toHaveBeenCalled()
    })

    test('accepts an ArrayBuffer view but rejects empty or malformed content', async () => {
        const source = Uint8Array.from([9, 8, 7, 6])
        targetApiClient.get.mockResolvedValueOnce({
            data: new Uint8Array(source.buffer, 1, 2),
        })

        await expect(getDocumentVersionContent({
            documentId: 'document-a',
            versionId: 'version-a',
        })).resolves.toEqual(Uint8Array.from([8, 7]).buffer)

        targetApiClient.get.mockResolvedValueOnce({ data: new ArrayBuffer(0) })
        await expect(getDocumentVersionContent({
            documentId: 'document-a',
            versionId: 'version-a',
        })).rejects.toMatchObject({ code: 'INVALID_DOCUMENT_BINARY' })

        targetApiClient.get.mockResolvedValueOnce({ data: 'not-binary' })
        await expect(getDocumentVersionContent({
            documentId: 'document-a',
            versionId: 'version-a',
        })).rejects.toMatchObject({ code: 'INVALID_DOCUMENT_BINARY' })
    })

    test('decodes binary Problem Details returned by an arraybuffer request', async () => {
        const problem = {
            type: 'https://bovina.local/problems/not-found',
            title: 'Not found',
            status: 404,
            detail: 'Document not found',
            code: 'DOCUMENT_NOT_FOUND',
            traceId: 'trace-a',
        }
        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 404,
                headers: { 'content-type': 'application/problem+json' },
                data: Uint8Array.from(Buffer.from(
                    JSON.stringify(problem),
                    'utf8'
                )).buffer,
            },
        })

        await expect(getDocumentVersionContent({
            documentId: 'document-a',
            versionId: 'version-a',
        })).rejects.toMatchObject({
            kind: 'notFound',
            status: 404,
            code: 'DOCUMENT_NOT_FOUND',
            traceId: 'trace-a',
        })
    })

    test('does not parse non-JSON binary failures as Problem Details', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 500,
                headers: { 'content-type': 'application/octet-stream' },
                data: Uint8Array.from([1, 2, 3]).buffer,
            },
        })

        await expect(getDocumentVersionContent({
            documentId: 'document-a',
            versionId: 'version-a',
        })).rejects.toMatchObject({
            kind: 'unexpected',
            status: 500,
            code: null,
        })
    })

    test('rejects invalid pages and malformed DTOs before use', () => {
        expect(() => normalizeDocumentPageParams({ page: -1, size: 20 }))
            .toThrow(TypeError)
        expect(() => normalizeDocumentPageParams({ page: 0, size: 101 }))
            .toThrow(TypeError)
        expect(() => mapDocument({ ...document, version: -1 }))
            .toThrow(TypeError)
        expect(() => mapDocumentVersion({ ...version, sizeBytes: -1 }))
            .toThrow(TypeError)
    })
})
