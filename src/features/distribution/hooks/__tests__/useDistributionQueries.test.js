import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'

import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    analyzeRecallImpact,
    getRecallById,
    getRecalls,
    getShipmentById,
    getShipments,
    validateShipment,
} from '../../api/distributionApi'
import {
    getNextRecallImpactPageParam,
    getNextRecallPageParam,
    getNextShipmentPageParam,
    recallDetailQueryKey,
    recallImpactQueryKey,
    recallsQueryKey,
    shipmentDetailQueryKey,
    shipmentValidationQueryKey,
    shipmentsQueryKey,
    useRecallDetailQuery,
    useRecallImpactQuery,
    useRecallsQuery,
    useShipmentDetailQuery,
    useShipmentsQuery,
    useShipmentValidationQuery,
} from '../useDistributionQueries'

jest.mock('../../api/distributionApi', () => ({
    DEFAULT_DISTRIBUTION_PAGE_SIZE: 20,
    analyzeRecallImpact: jest.fn(),
    getRecallById: jest.fn(),
    getRecalls: jest.fn(),
    getShipmentById: jest.fn(),
    getShipments: jest.fn(),
    validateShipment: jest.fn(),
}))
jest.mock('../../../auth/SessionContext', () => ({
    useSession: () => ({ expireSession: jest.fn() }),
}))

const wrapper = client => function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const client = () => {
    const value = createTargetQueryClient()
    value.setDefaultOptions({
        ...value.getDefaultOptions(),
        queries: { ...value.getDefaultOptions().queries, gcTime: Infinity },
    })
    return value
}

afterEach(() => jest.clearAllMocks())

describe('M8A Distribution queries', () => {
    test('uses independent Organization-scoped query keys', () => {
        expect(shipmentsQueryKey({ organizationId: 'org-a', query: 'x', size: 20 }))
            .toEqual(['target', 'organization', 'org-a', 'shipments', 'search', { q: 'x', size: 20 }])
        expect(shipmentDetailQueryKey({ organizationId: 'org-a', shipmentId: 'shipment-a' }))
            .toEqual(['target', 'organization', 'org-a', 'shipments', 'detail', 'shipment-a'])
        expect(shipmentValidationQueryKey({ organizationId: 'org-a', shipmentId: 'shipment-a', movementAt: 'instant-a' }))
            .toEqual(['target', 'organization', 'org-a', 'shipments', 'shipment-a', 'validation', { movementAt: 'instant-a' }])
        expect(recallsQueryKey({ organizationId: 'org-a', query: '', size: 20 }))
            .toEqual(['target', 'organization', 'org-a', 'recalls', 'search', { q: '', size: 20 }])
        expect(recallDetailQueryKey({ organizationId: 'org-a', recallId: 'recall-a' }))
            .toEqual(['target', 'organization', 'org-a', 'recalls', 'detail', 'recall-a'])
        expect(recallImpactQueryKey({ organizationId: 'org-a', recallId: 'recall-a', cutoff: null, size: 20 }))
            .toEqual(['target', 'organization', 'org-a', 'recalls', 'recall-a', 'impact', { cutoff: null, size: 20 }])
    })

    test('derives pagination only from raw server arrays', () => {
        expect(getNextShipmentPageParam({ items: Array(20), page: 0, size: 20 })).toBe(1)
        expect(getNextShipmentPageParam({ items: Array(19), page: 0, size: 20 })).toBeUndefined()
        expect(getNextRecallPageParam({ items: Array(20), page: 2, size: 20 })).toBe(3)
        expect(getNextRecallImpactPageParam({ materials: Array(19), page: 0, size: 20, analysisCutoff: 'cutoff-a' })).toBeUndefined()
        expect(getNextRecallImpactPageParam({ materials: Array(20), page: 0, size: 20, analysisCutoff: 'cutoff-a' }))
            .toEqual({ page: 1, cutoff: 'cutoff-a' })
    })

    test('runs list/detail and computational POSTs as queries with abort signals', async () => {
        const queryClient = client()
        getShipments.mockResolvedValue({ items: [], page: 0, size: 20 })
        getShipmentById.mockResolvedValue({ id: 'shipment-a' })
        validateShipment.mockResolvedValue({ evaluation: { result: 'UNKNOWN' } })
        getRecalls.mockResolvedValue({ items: [], page: 0, size: 20 })
        getRecallById.mockResolvedValue({ id: 'recall-a' })
        analyzeRecallImpact.mockResolvedValue({ materials: [], page: 0, size: 20 })
        const { result, unmount } = renderHook(() => ({
            shipments: useShipmentsQuery({ organizationId: 'org-a' }),
            shipment: useShipmentDetailQuery({ organizationId: 'org-a', shipmentId: 'shipment-a' }),
            validation: useShipmentValidationQuery({ organizationId: 'org-a', shipmentId: 'shipment-a', movementAt: '2026-10-15T12:00:00Z' }),
            recalls: useRecallsQuery({ organizationId: 'org-a' }),
            recall: useRecallDetailQuery({ organizationId: 'org-a', recallId: 'recall-a' }),
            impact: useRecallImpactQuery({ organizationId: 'org-a', recallId: 'recall-a', cutoff: null }),
        }), { wrapper: wrapper(queryClient) })

        await waitFor(() => expect(Object.values(result.current).every(value => value.isSuccess)).toBe(true))
        expect(validateShipment).toHaveBeenCalledWith({
            shipmentId: 'shipment-a', movementAt: '2026-10-15T12:00:00Z',
            signal: expect.any(AbortSignal),
        })
        expect(analyzeRecallImpact).toHaveBeenCalledWith({
            recallId: 'recall-a', cutoff: null, page: 0, size: 20,
            signal: expect.any(AbortSignal),
        })
        unmount()
        queryClient.clear()
    })

    test('cancels Organization A Shipment query and exposes only B', async () => {
        const queryClient = client()
        let firstSignal
        let resolveFirst
        getShipments
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => { resolveFirst = resolve })
            })
            .mockResolvedValueOnce({ items: [{ id: 'shipment-b' }], page: 0, size: 20 })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useShipmentsQuery({ organizationId }),
            { initialProps: { organizationId: 'org-a' }, wrapper: wrapper(queryClient) }
        )
        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'org-b' })
        await waitFor(() => expect(result.current.data?.pages[0].items[0].id).toBe('shipment-b'))
        expect(firstSignal.aborted).toBe(true)
        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('shipment-b')
        unmount()
        queryClient.clear()
    })

    test('does not execute computational endpoints while disabled', () => {
        const queryClient = client()
        const { unmount } = renderHook(() => ({
            validation: useShipmentValidationQuery({
                organizationId: 'org-a', shipmentId: 'shipment-a',
                movementAt: null, enabled: false,
            }),
            impact: useRecallImpactQuery({
                organizationId: 'org-a', recallId: 'recall-a', enabled: false,
            }),
        }), { wrapper: wrapper(queryClient) })
        expect(validateShipment).not.toHaveBeenCalled()
        expect(analyzeRecallImpact).not.toHaveBeenCalled()
        unmount()
        queryClient.clear()
    })
})
