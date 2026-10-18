import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { closeRecipientCycle, openRecipientCycle } from '../../api/transferApi'
import {
    isAmbiguousRecipientCycleError,
    isStaleRecipientCycleError,
    useCloseRecipientCycleMutation,
    useOpenRecipientCycleMutation,
} from '../useRecipientCycleMutations'

jest.mock('../../api/transferApi', () => ({
    closeRecipientCycle: jest.fn(),
    openRecipientCycle: jest.fn(),
}))

const wrapper = client => function Wrapper({ children }) {
    return (
        <TargetFoundationProvider queryClient={client} restoreSession={() => Promise.resolve({ accessToken: 'token' })}>
            {children}
        </TargetFoundationProvider>
    )
}

const createClient = () => {
    const client = createTargetQueryClient()
    client.setDefaultOptions({
        ...client.getDefaultOptions(),
        mutations: {
            ...client.getDefaultOptions().mutations,
            gcTime: Infinity,
        },
    })

    return client
}

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('RecipientCycle mutations', () => {
    test('does not retry open and reuses the supplied intention unchanged', async () => {
        const client = createClient()
        const intent = { idempotencyKey: 'key-a', payload: { id: 'cycle-a' } }
        openRecipientCycle.mockResolvedValue({ id: 'cycle-a' })
        const { result, unmount } = renderHook(
            () => useOpenRecipientCycleMutation({ organizationId: 'organization-a' }),
            { wrapper: wrapper(client) }
        )

        await act(async () => result.current.mutateAsync(intent))
        expect(openRecipientCycle).toHaveBeenCalledTimes(1)
        expect(openRecipientCycle).toHaveBeenCalledWith(intent, expect.anything())
        unmount()
        client.clear()
    })

    test('invalidates list and refetches detail after close response', async () => {
        const client = createClient()
        const invalidate = jest.spyOn(client, 'invalidateQueries')
        closeRecipientCycle.mockResolvedValue({ id: 'cycle-a', recipientName: null })
        const { result, unmount } = renderHook(
            () => useCloseRecipientCycleMutation({
                organizationId: 'organization-a', recipientCycleId: 'cycle-a',
            }),
            { wrapper: wrapper(client) }
        )

        await act(async () => result.current.mutateAsync({ payload: { expectedVersion: 0 } }))
        await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2))
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['target', 'organization', 'organization-a', 'recipientCycles', 'detail', 'cycle-a'],
        })
        unmount()
        client.clear()
    })

    test('classifies ambiguous and stale outcomes explicitly', () => {
        expect(isAmbiguousRecipientCycleError({ kind: 'timeout' })).toBe(true)
        expect(isAmbiguousRecipientCycleError({ kind: 'validation' })).toBe(false)
        expect(isStaleRecipientCycleError({ code: 'STALE_RECIPIENT_CYCLE_VERSION' })).toBe(true)
        expect(isStaleRecipientCycleError({ code: 'RECIPIENT_NOT_ELIGIBLE' })).toBe(false)
    })
})
