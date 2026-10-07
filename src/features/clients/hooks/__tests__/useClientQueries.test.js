import {
    act,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import {
    getClientById,
    getClients,
} from '../../api/clientApi'
import { useSession } from '../../../auth/SessionContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import {
    clientDetailQueryKey,
    clientsQueryKey,
    getNextClientPageParam,
    useClientDetailQuery,
    useClientsQuery,
} from '../useClientQueries'

jest.mock('../../api/clientApi', () => ({
    DEFAULT_CLIENT_PAGE_SIZE: 20,
    getClients: jest.fn(),
    getClientById: jest.fn(),
}))

const client = id => ({
    id,
    type: 'PERSON',
    displayName: `Cliente ${id}`,
    legalName: null,
    address: null,
    status: 'ACTIVE',
    version: 0,
})

const createWrapper = (queryClient) => function Wrapper({ children }) {
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
})

describe('Client target queries', () => {
    test('uses Organization-scoped keys for list and detail', () => {
        expect(clientsQueryKey({
            organizationId: 'organization-a',
            query: 'aurora',
            size: 20,
        })).toEqual([
            'target',
            'organization',
            'organization-a',
            'clients',
            'search',
            { query: 'aurora', size: 20 },
        ])
        expect(clientDetailQueryKey({
            organizationId: 'organization-a',
            clientId: 'client-a',
        })).toEqual([
            'target',
            'organization',
            'organization-a',
            'clients',
            'detail',
            'client-a',
        ])
    })

    test('requests one additional page when the previous page is full', async () => {
        const queryClient = createTestQueryClient()
        getClients
            .mockResolvedValueOnce({
                items: Array.from({ length: 20 }, (_, index) => client(index)),
                page: 0,
                size: 20,
            })
            .mockResolvedValueOnce({ items: [], page: 1, size: 20 })
        const { result, unmount } = renderHook(() => useClientsQuery({
            organizationId: 'organization-a',
            query: 'Aurora',
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })
        expect(result.current.hasNextPage).toBe(true)

        await act(async () => {
            await result.current.fetchNextPage()
        })

        expect(getClients).toHaveBeenNthCalledWith(1, expect.objectContaining({
            query: 'Aurora',
            page: 0,
            size: 20,
            signal: expect.any(AbortSignal),
        }))
        expect(getClients).toHaveBeenNthCalledWith(2, expect.objectContaining({
            page: 1,
        }))
        await waitFor(() => {
            expect(result.current.hasNextPage).toBe(false)
        })

        unmount()
        queryClient.clear()
    })

    test('stops without another page only when items length is below size', () => {
        expect(getNextClientPageParam({
            items: [client('a')],
            page: 3,
            size: 20,
        })).toBeUndefined()
        expect(getNextClientPageParam({
            items: Array.from({ length: 20 }, (_, index) => client(index)),
            page: 3,
            size: 20,
        })).toBe(4)
    })

    test('keeps Client data isolated when Organization changes', async () => {
        const queryClient = createTestQueryClient()
        getClients.mockImplementation(({ page }) => Promise.resolve({
            items: [client(getClients.mock.calls.length === 1 ? 'a' : 'b')],
            page,
            size: 20,
        }))
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useClientsQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('a')
        })
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('b')
        })

        expect(queryClient.getQueryData(clientsQueryKey({
            organizationId: 'organization-a',
            query: '',
            size: 20,
        })).pages[0].items[0].id).toBe('a')
        expect(queryClient.getQueryData(clientsQueryKey({
            organizationId: 'organization-b',
            query: '',
            size: 20,
        })).pages[0].items[0].id).toBe('b')

        unmount()
        queryClient.clear()
    })

    test('passes cancellation signal and ignores the previous context result', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getClients
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [client('b')],
                page: 0,
                size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useClientsQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => {
            expect(firstSignal).toBeDefined()
        })
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [client('stale-a')], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('b')

        unmount()
        queryClient.clear()
    })

    test('loads detail by clientId and expires session on 401', async () => {
        const queryClient = createTestQueryClient()
        getClientById.mockRejectedValueOnce({ kind: 'unauthorized' })
        const { result, unmount } = renderHook(() => ({
            detail: useClientDetailQuery({
                organizationId: 'organization-a',
                clientId: 'client-a',
            }),
            session: useSession(),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.session.status).toBe('expired')
        })
        expect(getClientById).toHaveBeenCalledWith({
            clientId: 'client-a',
            signal: expect.any(AbortSignal),
        })
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
        unmount()
        queryClient.clear()
    })
})
