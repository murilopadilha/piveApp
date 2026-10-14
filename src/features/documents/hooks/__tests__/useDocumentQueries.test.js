import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    getDocumentById,
    getDocuments,
    getDocumentVersions,
} from '../../api/documentApi'
import {
    documentDetailQueryKey,
    documentsQueryKey,
    documentVersionsQueryKey,
    getNextDocumentPageParam,
    useDocumentDetailQuery,
    useDocumentsQuery,
    useDocumentVersionsQuery,
} from '../useDocumentQueries'

jest.mock('../../api/documentApi', () => ({
    DEFAULT_DOCUMENT_PAGE_SIZE: 20,
    getDocumentById: jest.fn(),
    getDocuments: jest.fn(),
    getDocumentVersions: jest.fn(),
}))
jest.mock('../../../auth/SessionContext', () => ({
    useSession: () => ({ expireSession: jest.fn() }),
}))

const createWrapper = queryClient => function Wrapper({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

const createTestQueryClient = () => {
    const queryClient = createTargetQueryClient()
    queryClient.setDefaultOptions({
        ...queryClient.getDefaultOptions(),
        queries: {
            ...queryClient.getDefaultOptions().queries,
            gcTime: Infinity,
        },
    })
    return queryClient
}

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('M7B1 Document queries', () => {
    test('uses only Organization-scoped query identities', () => {
        expect(documentsQueryKey({
            organizationId: 'organization-a',
            size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'documents', 'list', { size: 20 },
        ])
        expect(documentDetailQueryKey({
            organizationId: 'organization-a',
            documentId: 'document-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'documents', 'detail', 'document-a',
        ])
        expect(documentVersionsQueryKey({
            organizationId: 'organization-a',
            documentId: 'document-a',
            size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'documents', 'document-a', 'versions', { size: 20 },
        ])
    })

    test('derives pagination only from the raw server page', () => {
        expect(getNextDocumentPageParam({
            items: Array.from({ length: 20 }), page: 0, size: 20,
        })).toBe(1)
        expect(getNextDocumentPageParam({
            items: Array.from({ length: 19 }), page: 0, size: 20,
        })).toBeUndefined()
    })

    test('loads list, detail and versions with abort signals', async () => {
        const queryClient = createTestQueryClient()
        getDocuments.mockResolvedValue({ items: [], page: 0, size: 20 })
        getDocumentById.mockResolvedValue({
            id: 'document-a', currentVersionId: 'version-a',
        })
        getDocumentVersions.mockResolvedValue({
            items: [], page: 0, size: 20,
        })
        const { result, unmount } = renderHook(() => ({
            list: useDocumentsQuery({ organizationId: 'organization-a' }),
            detail: useDocumentDetailQuery({
                organizationId: 'organization-a', documentId: 'document-a',
            }),
            versions: useDocumentVersionsQuery({
                organizationId: 'organization-a', documentId: 'document-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(Object.values(result.current).every(query => query.isSuccess))
                .toBe(true)
        })
        expect(getDocuments).toHaveBeenCalledWith({
            page: 0, size: 20, signal: expect.any(AbortSignal),
        })
        expect(getDocumentVersions).toHaveBeenCalledWith({
            documentId: 'document-a', page: 0, size: 20,
            signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its Documents in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getDocuments
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [{ id: 'document-b' }], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useDocumentsQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id)
                .toBe('document-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('document-b')

        unmount()
        queryClient.clear()
    })
})
