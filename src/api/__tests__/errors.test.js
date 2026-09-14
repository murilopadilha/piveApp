import { AxiosError } from 'axios'

import { API_ERROR_TYPES, normalizeApiError } from '../errors'

describe('normalizeApiError', () => {
    test('normalizes cancellation', () => {
        const error = { code: AxiosError.ERR_CANCELED, message: 'stopped' }

        expect(normalizeApiError(error)).toEqual({
            type: API_ERROR_TYPES.CANCELED,
            message: 'stopped',
            status: null,
            data: null,
            isCanceled: true,
        })
    })

    test.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
        'normalizes timeout code %s',
        code => {
            expect(normalizeApiError({ code })).toEqual({
                type: API_ERROR_TYPES.TIMEOUT,
                message: 'A requisição excedeu o tempo limite.',
                status: null,
                data: null,
                isCanceled: false,
            })
        }
    )

    test('uses a string HTTP response as the message', () => {
        const responseData = 'Falha de validação'

        expect(normalizeApiError({
            message: 'Request failed',
            response: { status: 422, data: responseData },
        })).toEqual({
            type: API_ERROR_TYPES.HTTP,
            message: responseData,
            status: 422,
            data: responseData,
            isCanceled: false,
        })
    })

    test('uses the message field from an HTTP response object', () => {
        const responseData = { message: 'Registro duplicado', code: 'DUPLICATE' }

        expect(normalizeApiError({
            response: { status: 409, data: responseData },
        })).toEqual({
            type: API_ERROR_TYPES.HTTP,
            message: 'Registro duplicado',
            status: 409,
            data: responseData,
            isCanceled: false,
        })
    })

    test('falls back when an HTTP error has no usable message', () => {
        expect(normalizeApiError({
            response: { status: 500, data: {} },
        }, 'Falha conhecida')).toMatchObject({
            type: API_ERROR_TYPES.HTTP,
            message: 'Falha conhecida',
            status: 500,
            data: {},
            isCanceled: false,
        })
    })

    test.each([
        { code: AxiosError.ERR_NETWORK },
        { request: {} },
    ])('normalizes network failures', error => {
        expect(normalizeApiError(error)).toEqual({
            type: API_ERROR_TYPES.NETWORK,
            message: 'Não foi possível conectar ao servidor.',
            status: null,
            data: null,
            isCanceled: false,
        })
    })

    test('uses an unexpected error message when available', () => {
        expect(normalizeApiError(new Error('Unexpected failure'))).toEqual({
            type: API_ERROR_TYPES.UNEXPECTED,
            message: 'Unexpected failure',
            status: null,
            data: null,
            isCanceled: false,
        })
    })

    test('uses the supplied fallback for an unknown value', () => {
        expect(normalizeApiError(null, 'Fallback seguro')).toEqual({
            type: API_ERROR_TYPES.UNEXPECTED,
            message: 'Fallback seguro',
            status: null,
            data: null,
            isCanceled: false,
        })
    })
})
