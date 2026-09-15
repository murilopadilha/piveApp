import axios, { AxiosError } from 'axios'

export const TARGET_ERROR_KINDS = Object.freeze({
    VALIDATION: 'validation',
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',
    NOT_FOUND: 'notFound',
    CONFLICT: 'conflict',
    PRECONDITION: 'precondition',
    TIMEOUT: 'timeout',
    NETWORK: 'network',
    CANCELED: 'canceled',
    UNEXPECTED: 'unexpected',
})

const DEFAULT_DETAIL = 'Não foi possível concluir a operação.'

const HTTP_KIND_BY_STATUS = Object.freeze({
    400: TARGET_ERROR_KINDS.VALIDATION,
    401: TARGET_ERROR_KINDS.UNAUTHORIZED,
    403: TARGET_ERROR_KINDS.FORBIDDEN,
    404: TARGET_ERROR_KINDS.NOT_FOUND,
    409: TARGET_ERROR_KINDS.CONFLICT,
    412: TARGET_ERROR_KINDS.PRECONDITION,
    422: TARGET_ERROR_KINDS.VALIDATION,
})

const DEFAULT_TITLE_BY_KIND = Object.freeze({
    [TARGET_ERROR_KINDS.VALIDATION]: 'Dados inválidos',
    [TARGET_ERROR_KINDS.UNAUTHORIZED]: 'Sessão inválida',
    [TARGET_ERROR_KINDS.FORBIDDEN]: 'Acesso não permitido',
    [TARGET_ERROR_KINDS.NOT_FOUND]: 'Registro não encontrado',
    [TARGET_ERROR_KINDS.CONFLICT]: 'Conflito de atualização',
    [TARGET_ERROR_KINDS.PRECONDITION]: 'Dados desatualizados',
    [TARGET_ERROR_KINDS.TIMEOUT]: 'Tempo limite excedido',
    [TARGET_ERROR_KINDS.NETWORK]: 'Sem conexão com o servidor',
    [TARGET_ERROR_KINDS.CANCELED]: 'Requisição cancelada',
    [TARGET_ERROR_KINDS.UNEXPECTED]: 'Erro inesperado',
})

const isRecord = value => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
)

const asNonEmptyString = value => (
    typeof value === 'string' && value.trim() ? value : null
)

const readHeader = (headers, name) => {
    if (typeof headers?.get === 'function') {
        return headers.get(name) ?? null
    }

    const matchingKey = Object.keys(headers ?? {}).find(
        key => key.toLowerCase() === name.toLowerCase()
    )

    return matchingKey ? headers[matchingKey] : null
}

const createTargetError = ({
    kind,
    status = null,
    title,
    detail,
    problemType = null,
    instance = null,
    code = null,
    traceId = null,
    fieldErrors = [],
    conflict = null,
    version = null,
    retryAfter = null,
}) => ({
    kind,
    status,
    title: title || DEFAULT_TITLE_BY_KIND[kind],
    detail,
    problemType,
    instance,
    code,
    traceId,
    fieldErrors,
    conflict,
    version,
    retryAfter,
    isCanceled: kind === TARGET_ERROR_KINDS.CANCELED,
})

export const normalizeTargetApiError = (
    error,
    fallbackDetail = DEFAULT_DETAIL
) => {
    if (axios.isCancel(error) || error?.code === AxiosError.ERR_CANCELED) {
        return createTargetError({
            kind: TARGET_ERROR_KINDS.CANCELED,
            detail: 'A requisição foi cancelada.',
        })
    }

    if (
        error?.code === AxiosError.ECONNABORTED ||
        error?.code === AxiosError.ETIMEDOUT
    ) {
        return createTargetError({
            kind: TARGET_ERROR_KINDS.TIMEOUT,
            detail: 'A requisição excedeu o tempo limite.',
        })
    }

    if (error?.response) {
        const problem = isRecord(error.response.data) ? error.response.data : {}
        const status = error.response.status ?? problem.status ?? null
        const kind = HTTP_KIND_BY_STATUS[status] ?? TARGET_ERROR_KINDS.UNEXPECTED

        return createTargetError({
            kind,
            status,
            title: asNonEmptyString(problem.title),
            detail: asNonEmptyString(problem.detail) || fallbackDetail,
            problemType: asNonEmptyString(problem.type),
            instance: asNonEmptyString(problem.instance),
            code: asNonEmptyString(problem.code),
            traceId: asNonEmptyString(problem.traceId),
            fieldErrors: Array.isArray(problem.fieldErrors)
                ? problem.fieldErrors
                : [],
            conflict: isRecord(problem.conflict) ? problem.conflict : null,
            version: problem.version ?? problem.currentVersion ??
                readHeader(error.response.headers, 'etag'),
            retryAfter: problem.retryAfter ??
                readHeader(error.response.headers, 'retry-after'),
        })
    }

    if (error?.code === AxiosError.ERR_NETWORK || error?.request) {
        return createTargetError({
            kind: TARGET_ERROR_KINDS.NETWORK,
            detail: 'Não foi possível conectar ao servidor.',
        })
    }

    return createTargetError({
        kind: TARGET_ERROR_KINDS.UNEXPECTED,
        detail: fallbackDetail,
    })
}
