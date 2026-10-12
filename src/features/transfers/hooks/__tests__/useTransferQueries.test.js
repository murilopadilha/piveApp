import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    getPregnancyChecks,
    getPregnancyFollowUps,
    getPregnancyOutcome,
    getRecipientCycleById,
    getRecipientCycles,
    getTransferById,
    getTransfers,
} from '../../api/transferApi'
import {
    getNextTransferPageParam,
    pregnancyChecksQueryKey,
    pregnancyFollowUpsQueryKey,
    pregnancyOutcomeQueryKey,
    recipientCycleDetailQueryKey,
    recipientCyclesQueryKey,
    transferDetailQueryKey,
    transfersQueryKey,
    usePregnancyChecksQuery,
    usePregnancyFollowUpsQuery,
    usePregnancyOutcomeQuery,
    useRecipientCycleDetailQuery,
    useRecipientCyclesQuery,
    useTransferDetailQuery,
    useTransfersQuery,
} from '../useTransferQueries'

jest.mock('../../api/transferApi', () => ({
    DEFAULT_TRANSFER_PAGE_SIZE: 20,
    getPregnancyChecks: jest.fn(),
    getPregnancyFollowUps: jest.fn(),
    getPregnancyOutcome: jest.fn(),
    getRecipientCycleById: jest.fn(),
    getRecipientCycles: jest.fn(),
    getTransferById: jest.fn(),
    getTransfers: jest.fn(),
}))

const createClient = () => {
    const client = createTargetQueryClient()
    client.setDefaultOptions({
        ...client.getDefaultOptions(),
        queries: { ...client.getDefaultOptions().queries, gcTime: Infinity },
    })
    return client
}
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

afterEach(() => {
    resetTargetRuntimeContext()
    jest.clearAllMocks()
})

describe('M5A Organization-scoped queries', () => {
    test('creates exact tenant keys for every read boundary', () => {
        expect(recipientCyclesQueryKey({
            organizationId: 'organization-a', recipientId: null, status: 'OPEN', size: 20,
        })).toEqual(['target', 'organization', 'organization-a', 'recipientCycles', 'search', {
            recipientId: null, status: 'OPEN', size: 20,
        }])
        expect(recipientCycleDetailQueryKey({
            organizationId: 'organization-a', recipientCycleId: 'cycle-a',
        })).toEqual(['target', 'organization', 'organization-a', 'recipientCycles', 'detail', 'cycle-a'])
        expect(transfersQueryKey({
            organizationId: 'organization-a', recipientCycleId: 'cycle-a', embryoId: null, size: 20,
        })).toEqual(['target', 'organization', 'organization-a', 'transfers', 'search', {
            recipientCycleId: 'cycle-a', embryoId: null, size: 20,
        }])
        expect(transferDetailQueryKey({ organizationId: 'organization-a', transferId: 'transfer-a' }))
            .toEqual(['target', 'organization', 'organization-a', 'transfers', 'detail', 'transfer-a'])
        expect(pregnancyChecksQueryKey({ organizationId: 'organization-a', transferId: 'transfer-a' }))
            .toEqual(['target', 'organization', 'organization-a', 'transfers', 'transfer-a', 'pregnancyChecks'])
        expect(pregnancyOutcomeQueryKey({ organizationId: 'organization-a', transferId: 'transfer-a' }))
            .toEqual(['target', 'organization', 'organization-a', 'transfers', 'transfer-a', 'pregnancyOutcome'])
        expect(pregnancyFollowUpsQueryKey({
            organizationId: 'organization-a', cohort: 'D30', asOf: '2026-10-11', size: 20,
        })).toEqual(['target', 'organization', 'organization-a', 'pregnancyFollowUps', {
            cohort: 'D30', asOf: '2026-10-11', size: 20,
        }])
    })

    test('uses raw page length as the only safe end signal', () => {
        expect(getNextTransferPageParam({ items: [{}], page: 0, size: 20 })).toBeUndefined()
        expect(getNextTransferPageParam({
            items: Array.from({ length: 20 }, (_, id) => ({ id })), page: 0, size: 20,
        })).toBe(1)
    })

    test('passes AbortSignal through every M5A query', async () => {
        const client = createClient()
        getRecipientCycles.mockResolvedValue({ items: [], page: 0, size: 20 })
        getRecipientCycleById.mockResolvedValue({ id: 'cycle-a' })
        getTransfers.mockResolvedValue({ items: [], page: 0, size: 20 })
        getTransferById.mockResolvedValue({ transfer: { id: 'transfer-a' } })
        getPregnancyChecks.mockResolvedValue({ items: [], page: 0, size: 20 })
        getPregnancyOutcome.mockResolvedValue({ transferId: 'transfer-a', latestValidCheck: null })
        getPregnancyFollowUps.mockResolvedValue({ items: [], page: 0, size: 20 })
        const { result, unmount } = renderHook(() => ({
            cycles: useRecipientCyclesQuery({ organizationId: 'organization-a' }),
            cycle: useRecipientCycleDetailQuery({ organizationId: 'organization-a', recipientCycleId: 'cycle-a' }),
            transfers: useTransfersQuery({ organizationId: 'organization-a', recipientCycleId: 'cycle-a' }),
            transfer: useTransferDetailQuery({ organizationId: 'organization-a', transferId: 'transfer-a' }),
            checks: usePregnancyChecksQuery({ organizationId: 'organization-a', transferId: 'transfer-a' }),
            outcome: usePregnancyOutcomeQuery({ organizationId: 'organization-a', transferId: 'transfer-a' }),
            followUps: usePregnancyFollowUpsQuery({ organizationId: 'organization-a', cohort: 'D30', asOf: '2026-10-11' }),
        }), { wrapper: wrapper(client) })

        await waitFor(() => Object.values(result.current).forEach(value => expect(value.isSuccess).toBe(true)))
        ;[
            getRecipientCycles, getRecipientCycleById, getTransfers,
            getTransferById, getPregnancyChecks, getPregnancyOutcome,
            getPregnancyFollowUps,
        ].forEach(mock => expect(mock).toHaveBeenCalledWith(expect.objectContaining({
            signal: expect.any(AbortSignal),
        })))
        unmount()
        client.clear()
    })

    test('cancels Organization A and never exposes its cycle data in B', async () => {
        const client = createClient()
        let firstSignal
        let resolveFirst
        getRecipientCycles
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => { resolveFirst = resolve })
            })
            .mockResolvedValueOnce({ items: [{ id: 'cycle-b' }], page: 0, size: 20 })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useRecipientCyclesQuery({ organizationId }),
            { initialProps: { organizationId: 'organization-a' }, wrapper: wrapper(client) }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => expect(result.current.data.pages[0].items[0].id).toBe('cycle-b'))
        expect(firstSignal.aborted).toBe(true)
        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('cycle-b')

        unmount()
        client.clear()
    })
})
