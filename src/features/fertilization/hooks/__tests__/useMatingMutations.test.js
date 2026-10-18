import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { allocateMatings } from '../../api/matingApi'
import {
    isAmbiguousMatingCommandError,
    isMatingConcurrencyError,
    useAllocateMatingsMutation,
} from '../useMatingMutations'

jest.mock('../../api/matingApi', () => ({
    allocateMatings: jest.fn(),
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
        mutations: {
            ...queryClient.getDefaultOptions().mutations,
            gcTime: Infinity,
        },
    })

    return queryClient
}

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('Mating target mutation', () => {
    test('does not retry ambiguous failures and reuses the exact intention', async () => {
        const queryClient = createTestQueryClient()
        const intent = {
            idempotencyKey: 'batch-a',
            payload: { batchId: 'batch-a', items: [{ itemId: 'item-a' }] },
        }
        allocateMatings
            .mockRejectedValueOnce({ kind: 'timeout' })
            .mockResolvedValueOnce({ batchId: 'batch-a', items: [] })
        const { result, unmount } = renderHook(
            () => useAllocateMatingsMutation({
                organizationId: 'organization-a',
                oocyteCollectionId: 'collection-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await expect(result.current.mutateAsync(intent)).rejects.toMatchObject({
                kind: 'timeout',
            })
        })
        expect(allocateMatings).toHaveBeenCalledTimes(1)
        expect(isAmbiguousMatingCommandError(result.current.error)).toBe(true)

        await act(async () => result.current.mutateAsync(intent))
        expect(allocateMatings.mock.calls[0][0]).toBe(intent)
        expect(allocateMatings.mock.calls[1][0]).toBe(intent)

        unmount()
        queryClient.clear()
    })

    test.each([
        'OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ])('refreshes tenant collection and Matings after %s', async (code) => {
        const queryClient = createTestQueryClient()
        const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
        allocateMatings.mockRejectedValueOnce({ kind: 'conflict', code })
        const { result, unmount } = renderHook(
            () => useAllocateMatingsMutation({
                organizationId: 'organization-a',
                oocyteCollectionId: 'collection-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await expect(result.current.mutateAsync({})).rejects.toMatchObject({ code })
        })
        await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2))
        expect(isMatingConcurrencyError(result.current.error)).toBe(true)
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [
                'target', 'organization', 'organization-a',
                'oocyteCollections', 'detail', 'collection-a',
            ],
        })
        expect(allocateMatings).toHaveBeenCalledTimes(1)

        unmount()
        queryClient.clear()
    })
})
