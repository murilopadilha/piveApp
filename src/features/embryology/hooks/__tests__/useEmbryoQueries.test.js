import { act, renderHook, waitFor } from '@testing-library/react-native'

import { resetTargetRuntimeContext } from '../../../../api/target/requestContext'
import TargetFoundationProvider from '../../../../providers/TargetFoundationProvider'
import { createTargetQueryClient } from '../../../../serverState/targetQueryClient'
import {
    getAssessmentVersionById,
    getEmbryoById,
    getEmbryoEvaluations,
    getEmbryos,
} from '../../api/embryoApi'
import {
    assessmentVersionDetailQueryKey,
    embryoDetailQueryKey,
    embryoEvaluationsQueryKey,
    embryosQueryKey,
    getNextEmbryoPageParam,
    useAssessmentVersionsQueries,
    useEmbryoDetailQuery,
    useEmbryoEvaluationsQuery,
    useEmbryosQuery,
} from '../useEmbryoQueries'

jest.mock('../../api/embryoApi', () => ({
    DEFAULT_EMBRYO_PAGE_SIZE: 20,
    getAssessmentVersionById: jest.fn(),
    getEmbryoById: jest.fn(),
    getEmbryoEvaluations: jest.fn(),
    getEmbryos: jest.fn(),
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

describe('Embryo target queries', () => {
    test('uses only Organization-scoped query identities', () => {
        expect(embryosQueryKey({
            organizationId: 'organization-a',
            matingId: 'mating-a',
            query: 'emb',
            size: 20,
        })).toEqual([
            'target', 'organization', 'organization-a',
            'embryos', 'search', {
                matingId: 'mating-a', query: 'emb', size: 20,
            },
        ])
        expect(embryoDetailQueryKey({
            organizationId: 'organization-a', embryoId: 'embryo-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'embryos', 'detail', 'embryo-a',
        ])
        expect(embryoEvaluationsQueryKey({
            organizationId: 'organization-a', embryoId: 'embryo-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'embryos', 'embryo-a', 'evaluations',
        ])
        expect(assessmentVersionDetailQueryKey({
            organizationId: 'organization-a', schemeVersionId: 'version-a',
        })).toEqual([
            'target', 'organization', 'organization-a',
            'assessmentVersions', 'detail', 'version-a',
        ])
    })

    test('uses raw page length to discover pagination end', () => {
        expect(getNextEmbryoPageParam({
            items: [{ id: 'a' }], page: 0, size: 20,
        })).toBeUndefined()
        expect(getNextEmbryoPageParam({
            items: Array.from({ length: 20 }, (_, id) => ({ id })),
            page: 0,
            size: 20,
        })).toBe(1)
    })

    test('loads list, detail and read-only history with AbortSignal', async () => {
        const queryClient = createTestQueryClient()
        getEmbryos.mockResolvedValueOnce({ items: [], page: 0, size: 20 })
        getEmbryoById.mockResolvedValueOnce({ id: 'embryo-a' })
        getEmbryoEvaluations.mockResolvedValueOnce([])
        const { result, unmount } = renderHook(() => ({
            list: useEmbryosQuery({
                organizationId: 'organization-a', matingId: 'mating-a',
            }),
            detail: useEmbryoDetailQuery({
                organizationId: 'organization-a', embryoId: 'embryo-a',
            }),
            history: useEmbryoEvaluationsQuery({
                organizationId: 'organization-a', embryoId: 'embryo-a',
            }),
        }), { wrapper: createWrapper(queryClient) })

        await waitFor(() => {
            expect(result.current.list.isSuccess).toBe(true)
            expect(result.current.detail.isSuccess).toBe(true)
            expect(result.current.history.isSuccess).toBe(true)
        })
        expect(getEmbryos).toHaveBeenCalledWith(expect.objectContaining({
            matingId: 'mating-a', page: 0, signal: expect.any(AbortSignal),
        }))
        expect(getEmbryoById).toHaveBeenCalledWith({
            embryoId: 'embryo-a', signal: expect.any(AbortSignal),
        })
        expect(getEmbryoEvaluations).toHaveBeenCalledWith({
            embryoId: 'embryo-a', signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('resolves only version IDs already present in evaluations', async () => {
        const queryClient = createTestQueryClient()
        getAssessmentVersionById.mockResolvedValue({ id: 'version-a' })
        const evaluations = [{ schemeVersionId: 'version-a' }, {
            schemeVersionId: 'version-a',
        }]
        const { result, unmount } = renderHook(
            () => useAssessmentVersionsQueries({
                organizationId: 'organization-a', evaluations,
            }),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true))
        expect(result.current).toHaveLength(1)
        expect(getAssessmentVersionById).toHaveBeenCalledTimes(1)
        expect(getAssessmentVersionById).toHaveBeenCalledWith({
            schemeVersionId: 'version-a',
            signal: expect.any(AbortSignal),
        })

        unmount()
        queryClient.clear()
    })

    test('cancels Organization A and never exposes its Embryos in B', async () => {
        const queryClient = createTestQueryClient()
        let firstSignal
        let resolveFirst
        getEmbryos
            .mockImplementationOnce(({ signal }) => {
                firstSignal = signal
                return new Promise(resolve => {
                    resolveFirst = resolve
                })
            })
            .mockResolvedValueOnce({
                items: [{ id: 'embryo-b' }], page: 0, size: 20,
            })
        const { result, rerender, unmount } = renderHook(
            ({ organizationId }) => useEmbryosQuery({
                organizationId,
                matingId: 'mating-a',
            }),
            {
                initialProps: { organizationId: 'organization-a' },
                wrapper: createWrapper(queryClient),
            }
        )

        await waitFor(() => expect(firstSignal).toBeDefined())
        rerender({ organizationId: 'organization-b' })
        await waitFor(() => {
            expect(result.current.data?.pages[0].items[0].id).toBe('embryo-b')
        })
        expect(firstSignal.aborted).toBe(true)

        resolveFirst({ items: [{ id: 'stale-a' }], page: 0, size: 20 })
        await act(async () => Promise.resolve())
        expect(result.current.data.pages[0].items[0].id).toBe('embryo-b')

        unmount()
        queryClient.clear()
    })
})
