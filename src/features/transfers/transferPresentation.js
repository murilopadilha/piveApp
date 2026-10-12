import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const formatTransferDate = (value, fallback = 'Não informado') => {
    const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    return match ? `${match[3]}/${match[2]}/${match[1]}` : fallback
}

export const formatTransferTimestamp = (value, fallback = 'Não informado') => {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }
    const date = new Date(value)

    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
}

export const getRecipientCycleStatusLabel = value => ({
    OPEN: 'Aberto',
    CLOSED: 'Fechado',
}[value] ?? value ?? 'Não informado')

export const getPregnancyResultLabel = value => ({
    PREGNANT: 'Prenhe',
    NOT_PREGNANT: 'Não prenhe',
    INCONCLUSIVE: 'Inconclusivo',
    PREGNANCY_LOSS: 'Perda gestacional',
}[value] ?? value ?? 'Sem resultado válido')

export const getTransferOriginLabel = value => ({
    FRESH: 'Fresco',
    THAWED: 'Descongelado',
}[value] ?? value ?? 'Não informado')

const COMMAND_MESSAGES = Object.freeze({
    RECIPIENT_NOT_FOUND: 'A Animal receptora não foi encontrada nesta organização.',
    RECIPIENT_NOT_ELIGIBLE: 'O ciclo exige uma Animal fêmea e ativa.',
    PROTOCOL_VERSION_NOT_FOUND: 'A versão de protocolo não foi encontrada.',
    PROTOCOL_VERSION_WITHDRAWN: 'A versão de protocolo não está disponível para novo uso.',
    RECIPIENT_CYCLE_NOT_FOUND: 'O ciclo da receptora não foi encontrado nesta organização.',
    RECIPIENT_CYCLE_NOT_OPEN: 'O ciclo já não está aberto.',
    INVALID_RECIPIENT_CYCLE_NOTES: 'As observações do ciclo não são válidas.',
    INVALID_CYCLE_CLOSE_DATE: 'A data de fechamento não pode anteceder a abertura.',
    CYCLE_CLOSE_REASON_REQUIRED: 'Informe um motivo de fechamento com até 500 caracteres.',
    STALE_RECIPIENT_CYCLE_VERSION: 'O ciclo mudou no servidor. Recarregue e revise o fechamento.',
    IDEMPOTENCY_KEY_REUSED: 'Esta intenção já foi usada com dados diferentes.',
    COMMAND_IN_PROGRESS: 'Esta operação ainda está em processamento.',
    CONCURRENT_WRITE_CONFLICT: 'Os dados foram alterados simultaneamente. Recarregue e revise.',
    CONSTRAINT_CONFLICT: 'O estado atual impede a operação. Recarregue e revise.',
    INVALID_PAGE: 'A página solicitada não é válida.',
    INVALID_PREGNANCY_CHECK_BATCH: 'O lote de checagem gestacional não é válido.',
    DUPLICATE_ITEM_ID: 'A intenção contém itens duplicados.',
    DUPLICATE_PREGNANCY_CHECK_ID: 'A intenção contém identificadores de checagem duplicados.',
    DUPLICATE_SUPERSEDED_CHECK: 'A mesma checagem não pode ser corrigida duas vezes na mesma intenção.',
    BATCH_KEY_MISMATCH: 'A identidade do lote não corresponde à intenção enviada.',
    EMBRYO_TRANSFER_NOT_FOUND: 'A transferência não foi encontrada nesta organização.',
    PREGNANCY_CHECK_NOT_FOUND: 'A checagem gestacional não foi encontrada.',
    PROFESSIONAL_NOT_FOUND: 'O profissional não foi encontrado nesta organização.',
    PROFESSIONAL_INACTIVE: 'Selecione um profissional ativo.',
    CHECK_PRECEDES_TRANSFER: 'A checagem não pode anteceder a transferência.',
    CHECK_CORRECTION_TRANSFER_MISMATCH: 'A correção não pertence à mesma transferência.',
    PREGNANCY_CHECK_ALREADY_INVALIDATED: 'A checagem já foi invalidada. Recarregue o histórico.',
    INVALID_PREGNANCY_CHECK: 'Os dados da checagem gestacional não são válidos.',
    INVALID_CHECK_TIMEZONE: 'Informe um fuso horário IANA válido.',
    INVALID_CHECK_METHOD: 'Informe um código operacional de método válido.',
    INVALID_CHECK_OBSERVATIONS: 'As observações da checagem não são válidas.',
    INVALID_CORRECTION_REASON: 'O motivo da correção não é válido.',
    INVALID_CHECK_CORRECTION: 'A correção deve referenciar e justificar o fato anterior.',
    CHECK_INVALIDATION_REASON_REQUIRED: 'Informe um motivo para invalidar a checagem.',
})

export const getTransferErrorMessage = (
    error,
    notFoundMessage = 'Registro não encontrado nesta organização.',
    { ambiguousCommand = false } = {}
) => {
    if (!error || error.kind === TARGET_ERROR_KINDS.CANCELED) {
        return null
    }
    if (COMMAND_MESSAGES[error.code]) {
        return COMMAND_MESSAGES[error.code]
    }
    const reference = error.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar este fluxo.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return notFoundMessage
        case TARGET_ERROR_KINDS.VALIDATION:
            return 'Revise os dados informados.'
        case TARGET_ERROR_KINDS.NETWORK:
        case TARGET_ERROR_KINDS.TIMEOUT:
            return ambiguousCommand
                ? 'O resultado é incerto. Tente novamente com a mesma intenção.'
                : 'Não foi possível conectar ao servidor. Tente novamente.'
        default:
            return `Não foi possível concluir a operação.${reference}`
    }
}

export const getTransferCommandErrorMessage = error => (
    getTransferErrorMessage(error, undefined, { ambiguousCommand: true })
)
