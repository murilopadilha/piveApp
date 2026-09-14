import axios, { AxiosError } from 'axios'

export const API_ERROR_TYPES = Object.freeze({
    HTTP: 'http',
    TIMEOUT: 'timeout',
    NETWORK: 'network',
    CANCELED: 'canceled',
    UNEXPECTED: 'unexpected',
})

const isCanceledError = (error) => (
    axios.isCancel(error) || error?.code === AxiosError.ERR_CANCELED
)

const getResponseMessage = (data) => {
    if (typeof data === 'string' && data.trim()) {
        return data
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message
    }

    return null
}

export const normalizeApiError = (
    error,
    fallbackMessage = 'Não foi possível concluir a operação.'
) => {
    if (isCanceledError(error)) {
        return {
            type: API_ERROR_TYPES.CANCELED,
            message: error?.message || 'Requisição cancelada.',
            status: null,
            data: null,
            isCanceled: true,
        }
    }

    if (
        error?.code === AxiosError.ECONNABORTED ||
        error?.code === AxiosError.ETIMEDOUT
    ) {
        return {
            type: API_ERROR_TYPES.TIMEOUT,
            message: 'A requisição excedeu o tempo limite.',
            status: null,
            data: null,
            isCanceled: false,
        }
    }

    if (error?.response) {
        const responseData = error.response.data

        return {
            type: API_ERROR_TYPES.HTTP,
            message: getResponseMessage(responseData) || error?.message || fallbackMessage,
            status: error.response.status ?? null,
            data: responseData ?? null,
            isCanceled: false,
        }
    }

    if (error?.code === AxiosError.ERR_NETWORK || error?.request) {
        return {
            type: API_ERROR_TYPES.NETWORK,
            message: 'Não foi possível conectar ao servidor.',
            status: null,
            data: null,
            isCanceled: false,
        }
    }

    return {
        type: API_ERROR_TYPES.UNEXPECTED,
        message: error?.message || fallbackMessage,
        status: null,
        data: null,
        isCanceled: false,
    }
}
