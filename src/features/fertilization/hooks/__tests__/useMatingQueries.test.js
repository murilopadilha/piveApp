import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { getMatingById, getMatings } from '../../api/matingApi'
import {
    getNextMatingPageParam,
    matingDetailQueryKey,
    matingsQueryKey,
    useMatingDetailQuery,
    useMatingsQuery,
} from '../useMatingQueries'

jest.mock('../../api/matingApi', () => ({
    DEFAULT_MATING_PAGE_SIZE: 20,
    getMatingById: jest.fn(),
    getMatings: jest.fn(),
}))

const createWrapper = queryClient => function Wrapper({ children }) {
    return (
        <TargetFoundationProvider
            queryClient={queryClient}
            restoreSession={() => Promise.resolve({ accessToken: 'token' })}
        >
            {children}
        </TargetFoundationProvider>
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

describe('Mating target queries', () => {
    test('uses only Organization-scoped identities', () => {
        expect(matingsQueryKey({
            organizationId: 'organization-a',
            collectionId: 'collection-a',
            size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'matings', 'list', {
                collectionId: 'collection-a',
                semenBatchId: null,
                size: 20,
            },
        ])
        expect(matingDetailQueryKey({
            organizationId: 'organization-a', matingId: 'mating-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'matings', 'detail', 'mating-a',
        ])
    })

    test('uses raw page length to discover pagination end', () => {
        expect(getNextMatingPageParam({
            items: [{ id: 'a' }], page: 0, size: 20,
        })).toBeUndefined()
        expect(getNextMatingPageParam({
            items: Array.from({ length: 20 }, (_, id) => ({ id })),
            page: 0,
            size: 20,
        })).toBe(1)
    })

    test('loads list and detail with AbortSignal', async () => {
        const queryClient = createTestQueryClient()
        getMatings.mockResolvedValueOnce({ items: [], page: 0, size: 20 })
        getMatingById.mockResolvedValueOnce({ mating: { id: 'mating-a' } })
        const { result, unmount } = renderHook(() => ({
            list: useMatingsQuery({
                organizationId: 'organization-a',
                collectionId: 'collection-a',
            }),
            detail: useMatingDetailQuery({
                organizationId: 'organization-a', matingId: 'mating-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.list.isSuccess).toBe(true)
            expect(result.current.detail.isSuccess).toBe(true)
        })
        expect(getMatings).toHaveBeenCalledWith(expect.objectContaining({
            collectionId: 'collection-a',
            page: 0,
            signal: expect.any(AbortSignal),
        }))
        expect(getMatingById).toHaveBeenCalledWith({
            matingId: 'mating-a', signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its data in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getMatings
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [{ id: 'mating-b' }], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useMatingsQuery({
                organizationId,
                collectionId: 'collection-a',
            }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('mating-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('mating-b')

        unmount()
        queryClient.clear()
    })
})
