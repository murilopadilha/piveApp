import targetApiClient from '../../../../api/target/client'
import {
    correctOocyteCollection,
    dryRunOpuCollections,
    getOocyteCollectionById,
    getOocyteCollectionDonorSnapshot,
    getOpuSessionById,
    getOpuSessionCollections,
    getOpuSessionSummary,
    getOpuSessions,
    mapOocyteCollection,
    mapOpuSession,
    normalizeOpuPageParams,
    openOpuSession,
    recordOpuCollections,
    transitionOpuSession,
} from '../opuApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}))

const provenance = {
    originType: 'MANUAL',
    sourceDocumentId: null,
    importBatchId: null,
    apiClientId: null,
    recordedByUserId: 'actor-a',
    recordedAt: '2026-10-09T12:00:00Z',
    confirmedByUserId: null,
    confirmedAt: null,
    derivationReference: null,
}

const sessionView = {
    registration: {
        id: 'opu-a',
        establishmentId: 'establishment-a',
        operationalLocationId: null,
        farmPropertyId: 'farm-a',
        clientId: null,
        leadProfessionalId: 'professional-a',
        performedAt: '2026-10-09T10:00:00Z',
        timezone: 'America/Sao_Paulo',
        notes: null,
    },
    status: 'IN_PROGRESS',
    version: 1,
    provenance,
    completedAt: null,
    completedBy: null,
}

const collectionView = {
    sessionId: 'opu-a',
    registration: {
        id: 'collection-a',
        donorId: 'animal-a',
        collectedAt: '2026-10-09T11:00:00Z',
        counts: {
            totalRecovered: 8,
            viable: 5,
            folliclesAspirated: 0,
        },
        notes: null,
    },
    status: 'RECORDED',
    version: 0,
    provenance,
}

describe('target OPU read API', () => {
    test('maps the implemented OPU session view and page contract', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [sessionView], page: 2, size: 20 },
        })

        await expect(getOpuSessions({ page: 2, size: 20, signal })).resolves.toEqual({
            items: [expect.objectContaining({
                id: 'opu-a',
                status: 'IN_PROGRESS',
                version: 1,
                establishmentId: 'establishment-a',
            })],
            page: 2,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/opu-sessions', {
            params: { page: 2, size: 20 },
            signal,
        })
        expect(mapOpuSession(sessionView)).not.toHaveProperty('protocolId')
        expect(mapOpuSession(sessionView)).not.toHaveProperty('fivId')
    })

    test('loads session detail and summary by encoded stable ID', async () => {
        const signal = new AbortController().signal
        targetApiClient.get
            .mockResolvedValueOnce({ data: sessionView })
            .mockResolvedValueOnce({
                data: {
                    id: 'opu-a',
                    status: 'IN_PROGRESS',
                    collections: 1,
                    totalRecovered: 8,
                    viable: 5,
                    farmSnapshot: {
                        id: 'farm-a',
                        name: 'Fazenda Aurora',
                        address: {
                            addressLine: 'Estrada 1',
                            municipality: 'Cidade',
                            state: 'SP',
                            country: 'BR',
                            postalCode: null,
                        },
                        municipalityCode: null,
                        internalCode: null,
                        ownerId: null,
                        operatorId: null,
                        version: 0,
                    },
                },
            })

        await getOpuSessionById({ opuSessionId: 'opu/a', signal })
        await expect(getOpuSessionSummary({
            opuSessionId: 'opu/a', signal,
        })).resolves.toMatchObject({
            collections: 1,
            totalRecovered: 8,
            viable: 5,
            farmSnapshot: { name: 'Fazenda Aurora' },
        })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            1,
            '/opu-sessions/opu%2Fa',
            { signal }
        )
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2,
            '/opu-sessions/opu%2Fa/summary',
            { signal }
        )
    })

    test('keeps collections paged and separate from the session DTO', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [collectionView], page: 1, size: 10 },
        })

        await expect(getOpuSessionCollections({
            opuSessionId: 'opu-a', page: 1, size: 10, signal,
        })).resolves.toMatchObject({
            items: [{
                id: 'collection-a',
                sessionId: 'opu-a',
                donorId: 'animal-a',
                totalRecovered: 8,
                viable: 5,
                folliclesAspirated: 0,
            }],
            page: 1,
            size: 10,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/opu-sessions/opu-a/collections',
            { params: { page: 1, size: 10 }, signal }
        )
        expect(mapOocyteCollection(collectionView)).not.toHaveProperty('oocytes')
        expect(mapOocyteCollection(collectionView)).not.toHaveProperty('sireId')
    })

    test('loads collection and frozen donor snapshot through distinct endpoints', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({ data: collectionView })
            .mockResolvedValueOnce({
                data: {
                    id: 'animal-a',
                    name: null,
                    sex: 'FEMALE',
                    status: 'ACTIVE',
                    version: 4,
                    identifiers: [{
                        type: 'EAR_TAG', issuer: null, value: '0042',
                    }],
                },
            })

        await expect(getOocyteCollectionById({
            oocyteCollectionId: 'collection-a',
        })).resolves.toMatchObject({ id: 'collection-a', donorId: 'animal-a' })
        await expect(getOocyteCollectionDonorSnapshot({
            oocyteCollectionId: 'collection-a',
        })).resolves.toEqual({
            id: 'animal-a',
            name: null,
            sex: 'FEMALE',
            status: 'ACTIVE',
            version: 4,
            identifiers: [{ type: 'EAR_TAG', issuer: null, value: '0042' }],
        })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2,
            '/oocyte-collections/collection-a/donor-snapshot',
            { signal: undefined }
        )
    })

    test('validates only the implemented page bounds', () => {
        expect(normalizeOpuPageParams()).toEqual({ page: 0, size: 20 })
        expect(() => normalizeOpuPageParams({ page: -1 })).toThrow(TypeError)
        expect(() => normalizeOpuPageParams({ page: 10001 })).toThrow(TypeError)
        expect(() => normalizeOpuPageParams({ size: 0 })).toThrow(TypeError)
        expect(() => normalizeOpuPageParams({ size: 101 })).toThrow(TypeError)
        expect(normalizeOpuPageParams()).not.toHaveProperty('q')
        expect(normalizeOpuPageParams()).not.toHaveProperty('status')
    })

    test('normalizes permission, wrong-tenant, network and cancellation errors', async () => {
        targetApiClient.get
            .mockRejectedValueOnce({ response: { status: 403, data: { code: 'ACCESS_DENIED' } } })
            .mockRejectedValueOnce({ response: { status: 404, data: { code: 'OPU_SESSION_NOT_FOUND' } } })
            .mockRejectedValueOnce({ code: 'ERR_NETWORK', request: {} })
            .mockRejectedValueOnce({ code: 'ERR_CANCELED' })

        await expect(getOpuSessions({ page: 0 })).rejects.toMatchObject({
            kind: 'forbidden',
        })
        await expect(getOpuSessionById({ opuSessionId: 'missing' })).rejects.toMatchObject({
            kind: 'notFound', code: 'OPU_SESSION_NOT_FOUND',
        })
        await expect(getOpuSessions({ page: 0 })).rejects.toMatchObject({
            kind: 'network',
        })
        await expect(getOpuSessions({ page: 0 })).rejects.toMatchObject({
            kind: 'canceled',
        })
    })

    test('rejects malformed DTOs instead of inventing fields', () => {
        expect(() => mapOpuSession({
            ...sessionView,
            registration: { id: 'opu-a' },
        })).toThrow(TypeError)
        expect(() => mapOocyteCollection({
            ...collectionView,
            registration: {
                ...collectionView.registration,
                counts: { totalRecovered: 8 },
            },
        })).toThrow(TypeError)
    })
})

describe('target OPU command API', () => {
    const command = {
        idempotencyKey: 'command-key',
        payload: { expectedVersion: 1 },
    }

    test('opens a session with the exact payload and idempotency context', async () => {
        const intent = {
            idempotencyKey: 'open-key',
            payload: sessionView.registration,
        }
        targetApiClient.post.mockResolvedValueOnce({ data: sessionView })

        await expect(openOpuSession(intent)).resolves.toMatchObject({ id: 'opu-a' })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/opu-sessions',
            intent.payload,
            { targetContext: { idempotencyKey: 'open-key' } }
        )
    })

    test.each(['start', 'cancel', 'complete'])(
        'uses expectedVersion in the %s command body',
        async (action) => {
            targetApiClient.post.mockResolvedValueOnce({ data: sessionView })

            await transitionOpuSession({
                ...command,
                action,
                opuSessionId: 'opu/a',
            })

            expect(targetApiClient.post).toHaveBeenCalledWith(
                `/opu-sessions/opu%2Fa:${action}`,
                { expectedVersion: 1 },
                { targetContext: { idempotencyKey: 'command-key' } }
            )
        }
    )

    test('keeps dry-run non-writing and bulk atomic under batch identity', async () => {
        const result = {
            batchId: 'batch-id',
            dryRun: true,
            items: [{
                itemId: 'item-id',
                collectionId: 'collection-id',
                status: 'VALID',
                errorCode: null,
            }],
        }
        const intent = {
            idempotencyKey: 'batch-id',
            opuSessionId: 'opu-a',
            payload: { batchId: 'batch-id', expectedSessionVersion: 1, items: [] },
        }
        targetApiClient.post
            .mockResolvedValueOnce({ data: result })
            .mockResolvedValueOnce({ data: { ...result, dryRun: false } })

        await expect(dryRunOpuCollections(intent)).resolves.toMatchObject({
            batchId: 'batch-id', dryRun: true,
        })
        await expect(recordOpuCollections(intent)).resolves.toMatchObject({
            batchId: 'batch-id', dryRun: false,
        })
        expect(targetApiClient.post).toHaveBeenNthCalledWith(
            1,
            '/opu-sessions/opu-a/collections:dry-run',
            intent.payload
        )
        expect(targetApiClient.post).toHaveBeenNthCalledWith(
            2,
            '/opu-sessions/opu-a/collections:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: 'batch-id' } }
        )
    })

    test('corrects only the selected collection with expectedVersion in payload', async () => {
        const intent = {
            idempotencyKey: 'correction-key',
            oocyteCollectionId: 'collection/a',
            payload: {
                expectedVersion: 0,
                counts: { totalRecovered: 8, viable: 5, folliclesAspirated: 0 },
                notes: null,
                reason: 'Conferência',
            },
        }
        targetApiClient.post.mockResolvedValueOnce({ data: collectionView })

        await correctOocyteCollection(intent)

        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/oocyte-collections/collection%2Fa:correct',
            intent.payload,
            { targetContext: { idempotencyKey: 'correction-key' } }
        )
    })
})
