import targetApiClient from '../../../../api/target/client'
import {
    getAssessmentVersionById,
    getEmbryoById,
    getEmbryoEvaluations,
    getEmbryos,
    identifyEmbryos,
    mapEmbryo,
    normalizeEmbryoPageParams,
} from '../embryoApi'

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
    recordedAt: '2026-10-11T12:00:00Z',
    confirmedByUserId: null,
    confirmedAt: null,
    derivationReference: null,
}

const evaluation = {
    id: 'evaluation-a',
    embryoId: 'embryo-a',
    schemeVersionId: 'version-a',
    developmentStageCodeId: 'stage-a',
    qualityGradeCodeId: 'grade-a',
    evaluatedAt: '2026-10-11T13:00:00Z',
    evaluatorProfessionalId: null,
    notes: null,
    supersedesEvaluationId: null,
    provenance,
}

const embryo = {
    id: 'embryo-a',
    matingId: 'mating-a',
    humanCode: 'EMB-001',
    ownerId: null,
    identifiedAt: '2026-10-11T12:00:00Z',
    availability: 'AVAILABLE',
    preservation: 'FRESH',
    holds: [{
        id: 'hold-a',
        embryoId: 'embryo-a',
        type: 'QUALITY',
        reason: 'Review',
        openedBy: 'actor-a',
        openedAt: '2026-10-11T12:30:00Z',
        releasedBy: null,
        releasedAt: null,
        releaseReason: null,
    }],
    currentLocationId: null,
    currentEvaluation: evaluation,
    version: 0,
    provenance,
}

const assessmentVersion = {
    id: 'version-a',
    schemeId: 'scheme-a',
    versionLabel: '2026.1',
    effectiveFrom: null,
    status: 'PUBLISHED',
    publishedBy: 'actor-a',
    publishedAt: '2026-10-11T10:00:00Z',
    codes: [{
        id: 'stage-a',
        schemeVersionId: 'version-a',
        dimension: 'DEVELOPMENT_STAGE',
        code: 'MORULA',
        displayName: 'Mórula',
        sortOrder: 1,
    }, {
        id: 'grade-a',
        schemeVersionId: 'version-a',
        dimension: 'QUALITY_GRADE',
        code: 'A',
        displayName: 'Grau A',
        sortOrder: 2,
    }],
}

afterEach(() => {
    jest.clearAllMocks()
})

describe('target Embryo API', () => {
    test('lists by humanCode and matingId with the exact page envelope', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [embryo], page: 0, size: 20 },
        })

        await expect(getEmbryos({
            matingId: 'mating-a',
            query: ' emb ',
            page: 0,
            size: 20,
            signal,
        })).resolves.toMatchObject({
            items: [{
                id: 'embryo-a',
                availability: 'AVAILABLE',
                preservation: 'FRESH',
                currentLocationId: null,
                currentEvaluation: { id: 'evaluation-a' },
            }],
            page: 0,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/embryos', {
            params: {
                matingId: 'mating-a',
                q: 'emb',
                page: 0,
                size: 20,
            },
            signal,
        })
        expect(normalizeEmbryoPageParams()).not.toHaveProperty('status')
        expect(normalizeEmbryoPageParams()).not.toHaveProperty('ownerId')
    })

    test('loads detail by stable ID without collapsing state dimensions', async () => {
        targetApiClient.get.mockResolvedValueOnce({ data: embryo })

        await expect(getEmbryoById({ embryoId: 'embryo/a' }))
            .resolves.toMatchObject({
                id: 'embryo-a',
                ownerId: null,
                availability: 'AVAILABLE',
                preservation: 'FRESH',
                holds: [{ id: 'hold-a' }],
            })
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/embryos/embryo%2Fa',
            { signal: undefined }
        )
        expect(mapEmbryo(embryo)).not.toHaveProperty('embryoStatus')
        expect(mapEmbryo(embryo)).not.toHaveProperty('destiny')
    })

    test('loads evaluation history and resolves only a known version ID', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({ data: [evaluation] })
            .mockResolvedValueOnce({ data: assessmentVersion })

        await expect(getEmbryoEvaluations({ embryoId: 'embryo-a' }))
            .resolves.toEqual([expect.objectContaining({
                schemeVersionId: 'version-a',
                qualityGradeCodeId: 'grade-a',
            })])
        await expect(getAssessmentVersionById({ schemeVersionId: 'version-a' }))
            .resolves.toMatchObject({
                id: 'version-a',
                codes: [{ id: 'stage-a' }, { id: 'grade-a' }],
            })

        expect(targetApiClient.get.mock.calls).toEqual([
            ['/embryos/embryo-a/evaluations', { signal: undefined }],
            ['/assessment-schemes/versions/version-a', { signal: undefined }],
        ])
        expect(targetApiClient.get).not.toHaveBeenCalledWith(
            '/assessment-schemes',
            expect.anything()
        )
    })

    test('accepts an empty optional evaluation note from the backend', async () => {
        targetApiClient.get.mockResolvedValueOnce({
            data: [{ ...evaluation, notes: '' }],
        })

        await expect(getEmbryoEvaluations({ embryoId: 'embryo-a' }))
            .resolves.toEqual([
                expect.objectContaining({ notes: '' }),
            ])
    })

    test('posts one atomic identification batch with batch ID as key', async () => {
        const intent = {
            idempotencyKey: 'batch-a',
            payload: {
                batchId: 'batch-a',
                items: [{ itemId: 'item-a', id: 'embryo-a' }],
            },
        }
        targetApiClient.post.mockResolvedValueOnce({
            data: {
                batchId: 'batch-a',
                items: [{
                    itemId: 'item-a',
                    embryoId: 'embryo-a',
                    status: 'APPLIED',
                }],
            },
        })

        await expect(identifyEmbryos(intent)).resolves.toEqual({
            batchId: 'batch-a',
            items: [{
                itemId: 'item-a',
                embryoId: 'embryo-a',
                status: 'APPLIED',
            }],
        })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/embryos:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: 'batch-a' } }
        )
        expect(intent.payload).not.toHaveProperty('expectedMatingVersion')
    })

    test('validates only the implemented list parameters', () => {
        expect(() => normalizeEmbryoPageParams({
            query: 'x'.repeat(201), page: 0, size: 20,
        })).toThrow('Invalid Embryo page parameters.')
        expect(() => normalizeEmbryoPageParams({
            query: '', page: 0, size: 101,
        })).toThrow('Invalid Embryo page parameters.')
    })

    test('normalizes allocation and duplicate-code conflicts by code', async () => {
        targetApiClient.post
            .mockRejectedValueOnce({
                response: {
                    status: 422,
                    data: { code: 'EMBRYO_COUNT_EXCEEDS_ALLOCATION' },
                },
            })
            .mockRejectedValueOnce({
                response: {
                    status: 409,
                    data: { code: 'CONSTRAINT_CONFLICT' },
                },
            })

        await expect(identifyEmbryos({ payload: {} })).rejects.toMatchObject({
            code: 'EMBRYO_COUNT_EXCEEDS_ALLOCATION',
        })
        await expect(identifyEmbryos({ payload: {} })).rejects.toMatchObject({
            kind: 'conflict',
            code: 'CONSTRAINT_CONFLICT',
        })
    })
})
