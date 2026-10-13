import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    recordInventoryMovement,
    recordInventoryMovementBatch,
} from '../../api/inventoryApi'
import {
    isAmbiguousInventoryMovementError,
    isInventoryMovementConflict,
    useInventoryMovementMutation,
} from '../useInventoryMutations'

jest.mock('../../api/inventoryApi', () => ({
    recordInventoryMovement: jest.fn(),
    recordInventoryMovementBatch: jest.fn(),
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

describe('M6A movement mutations', () => {
    test('disables automatic retry and forwards the identical intention object', async () => {
        const queryClient = createTestQueryClient()
        recordInventoryMovement.mockRejectedValueOnce({ kind: 'timeout' })
        const { result, unmount } = renderHook(
            () => useInventoryMovementMutation({
                organizationId: 'organization-a', packageId: 'package-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )
        const intent = {
            idempotencyKey: 'movement-a', payload: { id: 'movement-a' },
        }

        await act(async () => {
            await expect(result.current.mutateAsync(intent)).rejects.toMatchObject({
                kind: 'timeout',
            })
        })
        expect(recordInventoryMovement).toHaveBeenCalledTimes(1)
        expect(recordInventoryMovement).toHaveBeenCalledWith(
            intent,
            expect.any(Object)
        )
        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(isAmbiguousInventoryMovementError(result.current.error)).toBe(true)

        unmount()
        queryClient.clear()
    })

    test('invalidates only affected tenant package, ledger and Embryo state', async () => {
        const queryClient = createTestQueryClient()
        const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
        recordInventoryMovement.mockResolvedValueOnce({ id: 'movement-a' })
        const { result, unmount } = renderHook(
            () => useInventoryMovementMutation({
                organizationId: 'organization-a', packageId: 'package-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await result.current.mutateAsync({ payload: {} })
        })
        await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3))
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['target', 'organization', 'organization-a', 'embryoPackages'],
        })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [
                'target', 'organization', 'organization-a',
                'inventoryMovements', 'package-a',
            ],
        })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['target', 'organization', 'organization-a', 'embryos'],
        })

        unmount()
        queryClient.clear()
    })

    test('uses the atomic bulk API only when explicitly requested', async () => {
        const queryClient = createTestQueryClient()
        recordInventoryMovementBatch.mockResolvedValueOnce({ batchId: 'batch-a' })
        const { result, unmount } = renderHook(
            () => useInventoryMovementMutation({
                organizationId: 'organization-a',
                packageId: 'package-a',
                bulk: true,
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await result.current.mutateAsync({ payload: { batchId: 'batch-a' } })
        })
        expect(recordInventoryMovementBatch).toHaveBeenCalledTimes(1)
        expect(recordInventoryMovement).not.toHaveBeenCalled()

        unmount()
        queryClient.clear()
    })

    test('classifies only audited inventory conflicts for reconciliation', () => {
        for (const code of [
            'STALE_PACKAGE_VERSION',
            'PACKAGE_NOT_IN_EXPECTED_LOCATION',
            'PACKAGE_ON_HOLD',
            'PACKAGE_RESERVED_FOR_SHIPMENT',
            'PACKAGE_HAS_NO_ACTIVE_MATERIAL',
            'STORAGE_LOCATION_NOT_ACTIVE',
            'CONCURRENT_WRITE_CONFLICT',
            'CONSTRAINT_CONFLICT',
        ]) {
            expect(isInventoryMovementConflict({ code })).toBe(true)
        }
        expect(isInventoryMovementConflict({ code: 'INVALID_MOVEMENT' }))
            .toBe(false)
    })
})
