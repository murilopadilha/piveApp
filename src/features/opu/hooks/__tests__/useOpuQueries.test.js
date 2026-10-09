import {
    act,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { useSession } from '../../../auth/SessionContext'
import { getClientById } from '../../../clients/api/clientApi'
import {
    getEstablishmentById,
    getFarmPropertyById,
    getOperationalLocationById,
    getProfessionalById,
} from '../../api/operationalLookupApi'
import {
    getOocyteCollectionById,
    getOocyteCollectionDonorSnapshot,
    getOpuSessionById,
    getOpuSessionCollections,
    getOpuSessionSummary,
    getOpuSessions,
} from '../../api/opuApi'
import {
    getNextOpuPageParam,
    oocyteCollectionDetailQueryKey,
    oocyteCollectionDonorSnapshotQueryKey,
    opuReferenceQueryKey,
    opuSessionCollectionsQueryKey,
    opuSessionDetailQueryKey,
    opuSessionSummaryQueryKey,
    opuSessionsQueryKey,
    useOocyteCollectionDetailQuery,
    useOocyteCollectionDonorSnapshotQuery,
    useOpuReferenceQueries,
    useOpuSessionCollectionsQuery,
    useOpuSessionDetailQuery,
    useOpuSessionSummaryQuery,
    useOpuSessionsQuery,
} from '../useOpuQueries'

jest.mock('../../api/opuApi', () => ({
    DEFAULT_OPU_PAGE_SIZE: 20,
    getOpuSessions: jest.fn(),
    getOpuSessionById: jest.fn(),
    getOpuSessionSummary: jest.fn(),
    getOpuSessionCollections: jest.fn(),
    getOocyteCollectionById: jest.fn(),
    getOocyteCollectionDonorSnapshot: jest.fn(),
}))

jest.mock('../../api/operationalLookupApi', () => ({
    getEstablishmentById: jest.fn(),
    getFarmPropertyById: jest.fn(),
    getOperationalLocationById: jest.fn(),
    getProfessionalById: jest.fn(),
}))

jest.mock('../../../clients/api/clientApi', () => ({
    getClientById: jest.fn(),
}))

const session = id => ({
    id,
    establishmentId: 'establishment-a',
    operationalLocationId: 'location-a',
    farmPropertyId: 'farm-a',
    clientId: 'client-a',
    leadProfessionalId: 'professional-a',
    performedAt: '2026-10-09T12:00:00Z',
    timezone: 'America/Sao_Paulo',
    notes: null,
    status: 'IN_PROGRESS',
    version: 1,
    provenance: {
        originType: 'MANUAL',
        recordedByUserId: 'actor-a',
        recordedAt: '2026-10-09T12:00:00Z',
    },
    completedAt: null,
    completedBy: null,
})

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

describe('OPU target queries', () => {
    test('uses Organization-scoped keys for every OPU read resource', () => {
        expect(opuSessionsQueryKey({
            organizationId: 'organization-a', size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'opuSessions', 'list', { size: 20 },
        ])
        expect(opuSessionDetailQueryKey({
            organizationId: 'organization-a', opuSessionId: 'opu-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'opuSessions', 'detail', 'opu-a',
        ])
        expect(opuSessionSummaryQueryKey({
            organizationId: 'organization-a', opuSessionId: 'opu-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'opuSessions', 'opu-a', 'summary',
        ])
        expect(opuSessionCollectionsQueryKey({
            organizationId: 'organization-a', opuSessionId: 'opu-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'opuSessions', 'opu-a', 'collections',
        ])
        expect(oocyteCollectionDetailQueryKey({
            organizationId: 'organization-a',
            oocyteCollectionId: 'collection-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'oocyteCollections', 'detail', 'collection-a',
        ])
        expect(oocyteCollectionDonorSnapshotQueryKey({
            organizationId: 'organization-a',
            oocyteCollectionId: 'collection-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'oocyteCollections', 'collection-a', 'donorSnapshot',
        ])
        expect(opuReferenceQueryKey({
            organizationId: 'organization-a',
            type: 'establishment',
            id: 'establishment-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'opuReferences', 'establishment', 'establishment-a',
        ])
    })

    test('discovers pagination end without totals', () => {
        expect(getNextOpuPageParam({
            items: [session('opu-a')], page: 0, size: 20,
        })).toBeUndefined()
        expect(getNextOpuPageParam({
            items: Array.from({ length: 20 }, (_, index) => session(index)),
            page: 0,
            size: 20,
        })).toBe(1)
    })

    test('loads OPU pages with cancellation and requests an uncertain next page', async () => {
        const queryClient = createTestQueryClient()
        getOpuSessions
            .mockResolvedValueOnce({
                items: Array.from({ length: 20 }, (_, index) => session(index)),
                page: 0,
                size: 20,
            })
            .mockResolvedValueOnce({ items: [], page: 1, size: 20 })
        const { result, unmount } = renderHook(() => useOpuSessionsQuery({
            organizationId: 'organization-a',
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.hasNextPage).toBe(true)
        await act(async () => result.current.fetchNextPage())
        expect(getOpuSessions).toHaveBeenNthCalledWith(1, {
            page: 0, size: 20, signal: expect.any(AbortSignal),
        })
        expect(getOpuSessions).toHaveBeenNthCalledWith(2, expect.objectContaining({
            page: 1,
        }))
        await waitFor(() => expect(result.current.hasNextPage).toBe(false))

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its OPU data in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getOpuSessions
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [session('opu-b')], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useOpuSessionsQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('opu-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [session('stale-a')], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('opu-b')

        unmount()
        queryClient.clear()
    })

    test('loads session, summary and collections independently by stable ID', async () => {
        const queryClient = createTestQueryClient()
        getOpuSessionById.mockResolvedValueOnce(session('opu-a'))
        getOpuSessionSummary.mockResolvedValueOnce({
            id: 'opu-a', status: 'IN_PROGRESS', collections: 0,
            totalRecovered: 0, viable: 0, farmSnapshot: null,
        })
        getOpuSessionCollections.mockResolvedValueOnce({
            items: [], page: 0, size: 20,
        })
        const { result, unmount } = renderHook(() => ({
            detail: useOpuSessionDetailQuery({
                organizationId: 'organization-a', opuSessionId: 'opu-a',
            }),
            summary: useOpuSessionSummaryQuery({
                organizationId: 'organization-a', opuSessionId: 'opu-a',
            }),
            collections: useOpuSessionCollectionsQuery({
                organizationId: 'organization-a', opuSessionId: 'opu-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.detail.isSuccess).toBe(true)
            expect(result.current.summary.isSuccess).toBe(true)
            expect(result.current.collections.isSuccess).toBe(true)
        })
        expect(getOpuSessionById).toHaveBeenCalledWith({
            opuSessionId: 'opu-a', signal: expect.any(AbortSignal),
        })
        expect(getOpuSessionCollections).toHaveBeenCalledWith(expect.objectContaining({
            opuSessionId: 'opu-a', page: 0, size: 20,
        }))

        unmount()
        queryClient.clear()
    })

    test('loads collection and donor snapshot as distinct reads', async () => {
        const queryClient = createTestQueryClient()
        getOocyteCollectionById.mockResolvedValueOnce({ id: 'collection-a' })
        getOocyteCollectionDonorSnapshot.mockResolvedValueOnce({ id: 'animal-a' })
        const { result, unmount } = renderHook(() => ({
            collection: useOocyteCollectionDetailQuery({
                organizationId: 'organization-a',
                oocyteCollectionId: 'collection-a',
            }),
            snapshot: useOocyteCollectionDonorSnapshotQuery({
                organizationId: 'organization-a',
                oocyteCollectionId: 'collection-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.collection.isSuccess).toBe(true)
            expect(result.current.snapshot.isSuccess).toBe(true)
        })
        expect(getOocyteCollectionDonorSnapshot).toHaveBeenCalledWith({
            oocyteCollectionId: 'collection-a',
            signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('composes only authorized operational references', async () => {
        const queryClient = createTestQueryClient()
        getEstablishmentById.mockResolvedValueOnce({ id: 'establishment-a' })
        getFarmPropertyById.mockResolvedValueOnce({ id: 'farm-a' })
        getProfessionalById.mockResolvedValueOnce({ id: 'professional-a' })
        getOperationalLocationById.mockResolvedValueOnce({ id: 'location-a' })
        getClientById.mockResolvedValueOnce({ id: 'client-a' })
        const { result, unmount } = renderHook(() => useOpuReferenceQueries({
            organizationId: 'organization-a',
            session: session('opu-a'),
            canReadMasterData: true,
            canReadClient: true,
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(Object.values(result.current).every(query => query.isSuccess)).toBe(true)
        })
        expect(Object.keys(result.current)).toEqual([
            'establishment',
            'farmProperty',
            'professional',
            'operationalLocation',
            'client',
        ])
        expect(getClientById).toHaveBeenCalledWith({
            clientId: 'client-a', signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('expires the target session on unauthorized OPU data', async () => {
        const queryClient = createTestQueryClient()
        getOpuSessionById.mockRejectedValueOnce({ kind: 'unauthorized' })
        const { result, unmount } = renderHook(() => ({
            opu: useOpuSessionDetailQuery({
                organizationId: 'organization-a', opuSessionId: 'opu-a',
            }),
            session: useSession(),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => expect(result.current.session.status).toBe('expired'))
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)

        unmount()
        queryClient.clear()
    })
})
