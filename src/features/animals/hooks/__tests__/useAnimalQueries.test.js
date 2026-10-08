import {
    act,
    renderHook,
    waitFor,
} from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import { useSession } from '../../../auth/SessionContext'
import {
    getAnimalById,
    getAnimalIdentifiers,
    getAnimalOwnerById,
    getAnimalOwnership,
    getAnimals,
    getBreedById,
} from '../../api/animalApi'
import {
    animalDetailQueryKey,
    animalIdentifiersQueryKey,
    animalOwnerDetailQueryKey,
    animalOwnershipQueryKey,
    animalsQueryKey,
    breedDetailQueryKey,
    getNextAnimalPageParam,
    useAnimalDetailQuery,
    useAnimalIdentifiersQuery,
    useAnimalOwnersQueries,
    useAnimalOwnershipQuery,
    useAnimalsQuery,
    useBreedDetailQuery,
} from '../useAnimalQueries'

jest.mock('../../api/animalApi', () => ({
    DEFAULT_ANIMAL_PAGE_SIZE: 20,
    getAnimals: jest.fn(),
    getAnimalById: jest.fn(),
    getAnimalIdentifiers: jest.fn(),
    getAnimalOwnership: jest.fn(),
    getBreedById: jest.fn(),
    getAnimalOwnerById: jest.fn(),
}))

const animal = id => ({
    id,
    sex: 'FEMALE',
    name: null,
    breedId: null,
    birthDate: null,
    status: 'ACTIVE',
    version: 0,
    originType: 'MANUAL',
    recordedBy: 'actor-a',
    recordedAt: '2026-09-20T12:00:00Z',
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
    getAnimals.mockReset()
    getAnimalById.mockReset()
    getAnimalIdentifiers.mockReset()
    getAnimalOwnership.mockReset()
    getBreedById.mockReset()
    getAnimalOwnerById.mockReset()
})

describe('Animal target queries', () => {
    test('uses explicit Organization-scoped keys for every Animal resource', () => {
        expect(animalsQueryKey({
            organizationId: 'organization-a', query: '42', size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'animals', 'search', { query: '42', size: 20 },
        ])
        expect(animalDetailQueryKey({
            organizationId: 'organization-a', animalId: 'animal-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'animals', 'detail', 'animal-a',
        ])
        expect(animalIdentifiersQueryKey({
            organizationId: 'organization-a', animalId: 'animal-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'animals', 'animal-a', 'identifiers',
        ])
        expect(animalOwnershipQueryKey({
            organizationId: 'organization-a', animalId: 'animal-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'animals', 'animal-a', 'ownership',
        ])
        expect(breedDetailQueryKey({
            organizationId: 'organization-a', breedId: 'breed-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'breeds', 'detail', 'breed-a',
        ])
        expect(animalOwnerDetailQueryKey({
            organizationId: 'organization-a', ownerId: 'owner-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'owners', 'detail', 'owner-a',
        ])
    })

    test('uses the page envelope to discover the end without totals', () => {
        expect(getNextAnimalPageParam({
            items: [animal('a')], page: 3, size: 20,
        })).toBeUndefined()
        expect(getNextAnimalPageParam({
            items: Array.from({ length: 20 }, (_, index) => animal(index)),
            page: 3,
            size: 20,
        })).toBe(4)
    })

    test('performs server-side search and requests the uncertain next page', async () => {
        const queryClient = createTestQueryClient()
        getAnimals
            .mockResolvedValueOnce({
                items: Array.from({ length: 20 }, (_, index) => animal(index)),
                page: 0,
                size: 20,
            })
            .mockResolvedValueOnce({ items: [], page: 1, size: 20 })
        const { result, unmount } = renderHook(() => useAnimalsQuery({
            organizationId: 'organization-a',
            query: 'Brinco 42',
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.hasNextPage).toBe(true)
        await act(async () => result.current.fetchNextPage())

        expect(getAnimals).toHaveBeenNthCalledWith(1, expect.objectContaining({
            query: 'Brinco 42', page: 0, size: 20, signal: expect.any(AbortSignal),
        }))
        expect(getAnimals).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 1 }))
        await waitFor(() => expect(result.current.hasNextPage).toBe(false))

        unmount()
        queryClient.clear()
    })

    test('cancels the previous Organization request and never reuses its data', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getAnimals
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({ items: [animal('b')], page: 0, size: 20 })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useAnimalsQuery({ organizationId }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [animal('stale-a')], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('b')

        unmount()
        queryClient.clear()
    })

    test('loads detail and histories by stable animalId with cancellation signals', async () => {
        const queryClient = createTestQueryClient()
        getAnimalById.mockResolvedValueOnce(animal('animal-a'))
        getAnimalIdentifiers.mockResolvedValueOnce({ items: [], page: 0, size: 20 })
        getAnimalOwnership.mockResolvedValueOnce({ items: [], page: 0, size: 20 })
        const { result, unmount } = renderHook(() => ({
            detail: useAnimalDetailQuery({
                organizationId: 'organization-a', animalId: 'animal-a',
            }),
            identifiers: useAnimalIdentifiersQuery({
                organizationId: 'organization-a', animalId: 'animal-a',
            }),
            ownership: useAnimalOwnershipQuery({
                organizationId: 'organization-a', animalId: 'animal-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.detail.isSuccess).toBe(true)
            expect(result.current.identifiers.isSuccess).toBe(true)
            expect(result.current.ownership.isSuccess).toBe(true)
        })
        expect(getAnimalById).toHaveBeenCalledWith({
            animalId: 'animal-a', signal: expect.any(AbortSignal),
        })
        expect(getAnimalIdentifiers).toHaveBeenCalledWith(expect.objectContaining({
            animalId: 'animal-a', page: 0, size: 20,
        }))
        expect(getAnimalOwnership).toHaveBeenCalledWith(expect.objectContaining({
            animalId: 'animal-a', page: 0, size: 20,
        }))

        unmount()
        queryClient.clear()
    })

    test('does not request a Breed when breedId is absent', () => {
        const queryClient = createTestQueryClient()
        const { result, unmount } = renderHook(() => useBreedDetailQuery({
            organizationId: 'organization-a',
            breedId: null,
        }), { wrapper: createWrapper(queryClient) })

        expect(result.current.fetchStatus).toBe('idle')
        expect(getBreedById).not.toHaveBeenCalled()

        unmount()
        queryClient.clear()
    })

    test('deduplicates owner IDs while keeping owners distinct from Clients', async () => {
        const queryClient = createTestQueryClient()
        getAnimalOwnerById
            .mockImplementation(({ ownerId }) => Promise.resolve({
                id: ownerId,
                displayName: `Owner ${ownerId}`,
            }))
        const { result, unmount } = renderHook(() => useAnimalOwnersQueries({
            organizationId: 'organization-a',
            ownerIds: ['owner-a', 'owner-a', 'owner-b'],
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => expect(result.current.every(query => query.isSuccess)).toBe(true))
        expect(result.current.map(query => query.ownerId)).toEqual(['owner-a', 'owner-b'])
        expect(getAnimalOwnerById).toHaveBeenCalledTimes(2)
        expect(getAnimalOwnerById).toHaveBeenCalledWith(expect.objectContaining({
            ownerId: 'owner-a',
        }))

        unmount()
        queryClient.clear()
    })

    test('expires the target session on an unauthorized Animal response', async () => {
        const queryClient = createTestQueryClient()
        getAnimalById.mockRejectedValueOnce({ kind: 'unauthorized' })
        const { result, unmount } = renderHook(() => ({
            animal: useAnimalDetailQuery({
                organizationId: 'organization-a', animalId: 'animal-a',
            }),
            session: useSession(),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => expect(result.current.session.status).toBe('expired'))
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)

        unmount()
        queryClient.clear()
    })
})
