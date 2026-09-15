import { AxiosError } from 'axios'

import {
    TARGET_ERROR_KINDS,
    normalizeTargetApiError,
} from '../problemDetails'

describe('normalizeTargetApiError', () => {
    test.each([
        [400, TARGET_ERROR_KINDS.VALIDATION],
        [401, TARGET_ERROR_KINDS.UNAUTHORIZED],
        [403, TARGET_ERROR_KINDS.FORBIDDEN],
        [404, TARGET_ERROR_KINDS.NOT_FOUND],
        [409, TARGET_ERROR_KINDS.CONFLICT],
        [412, TARGET_ERROR_KINDS.PRECONDITION],
        [422, TARGET_ERROR_KINDS.VALIDATION],
        [500, TARGET_ERROR_KINDS.UNEXPECTED],
    ])('maps HTTP %s to %s', (status, kind) => {
        expect(normalizeTargetApiError({
            response: {
                status,
                data: { title: 'Problem', detail: 'Safe detail' },
            },
        })).toMatchObject({
            kind,
            status,
            title: 'Problem',
            detail: 'Safe detail',
            isCanceled: false,
        })
    })

    test('preserves documented Problem Details extensions', () => {
        const fieldErrors = [{ field: 'name', message: 'Required' }]
        const conflict = { expectedVersion: 3, currentVersion: 4 }

        expect(normalizeTargetApiError({
            response: {
                status: 409,
                data: {
                    title: 'Conflict',
                    detail: 'Resource changed',
                    type: 'https://example.test/problems/stale-version',
                    instance: '/clients/client-1',
                    code: 'STALE_VERSION',
                    traceId: 'trace-7',
                    fieldErrors,
                    conflict,
                    currentVersion: 4,
                },
                headers: { 'retry-after': '5' },
            },
        })).toEqual({
            kind: TARGET_ERROR_KINDS.CONFLICT,
            status: 409,
            title: 'Conflict',
            detail: 'Resource changed',
            problemType: 'https://example.test/problems/stale-version',
            instance: '/clients/client-1',
            code: 'STALE_VERSION',
            traceId: 'trace-7',
            fieldErrors,
            conflict,
            version: 4,
            retryAfter: '5',
            isCanceled: false,
        })
    })

    test('reads version and retry metadata from standard headers', () => {
        expect(normalizeTargetApiError({
            response: {
                status: 412,
                data: {},
                headers: {
                    ETag: '"version-8"',
                    'Retry-After': '10',
                },
            },
        }, 'Refresh required')).toMatchObject({
            kind: TARGET_ERROR_KINDS.PRECONDITION,
            detail: 'Refresh required',
            version: '"version-8"',
            retryAfter: '10',
        })
    })

    test('normalizes cancellation without exposing the original error', () => {
        const normalized = normalizeTargetApiError({
            code: AxiosError.ERR_CANCELED,
            message: 'internal cancellation detail',
            stack: 'internal stack',
        })

        expect(normalized).toMatchObject({
            kind: TARGET_ERROR_KINDS.CANCELED,
            status: null,
            isCanceled: true,
        })
        expect(JSON.stringify(normalized)).not.toContain('internal')
    })

    test.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
        'normalizes timeout %s',
        code => {
            expect(normalizeTargetApiError({ code })).toMatchObject({
                kind: TARGET_ERROR_KINDS.TIMEOUT,
                status: null,
                isCanceled: false,
            })
        }
    )

    test('normalizes network and unexpected errors with safe details', () => {
        expect(normalizeTargetApiError({
            code: AxiosError.ERR_NETWORK,
        })).toMatchObject({
            kind: TARGET_ERROR_KINDS.NETWORK,
        })

        const normalized = normalizeTargetApiError(
            new Error('database stack detail'),
            'Falha segura'
        )

        expect(normalized).toMatchObject({
            kind: TARGET_ERROR_KINDS.UNEXPECTED,
            detail: 'Falha segura',
        })
        expect(JSON.stringify(normalized)).not.toContain('database')
    })
})
