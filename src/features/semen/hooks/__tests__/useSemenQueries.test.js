import { renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    getExternalEstablishmentById,
    getSemenBatchById,
    getSemenBatches,
} from '../../api/semenApi'
import {
    externalEstablishmentDetailQueryKey,
    getNextSemenBatchPageParam,
    semenBatchDetailQueryKey,
    semenBatchesQueryKey,
    useExternalEstablishmentDetailQuery,
    useSemenBatchDetailQuery,
    useSemenBatchesQuery,
} from '../useSemenQueries'

jest.mock('../../api/semenApi', () => ({
    DEFAULT_SEMEN_BATCH_PAGE_SIZE: 20,
    getSemenBatches: jest.fn(),
    getSemenBatchById: jest.fn(),
    getExternalEstablishmentById: jest.fn(),
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

describe('Semen batch target queries', () => {
    test('uses Organization-scoped keys for batches and producer', () => {
        expect(semenBatchesQueryKey({
            organizationId: 'organization-a', query: '42', size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'semenBatches', 'search', { query: '42', size: 20 },
        ])
        expect(semenBatchDetailQueryKey({
            organizationId: 'organization-a', semenBatchId: 'batch-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'semenBatches', 'detail', 'batch-a',
        ])
        expect(externalEstablishmentDetailQueryKey({
            organizationId: 'organization-a',
            externalEstablishmentId: 'producer-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'externalEstablishments', 'detail', 'producer-a',
        ])
    })

    test('keeps requesting after a raw full page', () => {
        expect(getNextSemenBatchPageParam({
            items: Array.from({ length: 20 }, (_, id) => ({ id })),
            page: 0,
            size: 20,
        })).toBe(1)
    })

    test('loads search, detail and producer independently', async () => {
        const queryClient = createTargetQueryClient()
        getSemenBatches.mockResolvedValueOnce({ items: [], page: 0, size: 20 })
        getSemenBatchById.mockResolvedValueOnce({ id: 'batch-a' })
        getExternalEstablishmentById.mockResolvedValueOnce({ id: 'producer-a' })
        const { result, unmount } = renderHook(() => ({
            search: useSemenBatchesQuery({
                organizationId: 'organization-a', query: '42',
            }),
            detail: useSemenBatchDetailQuery({
                organizationId: 'organization-a', semenBatchId: 'batch-a',
            }),
            producer: useExternalEstablishmentDetailQuery({
                organizationId: 'organization-a',
                externalEstablishmentId: 'producer-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.search.isSuccess).toBe(true)
            expect(result.current.detail.isSuccess).toBe(true)
            expect(result.current.producer.isSuccess).toBe(true)
        })
        expect(getSemenBatches).toHaveBeenCalledWith(expect.objectContaining({
            query: '42', signal: expect.any(AbortSignal),
        }))

        unmount()
        queryClient.clear()
    })
})
