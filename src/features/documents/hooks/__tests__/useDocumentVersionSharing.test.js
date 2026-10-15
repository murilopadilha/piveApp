import { act, renderHook, waitFor } from '@testing-library/react-native'

import { shareKnownDocumentVersion } from '../../documentSharing'
import { useDocumentVersionSharing } from '../useDocumentVersionSharing'

jest.mock('../../documentSharing', () => ({
    shareKnownDocumentVersion: jest.fn(),
}))

const version = {
    id: 'version-a',
    documentId: 'document-a',
    originalFileName: 'evidence.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 3,
}

afterEach(() => jest.clearAllMocks())

describe('M7B2A document sharing lifecycle hook', () => {
    test('allows only one operation and never stores bytes in hook state', async () => {
        let resolveShare
        shareKnownDocumentVersion.mockImplementation(() => new Promise(resolve => {
            resolveShare = resolve
        }))
        const { result, unmount } = renderHook(() => useDocumentVersionSharing({
            organizationId: 'organization-a',
            documentId: 'document-a',
        }))

        let first
        await act(async () => {
            first = result.current.openOrShare(version)
            await Promise.resolve()
        })
        expect(result.current.isBusy).toBe(true)
        expect(result.current.busyVersionId).toBe('version-a')
        expect(result.current).not.toHaveProperty('bytes')
        await expect(result.current.openOrShare({ ...version, id: 'version-b' }))
            .resolves.toBe(false)
        expect(shareKnownDocumentVersion).toHaveBeenCalledTimes(1)

        await act(async () => {
            resolveShare(true)
            await first
        })
        expect(result.current.isBusy).toBe(false)
        unmount()
    })

    test('cancels and rejects sharing when Organization changes', async () => {
        let capturedSignal
        shareKnownDocumentVersion.mockImplementation(({ signal }) => {
            capturedSignal = signal
            return new Promise((resolve, reject) => {
                signal.addEventListener('abort', () => reject({ kind: 'canceled' }))
            })
        })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useDocumentVersionSharing({
                organizationId,
                documentId: 'document-a',
            }),
            { initialProps: { organizationId: 'organization-a' } }
        )

        await act(async () => {
            void result.current.openOrShare(version)
            await Promise.resolve()
        })
        rerender({ organizationId: 'organization-b' })

        await waitFor(() => expect(capturedSignal.aborted).toBe(true))
        await waitFor(() => expect(result.current.error).toEqual({
            code: 'DOCUMENT_ORGANIZATION_CHANGED',
        }))
        expect(result.current.isBusy).toBe(false)
        unmount()
    })

    test('refetches metadata for not found and size mismatch only', async () => {
        const refreshMetadata = jest.fn(() => Promise.resolve())
        shareKnownDocumentVersion
            .mockRejectedValueOnce({ code: 'DOCUMENT_NOT_FOUND' })
            .mockRejectedValueOnce({ code: 'DOCUMENT_BINARY_SIZE_MISMATCH' })
        const { result, unmount } = renderHook(() => useDocumentVersionSharing({
            organizationId: 'organization-a',
            documentId: 'document-a',
            refreshMetadata,
        }))

        await act(async () => {
            await result.current.openOrShare(version)
        })
        await act(async () => {
            await result.current.openOrShare(version)
        })
        expect(refreshMetadata).toHaveBeenCalledTimes(2)
        unmount()
    })

    test('keeps the original binary error when metadata refresh also fails', async () => {
        const refreshMetadata = jest.fn(() => Promise.reject(
            new Error('metadata refresh failed')
        ))
        shareKnownDocumentVersion.mockRejectedValueOnce({
            code: 'DOCUMENT_NOT_FOUND',
        })
        const { result, unmount } = renderHook(() => useDocumentVersionSharing({
            organizationId: 'organization-a',
            documentId: 'document-a',
            refreshMetadata,
        }))

        await act(async () => {
            await expect(result.current.openOrShare(version)).resolves.toBe(false)
        })
        expect(result.current.error).toEqual({ code: 'DOCUMENT_NOT_FOUND' })
        expect(refreshMetadata).toHaveBeenCalledTimes(1)
        unmount()
    })

    test('aborts the target request when the screen unmounts', async () => {
        let capturedSignal
        shareKnownDocumentVersion.mockImplementation(({ signal }) => {
            capturedSignal = signal
            return new Promise(() => undefined)
        })
        const { result, unmount } = renderHook(() => useDocumentVersionSharing({
            organizationId: 'organization-a',
            documentId: 'document-a',
        }))

        await act(async () => {
            void result.current.openOrShare(version)
            await Promise.resolve()
        })
        unmount()
        expect(capturedSignal.aborted).toBe(true)
    })
})
