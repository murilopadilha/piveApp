import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    getCorrectionById,
    getCorrectionImpact,
    getCorrections,
} from '../../api/correctionApi'
import {
    correctionDetailQueryKey,
    correctionImpactQueryKey,
    correctionsQueryKey,
    getNextCorrectionPageParam,
    useCorrectionDetailQuery,
    useCorrectionImpactQuery,
    useCorrectionsQuery,
} from '../useCorrectionQueries'

jest.mock('../../api/correctionApi', () => ({
    DEFAULT_CORRECTION_PAGE_SIZE: 20,
    getCorrectionById: jest.fn(),
    getCorrectionImpact: jest.fn(),
    getCorrections: jest.fn(),
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

describe('M7C1 Correction queries', () => {
    test('uses only Organization-scoped list, detail and impact identities', () => {
        expect(correctionsQueryKey({
            organizationId: 'organization-a', size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'corrections', 'list', { size: 20 },
        ])
        expect(correctionDetailQueryKey({
            organizationId: 'organization-a', correctionId: 'correction-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'corrections', 'detail', 'correction-a',
        ])
        expect(correctionImpactQueryKey({
            organizationId: 'organization-a', correctionId: 'correction-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'corrections', 'correction-a', 'impact',
        ])
    })

    test('derives the next page only from the raw server page', () => {
        expect(getNextCorrectionPageParam({
            items: Array.from({ length: 20 }), page: 0, size: 20,
        })).toBe(1)
        expect(getNextCorrectionPageParam({
            items: Array.from({ length: 19 }), page: 0, size: 20,
        })).toBeUndefined()
    })

    test('loads list, detail and current impact with abort signals', async () => {
        const queryClient = createTestQueryClient()
        getCorrections.mockResolvedValue({ items: [], page: 0, size: 20 })
        getCorrectionById.mockResolvedValue({ id: 'correction-a' })
        getCorrectionImpact.mockResolvedValue({ affectedEmbryos: 0 })
        const { result, unmount } = renderHook(() => ({
            list: useCorrectionsQuery({ organizationId: 'organization-a' }),
            detail: useCorrectionDetailQuery({
                organizationId: 'organization-a', correctionId: 'correction-a',
            }),
            impact: useCorrectionImpactQuery({
                organizationId: 'organization-a', correctionId: 'correction-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(Object.values(result.current).every(query => query.isSuccess))
                .toBe(true)
        })
        expect(getCorrections).toHaveBeenCalledWith({
            page: 0, size: 20, signal: expect.any(AbortSignal),
        })
        expect(getCorrectionById).toHaveBeenCalledWith({
            correctionId: 'correction-a', signal: expect.any(AbortSignal),
        })
        expect(getCorrectionImpact).toHaveBeenCalledWith({
            correctionId: 'correction-a', signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its Corrections in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getCorrections
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [{ id: 'correction-b' }], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useCorrectionsQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id)
                .toBe('correction-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('correction-b')

        unmount()
        queryClient.clear()
    })
})
