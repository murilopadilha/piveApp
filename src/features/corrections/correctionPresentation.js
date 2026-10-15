import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const formatCorrectionTimestamp = (
    value,
    fallback = 'Não informado'
) => {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }
    const date = new Date(value)

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('pt-BR')
}

export const formatCorrectionStatus = (status) => {
    switch (status) {
        case 'REQUESTED':
            return 'Solicitação registrada'
        case 'REJECTED':
            return 'Rejeitada'
        default:
            return status
    }
}

export const formatHistoricalSemantics = (value) => {
    if (typeof value !== 'string') {
        return 'Não informado'
    }

    try {
        return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
        return value
    }
}

export const getCorrectionErrorMessage = (error) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }
    if (error.code === 'CORRECTION_SUBJECT_NOT_FOUND') {
        return 'Solicitação de correção não encontrada nesta organização.'
    }
    if (error.code === 'INVALID_PAGE') {
        return 'A página solicitada não é válida.'
    }
    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar solicitações de correção.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return 'Solicitação de correção não encontrada nesta organização.'
        case TARGET_ERROR_KINDS.VALIDATION:
            return 'A consulta de solicitações de correção não é válida.'
        case TARGET_ERROR_KINDS.NETWORK:
            return 'Não foi possível conectar ao servidor. Tente novamente.'
        case TARGET_ERROR_KINDS.TIMEOUT:
            return 'O servidor demorou para responder. Tente novamente.'
        default:
            return `Não foi possível concluir a consulta.${reference}`
    }
}
