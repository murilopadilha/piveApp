import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    invalidatePregnancyCheck,
    recordPregnancyCheck,
} from '../../api/transferApi'
import {
    isAmbiguousPregnancyCheckError,
    isPregnancyCheckConflict,
    useInvalidatePregnancyCheckMutation,
    useRecordPregnancyCheckMutation,
} from '../usePregnancyCheckMutations'

jest.mock('../../api/transferApi', () => ({
    invalidatePregnancyCheck: jest.fn(),
    recordPregnancyCheck: jest.fn(),
}))

const wrapper = client => function Wrapper({ children }) {
    return (
        <TargetFoundationProvider
            queryClient={client}
            restoreSession={() => Promise.resolve({ accessToken: 'token' })}
        >
            {children}
        </TargetFoundationProvider>
    )
}

const createClient = () => {
    const client = createTargetQueryClient()
    client.setDefaultOptions({
        ...client.getDefaultOptions(),
        mutations: { ...client.getDefaultOptions().mutations, gcTime: Infinity },
    })
    return client
}

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('PregnancyCheck mutations', () => {
    test('does not auto-retry and passes the same intention unchanged', async () => {
        const client = createClient()
        const intent = { idempotencyKey: 'batch-a', payload: { batchId: 'batch-a' } }
        recordPregnancyCheck.mockResolvedValue({ batchId: 'batch-a', items: [] })
        const { result, unmount } = renderHook(
            () => useRecordPregnancyCheckMutation({
                organizationId: 'organization-a', transferId: 'transfer-a',
            }),
            { wrapper: wrapper(client) }
        )

        await act(async () => result.current.mutateAsync(intent))
        expect(recordPregnancyCheck).toHaveBeenCalledTimes(1)
        expect(recordPregnancyCheck).toHaveBeenCalledWith(intent, expect.anything())
        unmount()
        client.clear()
    })

    test.each([
        ['record', useRecordPregnancyCheckMutation, recordPregnancyCheck],
        ['invalidate', useInvalidatePregnancyCheckMutation, invalidatePregnancyCheck],
    ])('refetches history, outcome and both follow-up query families after %s', async (
        _name,
        useHook,
        apiMutation
    ) => {
        const client = createClient()
        const invalidate = jest.spyOn(client, 'invalidateQueries')
        apiMutation.mockResolvedValue({ id: 'result-a' })
        const { result, unmount } = renderHook(
            () => useHook({
                organizationId: 'organization-a', transferId: 'transfer-a',
            }),
            { wrapper: wrapper(client) }
        )

        await act(async () => result.current.mutateAsync({ payload: {} }))
        await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3))
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [
                'target', 'organization', 'organization-a',
                'transfers', 'transfer-a', 'pregnancyChecks',
            ],
        })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [
                'target', 'organization', 'organization-a',
                'transfers', 'transfer-a', 'pregnancyOutcome',
            ],
        })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [
                'target', 'organization', 'organization-a',
                'pregnancyFollowUps',
            ],
        })
        unmount()
        client.clear()
    })

    test('classifies ambiguous transport and append-only conflicts', () => {
        expect(isAmbiguousPregnancyCheckError({ kind: 'network' })).toBe(true)
        expect(isAmbiguousPregnancyCheckError({ kind: 'validation' })).toBe(false)
        expect(isPregnancyCheckConflict({ code: 'DUPLICATE_SUPERSEDED_CHECK' })).toBe(true)
        expect(isPregnancyCheckConflict({ code: 'PREGNANCY_CHECK_ALREADY_INVALIDATED' })).toBe(true)
        expect(isPregnancyCheckConflict({ code: 'INVALID_CHECK_METHOD' })).toBe(false)
    })
})
