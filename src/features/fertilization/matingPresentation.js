import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const getMatingStatusLabel = status => ({
    FERTILIZED: 'Fertilização registrada',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
}[status] ?? status)

export const formatMatingTimestamp = (value, fallback = 'Não informado') => {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('pt-BR')
}

export const getMatingErrorMessage = (
    error,
    notFoundMessage = 'Alocação não encontrada nesta organização.'
) => {
    if (!error || error?.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }

    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar esta informação.'
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
    INVALID_SEMEN_BATCH: 'O lote de sêmen possui dados inválidos.',
    SEMEN_BATCH_NOT_FOUND: 'O lote de sêmen não foi encontrado nesta organização.',
    SEMEN_BATCH_INACTIVE: 'O lote de sêmen selecionado está inativo.',
    EXTERNAL_ESTABLISHMENT_NOT_FOUND: 'O produtor externo não foi encontrado.',
    EXTERNAL_ESTABLISHMENT_INACTIVE: 'O produtor externo está inativo.',
    SIRE_NOT_FOUND: 'O reprodutor do lote não foi encontrado nesta organização.',
    SIRE_NOT_ELIGIBLE: 'O Animal associado ao lote não está elegível como reprodutor.',
    INVALID_MATING_BATCH: 'Inclua de uma a cem alocações válidas.',
    INVALID_MATING: 'Revise quantidade, data de fertilização e método.',
    BATCH_KEY_MISMATCH: 'A identidade do lote não corresponde à intenção enviada.',
    COLLECTION_NOT_COMPLETED: 'A coleta precisa estar concluída para receber alocações.',
    FERTILIZATION_PRECEDES_COLLECTION: 'A fertilização não pode ocorrer antes da coleta.',
    OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT: 'A capacidade viável mudou ou foi excedida. Revise as alocações atuais.',
    MATING_NOT_FOUND: 'A alocação não foi encontrada nesta organização.',
    IDEMPOTENCY_KEY_REUSED: 'Esta intenção já foi usada com dados diferentes.',
    COMMAND_IN_PROGRESS: 'Esta operação ainda está sendo processada. Aguarde antes de tentar novamente.',
    CONCURRENT_WRITE_CONFLICT: 'As alocações foram alteradas simultaneamente. Revise o estado atual.',
    CONSTRAINT_CONFLICT: 'O estado atual impede esta alocação. Recarregue e revise os dados.',
})

export const getMatingCommandErrorMessage = (error) => {
    if (!error || error?.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }

    if (COMMAND_MESSAGES[error.code]) {
        return COMMAND_MESSAGES[error.code]
    }

    if (
        error.kind === TARGET_ERROR_KINDS.NETWORK ||
        error.kind === TARGET_ERROR_KINDS.TIMEOUT
    ) {
        return 'O resultado é incerto. Tente novamente com a mesma intenção.'
    }

    if (error.kind === TARGET_ERROR_KINDS.FORBIDDEN) {
        return 'Você não tem permissão para registrar alocações.'
    }

    if (error.kind === TARGET_ERROR_KINDS.VALIDATION) {
        return 'Revise os dados informados antes de continuar.'
    }

    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    return `Não foi possível concluir a operação.${reference}`
}
