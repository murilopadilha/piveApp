import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const getOpuStatusLabel = status => ({
    DRAFT: 'Rascunho',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
}[status] ?? status)

export const getCollectionStatusLabel = status => ({
    RECORDED: 'Registrada',
    COMPLETED: 'Concluída',
}[status] ?? status)

export const getOpuOriginLabel = originType => ({
    MANUAL: 'Registro manual',
    IMPORT: 'Importação',
    API: 'Integração',
    AI_EXTRACTED_CONFIRMED: 'Extração confirmada',
    SYSTEM_DERIVED: 'Derivado pelo sistema',
}[originType] ?? originType)

export const formatOpuTimestamp = (value, fallback = 'Não informado') => {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('pt-BR')
}

export const getOpuErrorMessage = (
    error,
    notFoundMessage = 'OPU não encontrada nesta organização.'
) => {
    if (!error || error?.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }

    const reference = error?.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error?.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar OPUs.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return notFoundMessage
        case TARGET_ERROR_KINDS.VALIDATION:
            return 'A consulta enviada não é válida.'
        case TARGET_ERROR_KINDS.NETWORK:
            return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
        case TARGET_ERROR_KINDS.TIMEOUT:
            return 'O servidor demorou para responder. Tente novamente.'
        default:
            return `Não foi possível concluir a consulta.${reference}`
    }
}

const COMMAND_MESSAGES = Object.freeze({
    INVALID_OPU_SESSION: 'Revise os dados obrigatórios da OPU.',
    INVALID_TIMEZONE: 'Informe um fuso horário IANA válido.',
    INVALID_SESSION_TRANSITION: 'A OPU mudou de estado e esta ação não é mais permitida.',
    SESSION_CLOSED: 'A OPU está encerrada e não aceita novas coletas.',
    STALE_SESSION_VERSION: 'A OPU foi alterada por outra operação. Revise os dados atualizados.',
    INVALID_COLLECTION_BATCH: 'Inclua de uma a cem coletas válidas no lote.',
    INVALID_OOCYTE_COUNTS: 'Os counts devem ser inteiros não negativos e viáveis não podem exceder o total.',
    DUPLICATE_BATCH_ITEM: 'O lote contém itens duplicados.',
    DUPLICATE_COLLECTION_ID: 'O lote contém identificadores de coleta duplicados.',
    DUPLICATE_SESSION_DONOR: 'Uma doadora só pode ter uma coleta nesta OPU.',
    DONOR_NOT_FOUND: 'A doadora não foi encontrada nesta organização.',
    DONOR_NOT_ELIGIBLE: 'O animal não está elegível como doadora para esta coleta.',
    COLLECTION_BATCH_REJECTED: 'O lote foi rejeitado integralmente. Nenhuma coleta foi gravada.',
    COLLECTION_NOT_FOUND: 'A coleta não foi encontrada nesta organização.',
    STALE_COLLECTION_VERSION: 'A coleta foi alterada por outra operação. Revise os dados atualizados.',
    FINALIZED_COLLECTION_REQUIRES_CORRECTION: 'A coleta finalizada não pode ser corrigida neste fluxo.',
    CORRECTION_REASON_REQUIRED: 'Informe o motivo da correção.',
    BATCH_KEY_MISMATCH: 'A identidade do lote não corresponde à intenção enviada.',
    IDEMPOTENCY_KEY_REUSED: 'Esta intenção já foi usada com dados diferentes.',
    COMMAND_IN_PROGRESS: 'Esta operação ainda está sendo processada. Aguarde antes de tentar novamente.',
    CONCURRENT_WRITE_CONFLICT: 'Os dados foram alterados simultaneamente. Revise o estado atual.',
})

export const getOpuCommandErrorMessage = (error) => {
    if (!error || error?.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }

    if (COMMAND_MESSAGES[error.code]) {
        return COMMAND_MESSAGES[error.code]
    }

    if (error.kind === TARGET_ERROR_KINDS.NETWORK ||
        error.kind === TARGET_ERROR_KINDS.TIMEOUT) {
        return 'O resultado da operação é incerto. Tente novamente com a mesma intenção.'
    }

    if (error.kind === TARGET_ERROR_KINDS.FORBIDDEN) {
        return 'Você não tem permissão para executar esta ação.'
    }

    if (error.kind === TARGET_ERROR_KINDS.VALIDATION) {
        return 'Revise os dados informados antes de continuar.'
    }

    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    return `Não foi possível concluir a operação.${reference}`
}
