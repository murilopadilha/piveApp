import targetApiClient from '../../../../api/target/client'
import {
    CORRECTION_SUBJECT_TYPES,
    getCorrectionById,
    getCorrectionImpact,
    getCorrections,
    mapCorrection,
    mapCorrectionImpact,
    normalizeCorrectionPageParams,
} from '../correctionApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}))

const correction = {
    id: 'correction-a',
    subjectType: 'MATING',
    subjectId: 'mating-a',
    reason: 'Revisar origem histórica',
    previousSemantics: '{"semenBatchId":"batch-a"}',
    proposedSemantics: '{"semantics":"Revisar origem"}',
    subjectVersion: 3,
    status: 'REQUESTED',
    requestedAt: '2026-10-15T10:00:00Z',
}

const impact = {
    affectedEmbryos: 2,
    activePackages: 1,
    performedTransfers: 1,
    applicationBlocker: 'BLOCKED_BY_DOMAIN_VALIDATION_APPROVAL_AND_REMEDIATION_POLICY',
}

afterEach(() => jest.clearAllMocks())

describe('M7C1 target Correction API', () => {
    test('lists corrections using page and size only and preserves backend order', async () => {
        const second = { ...correction, id: 'correction-b', subjectId: 'mating-b' }
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [correction, second], page: 0, size: 20 },
        })

        await expect(getCorrections({ page: 0, size: 20, signal }))
            .resolves.toEqual({ items: [correction, second], page: 0, size: 20 })
        expect(targetApiClient.get).toHaveBeenCalledWith('/corrections', {
            params: { page: 0, size: 20 },
            signal,
        })
        expect(normalizeCorrectionPageParams()).toEqual({ page: 0, size: 20 })
        expect(normalizeCorrectionPageParams()).not.toHaveProperty('q')
        expect(normalizeCorrectionPageParams()).not.toHaveProperty('subjectType')
        expect(normalizeCorrectionPageParams()).not.toHaveProperty('status')
    })

    test('loads detail by stable ID and exposes only public View fields', async () => {
        targetApiClient.get.mockResolvedValueOnce({
            data: {
                ...correction,
                requestedBy: 'actor-a',
                sourceDocumentId: 'source-a',
                rejectionReason: 'not public',
                reviewer: 'actor-b',
                reviewedAt: '2026-10-15T11:00:00Z',
                reviewId: 'review-a',
            },
        })

        await expect(getCorrectionById({ correctionId: 'correction/a' }))
            .resolves.toEqual(correction)
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/corrections/correction%2Fa',
            { signal: undefined }
        )
        expect(mapCorrection(correction)).not.toHaveProperty('requestedBy')
        expect(mapCorrection(correction)).not.toHaveProperty('sourceDocumentId')
        expect(mapCorrection(correction)).not.toHaveProperty('rejectionReason')
        expect(mapCorrection(correction)).not.toHaveProperty('reviewer')
        expect(mapCorrection(correction)).not.toHaveProperty('reviewedAt')
        expect(mapCorrection(correction)).not.toHaveProperty('reviewId')
    })

    test.each(CORRECTION_SUBJECT_TYPES)(
        'preserves supported subject type %s',
        (subjectType) => {
            expect(mapCorrection({ ...correction, subjectType }).subjectType)
                .toBe(subjectType)
        }
    )

    test('accepts nullable subjectVersion without inventing version zero', () => {
        expect(mapCorrection({ ...correction, subjectVersion: null }))
            .toEqual({ ...correction, subjectVersion: null })
        expect(() => mapCorrection({ ...correction, subjectVersion: -1 }))
            .toThrow(TypeError)
    })

    test('loads the exact current-impact endpoint and fields', async () => {
        targetApiClient.get.mockResolvedValueOnce({ data: impact })

        await expect(getCorrectionImpact({ correctionId: 'correction/a' }))
            .resolves.toEqual(impact)
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/corrections/correction%2Fa/impact',
            { signal: undefined }
        )
        expect(mapCorrectionImpact(impact)).toEqual(impact)
        expect(mapCorrectionImpact({ ...impact, ignoredIds: ['embryo-a'] }))
            .not.toHaveProperty('ignoredIds')
    })

    test('normalizes wrong-tenant correction not found without distinguishing it', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 404,
                data: {
                    code: 'CORRECTION_SUBJECT_NOT_FOUND',
                    traceId: 'trace-a',
                },
            },
        })

        await expect(getCorrectionById({ correctionId: 'correction-a' }))
            .rejects.toMatchObject({
                kind: 'notFound',
                code: 'CORRECTION_SUBJECT_NOT_FOUND',
                traceId: 'trace-a',
            })
    })

    test('rejects invented subject types, totals and malformed contracts', () => {
        expect(() => mapCorrection({ ...correction, subjectType: 'OTHER' }))
            .toThrow(TypeError)
        expect(() => normalizeCorrectionPageParams({ page: -1, size: 20 }))
            .toThrow(TypeError)
        expect(() => normalizeCorrectionPageParams({ page: 0, size: 101 }))
            .toThrow(TypeError)
        expect(() => mapCorrectionImpact({ ...impact, affectedEmbryos: -1 }))
            .toThrow(TypeError)
    })
})
