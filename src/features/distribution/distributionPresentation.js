import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const formatDistributionTimestamp = (value, fallback = 'Não informado') => {
    if (typeof value !== 'string' || !value.trim()) return fallback
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
}

export const formatShipmentStatus = (status) => ({
    DRAFT: 'Rascunho',
    SHIPPED: 'Despachado',
    CANCELLED: 'Cancelado',
}[status] ?? status)

const genericMessage = (error, resource) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) return null
    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''
    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return `Você não tem permissão para consultar ${resource}.`
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return `${resource} não encontrado nesta organização.`
        case TARGET_ERROR_KINDS.VALIDATION:
            return `A consulta de ${resource} não é válida.`
        case TARGET_ERROR_KINDS.NETWORK:
            return 'Não foi possível conectar ao servidor. Tente novamente.'
        case TARGET_ERROR_KINDS.TIMEOUT:
            return 'O servidor demorou para responder. Tente novamente.'
        default:
            return `Não foi possível concluir a consulta.${reference}`
    }
}

export const getShipmentErrorMessage = (error) => {
    if (error?.code === 'SHIPMENT_NOT_FOUND') {
        return 'Shipment não encontrado nesta organização.'
    }
    if (error?.code === 'MOVEMENT_DATE_REQUIRED') {
        return 'Informe o momento do movimento para calcular a readiness.'
    }
    if (error?.code === 'MOVEMENT_DOCUMENT_REQUIREMENTS_UNVERIFIED') {
        return 'Os requisitos documentais regulatórios ainda não foram verificados.'
    }
    if (error?.code === 'INVALID_PAGE') return 'A página solicitada não é válida.'
    return genericMessage(error, 'o Shipment')
}

export const getRecallErrorMessage = (error) => {
    if (error?.code === 'RECALL_NOT_FOUND') {
        return 'Recall não encontrado nesta organização.'
    }
    if (error?.code === 'INVALID_RECALL_ANALYSIS_CUTOFF') {
        return 'O corte deve estar entre a abertura do Recall e o momento atual.'
    }
    if (error?.code === 'INVALID_PAGE') return 'A página solicitada não é válida.'
    return genericMessage(error, 'o Recall')
}
