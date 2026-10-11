import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { identifyEmbryos } from '../../api/embryoApi'
import {
    isAmbiguousEmbryoCommandError,
    isEmbryoConcurrencyError,
    useIdentifyEmbryosMutation,
} from '../useEmbryoMutations'

jest.mock('../../api/embryoApi', () => ({
    identifyEmbryos: jest.fn(),
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

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('Embryo identification mutation', () => {
    test('disables automatic retry and forwards the same intention object', async () => {
        const queryClient = createTargetQueryClient()
        identifyEmbryos.mockRejectedValueOnce({ kind: 'timeout' })
        const { result, unmount } = renderHook(
            () => useIdentifyEmbryosMutation({
                organizationId: 'organization-a', matingId: 'mating-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )
        const intent = { idempotencyKey: 'batch-a', payload: { batchId: 'batch-a' } }

        await act(async () => {
            await expect(result.current.mutateAsync(intent)).rejects.toMatchObject({
                kind: 'timeout',
            })
        })
        expect(identifyEmbryos).toHaveBeenCalledTimes(1)
        expect(identifyEmbryos).toHaveBeenCalledWith(
            intent,
            expect.any(Object)
        )
        expect(isAmbiguousEmbryoCommandError(result.current.error)).toBe(true)

        unmount()
        queryClient.clear()
    })

    test('invalidates only tenant Embryo and Mating state after success', async () => {
        const queryClient = createTargetQueryClient()
        const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
        identifyEmbryos.mockResolvedValueOnce({ batchId: 'batch-a', items: [] })
        const { result, unmount } = renderHook(
            () => useIdentifyEmbryosMutation({
                organizationId: 'organization-a', matingId: 'mating-a',
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await act(async () => {
            await result.current.mutateAsync({ payload: {} })
        })
        await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2))
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['target', 'organization', 'organization-a', 'embryos'],
        })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [
                'target', 'organization', 'organization-a',
                'matings', 'detail', 'mating-a',
            ],
        })

        unmount()
        queryClient.clear()
    })

    test('classifies only audited state conflicts for reconciliation', () => {
        expect(isEmbryoConcurrencyError({
            code: 'EMBRYO_COUNT_EXCEEDS_ALLOCATION',
        })).toBe(true)
        expect(isEmbryoConcurrencyError({ code: 'MATING_NOT_OPEN' })).toBe(true)
        expect(isEmbryoConcurrencyError({
            code: 'CONCURRENT_WRITE_CONFLICT',
        })).toBe(true)
        expect(isEmbryoConcurrencyError({
            code: 'INVALID_EMBRYO_CODE',
        })).toBe(false)
    })
})
