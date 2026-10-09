import {
    act,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    correctOocyteCollection,
    dryRunOpuCollections,
    openOpuSession,
    recordOpuCollections,
    transitionOpuSession,
} from '../../api/opuApi'
import {
    isAmbiguousCommandError,
    isStaleCommandError,
    useCorrectOocyteCollectionMutation,
    useOpenOpuMutation,
    useOpuCollectionsDryRunMutation,
    useOpuTransitionMutation,
    useRecordOpuCollectionsMutation,
} from '../useOpuMutations'

jest.mock('../../api/opuApi', () => ({
    correctOocyteCollection: jest.fn(),
    dryRunOpuCollections: jest.fn(),
    openOpuSession: jest.fn(),
    recordOpuCollections: jest.fn(),
    transitionOpuSession: jest.fn(),
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
    jest.clearAllMocks()
})

describe('OPU target mutations', () => {
    test('does not retry an ambiguous command automatically and reuses the same intention', async () => {
        const queryClient = createTestQueryClient()
        const intent = {
            idempotencyKey: 'stable-key',
            opuSessionId: 'opu-a',
            payload: {
                batchId: 'stable-key',
                expectedSessionVersion: 7,
                items: [{
                    itemId: 'item-a',
                    id: 'collection-a',
                    donorId: 'animal-a',
                }],
            },
        }
        const originalPayload = intent.payload
        recordOpuCollections
            .mockRejectedValueOnce({ kind: 'timeout' })
            .mockResolvedValueOnce({ batchId: 'stable-key', items: [] })
        const { result, unmount } = renderHook(
            () => useRecordOpuCollectionsMutation({
                organizationId: 'organization-a',
                opuSessionId: 'opu-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await expect(result.current.mutateAsync(intent)).rejects.toMatchObject({
                kind: 'timeout',
            })
        })
        expect(recordOpuCollections).toHaveBeenCalledTimes(1)
        expect(isAmbiguousCommandError(result.current.error)).toBe(true)

        await act(async () => result.current.mutateAsync(intent))
        expect(recordOpuCollections.mock.calls[0][0]).toBe(intent)
        expect(recordOpuCollections.mock.calls[1][0]).toBe(intent)
        expect(recordOpuCollections.mock.calls[1][0].payload).toBe(originalPayload)
        expect(recordOpuCollections.mock.calls[1][0]).toMatchObject({
            idempotencyKey: 'stable-key',
            payload: {
                batchId: 'stable-key',
                expectedSessionVersion: 7,
                items: [{ itemId: 'item-a', id: 'collection-a' }],
            },
        })

        unmount()
        queryClient.clear()
    })

    test('invalidates tenant-scoped session state after a successful bulk', async () => {
        const queryClient = createTestQueryClient()
        const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
        recordOpuCollections.mockResolvedValueOnce({ batchId: 'batch-a', items: [] })
        const { result, unmount } = renderHook(
            () => useRecordOpuCollectionsMutation({
                organizationId: 'organization-a',
                opuSessionId: 'opu-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => result.current.mutateAsync({ idempotencyKey: 'batch-a' }))

        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['target', 'organization', 'organization-a', 'opuSessions', 'opu-a'],
        })
        expect(invalidate).not.toHaveBeenCalledWith(expect.objectContaining({
            queryKey: ['target'],
        }))

        unmount()
        queryClient.clear()
    })

    test('refetches server state on stale session without retrying the command', async () => {
        const queryClient = createTestQueryClient()
        const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
        const stale = { kind: 'conflict', code: 'STALE_SESSION_VERSION' }
        transitionOpuSession.mockRejectedValueOnce(stale)
        const { result, unmount } = renderHook(
            () => useOpuTransitionMutation({
                organizationId: 'organization-a',
                opuSessionId: 'opu-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await expect(result.current.mutateAsync({ action: 'start' }))
                .rejects.toBe(stale)
        })
        await waitFor(() => expect(invalidate).toHaveBeenCalled())
        expect(transitionOpuSession).toHaveBeenCalledTimes(1)
        expect(isStaleCommandError(result.current.error)).toBe(true)

        unmount()
        queryClient.clear()
    })

    test('connects each operation to its dedicated API command', async () => {
        const queryClient = createTestQueryClient()
        openOpuSession.mockResolvedValueOnce({ id: 'opu-a' })
        dryRunOpuCollections.mockResolvedValueOnce({ dryRun: true })
        correctOocyteCollection.mockResolvedValueOnce({ id: 'collection-a' })
        const { result, unmount } = renderHook(() => ({
            open: useOpenOpuMutation({ organizationId: 'organization-a' }),
            preview: useOpuCollectionsDryRunMutation(),
            correct: useCorrectOocyteCollectionMutation({
                organizationId: 'organization-a',
                opuSessionId: 'opu-a',
                oocyteCollectionId: 'collection-a',
            }),
        }), { wrapper: createWrapper(queryClient) })
        const openIntent = { idempotencyKey: 'open-key' }
        const batchIntent = { idempotencyKey: 'batch-key' }
        const correctionIntent = { idempotencyKey: 'correction-key' }

        await act(async () => {
            await result.current.open.mutateAsync(openIntent)
            await result.current.preview.mutateAsync(batchIntent)
            await result.current.correct.mutateAsync(correctionIntent)
        })

        expect(openOpuSession.mock.calls[0][0]).toBe(openIntent)
        expect(dryRunOpuCollections.mock.calls[0][0]).toBe(batchIntent)
        expect(correctOocyteCollection.mock.calls[0][0]).toBe(correctionIntent)

        unmount()
        queryClient.clear()
    })
})
