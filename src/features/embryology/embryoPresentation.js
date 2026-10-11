import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const formatEmbryoTimestamp = (value, fallback = 'Não informado') => {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('pt-BR')
}

export const getAvailabilityLabel = value => ({
    AVAILABLE: 'Disponível',
    RESERVED: 'Reservado',
    TRANSFERRED: 'Transferido',
    SHIPPED_OUT: 'Expedido',
    DISCARDED: 'Descartado',
    DESTROYED: 'Destruído',
}[value] ?? value ?? 'Não informado')

export const getPreservationLabel = value => ({
    FRESH: 'Fresco',
    CRYOPRESERVED: 'Criopreservado',
    THAWED: 'Descongelado',
}[value] ?? value ?? 'Não informado')

export const findAssessmentCode = (version, codeId) => (
    version?.codes?.find(code => code.id === codeId) ?? null
)

export const getEmbryoErrorMessage = (
    error,
    notFoundMessage = 'Embrião não encontrado nesta organização.'
) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }

    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar embriões.'
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
    INVALID_EMBRYO_BATCH: 'Inclua de um a duzentos embriões válidos.',
    INVALID_EMBRYO_CODE: 'Informe um código de embrião com até 160 caracteres.',
    EMBRYO_COUNT_EXCEEDS_ALLOCATION: 'A quantidade alocada mudou ou já foi totalmente individualizada. Revise o estado atual.',
    EMBRYO_NOT_FOUND: 'O embrião não foi encontrado nesta organização.',
    MATING_NOT_FOUND: 'A fertilização não foi encontrada nesta organização.',
    MATING_NOT_OPEN: 'A fertilização não está aberta para identificação de embriões.',
    BATCH_KEY_MISMATCH: 'A identidade do lote não corresponde à intenção enviada.',
    IDEMPOTENCY_KEY_REUSED: 'Esta intenção já foi usada com dados diferentes.',
    COMMAND_IN_PROGRESS: 'Esta operação ainda está sendo processada. Aguarde antes de tentar novamente.',
    CONCURRENT_WRITE_CONFLICT: 'Os embriões foram alterados simultaneamente. Revise o estado atual.',
    CONSTRAINT_CONFLICT: 'O código pode já existir ou o estado atual impede a identificação. Recarregue e revise os dados.',
})

export const getEmbryoCommandErrorMessage = (error) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) {
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
        return 'Você não tem permissão para identificar embriões.'
    }

    if (error.kind === TARGET_ERROR_KINDS.VALIDATION) {
        return 'Revise os dados informados antes de continuar.'
    }

    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    return `Não foi possível concluir a operação.${reference}`
}
