import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const getDataQualitySeverityTone = (severity) => {
    if (severity === 'ERROR') return 'error'
    if (severity === 'INFO') return 'info'
    return 'neutral'
}

export const getDataQualityErrorMessage = (error) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }
    if (error.code === 'INVALID_PAGE') {
        return 'A busca ou página solicitada não é válida.'
    }
    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar qualidade de dados.'
        case TARGET_ERROR_KINDS.VALIDATION:
            return 'A consulta de qualidade de dados não é válida.'
        case TARGET_ERROR_KINDS.NETWORK:
            return 'Não foi possível conectar ao servidor. Tente novamente.'
        case TARGET_ERROR_KINDS.TIMEOUT:
            return 'O servidor demorou para responder. Tente novamente.'
        default:
            return `Não foi possível concluir a consulta.${reference}`
    }
}
