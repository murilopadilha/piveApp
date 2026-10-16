import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'

import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { getDataQualityIssues } from '../../api/dataQualityApi'
import {
    dataQualityQueryKey,
    getNextDataQualityPageParam,
    useDataQualityIssuesQuery,
} from '../useDataQualityQueries'

jest.mock('../../api/dataQualityApi', () => ({
    DEFAULT_DATA_QUALITY_PAGE_SIZE: 20,
    getDataQualityIssues: jest.fn(),
    normalizeDataQualityQuery: query => query.trim(),
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

afterEach(() => jest.clearAllMocks())

describe('M9A Data Quality queries', () => {
    test('uses the exact Organization-scoped search identity', () => {
        expect(dataQualityQueryKey({
            organizationId: 'organization-a',
            query: ' ERROR ',
            size: 20,
        })).toEqual([
            'target',
            'organization',
            'organization-a',
            'dataQuality',
            'search',
            { q: 'ERROR', size: 20 },
        ])
    })

    test('derives the next page only from the raw server page', () => {
        expect(getNextDataQualityPageParam({
            items: Array.from({ length: 20 }), page: 0, size: 20,
        })).toBe(1)
        expect(getNextDataQualityPageParam({
            items: Array.from({ length: 19 }), page: 0, size: 20,
        })).toBeUndefined()
    })

    test('sends server q and pageParam with an abort signal', async () => {
        const queryClient = createTestQueryClient()
        getDataQualityIssues.mockResolvedValue({ items: [], page: 0, size: 20 })
        const { result, unmount } = renderHook(
            () => useDataQualityIssuesQuery({
                organizationId: 'organization-a', query: ' INFO ',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(getDataQualityIssues).toHaveBeenCalledWith({
            query: 'INFO',
            page: 0,
            size: 20,
            signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('does not call the API when the cumulative permission gate disables it', async () => {
        const queryClient = createTestQueryClient()
        const { result, unmount } = renderHook(
            () => useDataQualityIssuesQuery({
                organizationId: 'organization-a', enabled: false,
            }),
            { wrapper: createWrapper(queryClient) }
        )

        expect(result.current.fetchStatus).toBe('idle')
        expect(getDataQualityIssues).not.toHaveBeenCalled()

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its issues in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getDataQualityIssues
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [{ subjectId: 'package-b' }], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useDataQualityIssuesQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].subjectId)
                .toBe('package-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({
            items: [{ subjectId: 'stale-a' }], page: 0, size: 20,
        })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].subjectId)
            .toBe('package-b')

        unmount()
        queryClient.clear()
    })
})
