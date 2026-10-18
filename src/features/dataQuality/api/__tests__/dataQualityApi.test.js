import targetApiClient from '../../../../api/target/client'
import {
    getDataQualityIssues,
    mapDataQualityIssue,
    mapDataQualityPage,
    normalizeDataQualitySearchParams,
} from '../dataQualityApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}))

const embryoIssue = {
    subjectType: 'EMBRYO',
    subjectId: 'embryo-a',
    code: 'ASSESSMENT_NOT_RECORDED',
    severity: 'INFO',
}

const packageIssue = {
    subjectType: 'PACKAGE',
    subjectId: 'package-a',
    code: 'INVENTORY_PROJECTION_MISMATCH',
    severity: 'ERROR',
}

afterEach(() => jest.clearAllMocks())

describe('M9A target Data Quality API', () => {
    test('calls the exact GET path with trimmed q, page and size only', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [embryoIssue], page: 2, size: 20 },
        })

        await expect(getDataQualityIssues({
            query: ' ASSESSMENT_NOT_RECORDED ',
            page: 2,
            size: 20,
            signal,
        })).resolves.toEqual({ items: [embryoIssue], page: 2, size: 20 })
        expect(targetApiClient.get).toHaveBeenCalledWith('/data-quality', {
            params: {
                q: 'ASSESSMENT_NOT_RECORDED',
                page: 2,
                size: 20,
            },
            signal,
        })
        expect(targetApiClient.get.mock.calls[0][1].params)
            .toEqual(expect.not.objectContaining({
                subjectType: expect.anything(),
                severity: expect.anything(),
                total: expect.anything(),
            }))
    })

    test('preserves backend order and exact public DTO fields', () => {
        const page = mapDataQualityPage({
            items: [
                { ...embryoIssue, priority: 'HIGH', resolved: false },
                { ...packageIssue, assignee: 'actor-a' },
            ],
            page: 0,
            size: 20,
            total: 2,
        })

        expect(page).toEqual({
            items: [embryoIssue, packageIssue],
            page: 0,
            size: 20,
        })
        expect(page).not.toHaveProperty('total')
        expect(page.items[0]).not.toHaveProperty('priority')
        expect(page.items[0]).not.toHaveProperty('resolved')
        expect(page.items[1]).not.toHaveProperty('assignee')
    })

    test('accepts future legitimate subject, code and severity values', () => {
        expect(mapDataQualityIssue({
            subjectType: 'FUTURE_SUBJECT',
            subjectId: 'future-a',
            code: 'FUTURE_SIGNAL',
            severity: 'NOTICE',
        })).toEqual({
            subjectType: 'FUTURE_SUBJECT',
            subjectId: 'future-a',
            code: 'FUTURE_SIGNAL',
            severity: 'NOTICE',
        })
    })

    test('enforces q and page limits before making a request', async () => {
        expect(() => normalizeDataQualitySearchParams({
            query: 'a'.repeat(201), page: 0, size: 20,
        })).toThrow(TypeError)
        expect(() => normalizeDataQualitySearchParams({
            query: '', page: 10001, size: 20,
        })).toThrow(TypeError)
        expect(() => normalizeDataQualitySearchParams({
            query: '', page: 0, size: 101,
        })).toThrow(TypeError)

        await expect(getDataQualityIssues({ query: 'a'.repeat(201) }))
            .rejects.toMatchObject({ kind: 'unexpected' })
        expect(targetApiClient.get).not.toHaveBeenCalled()
    })

    test('normalizes access and validation Problem Details', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 403,
                data: { code: 'ACCESS_DENIED', traceId: 'trace-a' },
            },
        })
        await expect(getDataQualityIssues()).rejects.toMatchObject({
            kind: 'forbidden',
            code: 'ACCESS_DENIED',
            traceId: 'trace-a',
        })

        targetApiClient.get.mockRejectedValueOnce({
            response: {
                status: 422,
                data: { code: 'INVALID_PAGE', traceId: 'trace-b' },
            },
        })
        await expect(getDataQualityIssues()).rejects.toMatchObject({
            kind: 'validation',
            code: 'INVALID_PAGE',
            traceId: 'trace-b',
        })
    })

    test('rejects malformed response contracts', () => {
        expect(() => mapDataQualityIssue({ ...embryoIssue, code: '' }))
            .toThrow(TypeError)
        expect(() => mapDataQualityPage({ items: {}, page: 0, size: 20 }))
            .toThrow(TypeError)
    })
})
