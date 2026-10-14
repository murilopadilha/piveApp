import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const formatDocumentTimestamp = (
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

export const formatDocumentSize = (sizeBytes) => {
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
        return 'Não informado'
    }
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`
    }
    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KiB`
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MiB`
}

export const getDocumentErrorMessage = (error) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }
    if (error.code === 'DOCUMENT_NOT_FOUND') {
        return 'Documento não encontrado nesta organização.'
    }
    if (error.code === 'INVALID_PAGE') {
        return 'A página solicitada não é válida.'
    }
    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar documentos.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return 'Documento não encontrado nesta organização.'
        case TARGET_ERROR_KINDS.VALIDATION:
            return 'A consulta de documentos não é válida.'
        case TARGET_ERROR_KINDS.NETWORK:
            return 'Não foi possível conectar ao servidor. Tente novamente.'
        case TARGET_ERROR_KINDS.TIMEOUT:
            return 'O servidor demorou para responder. Tente novamente.'
        default:
            return `Não foi possível concluir a consulta.${reference}`
    }
}
