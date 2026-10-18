import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const getPackageStatusLabel = value => ({
    DRAFT: 'Rascunho',
    SEALED: 'Selado',
    DISPOSED: 'Descartado',
}[value] ?? value ?? 'Não informado')

export const getMovementTypeLabel = value => ({
    RECEIVE: 'Receber',
    STORE: 'Armazenar',
    MOVE: 'Mover',
    WITHDRAW: 'Retirar',
}[value] ?? value ?? 'Não informado')

export const formatInventoryTimestamp = (value, fallback = 'Não informado') => {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }
    const parsed = new Date(value)

    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleString('pt-BR')
}

const COMMAND_MESSAGES = Object.freeze({
    PACKAGE_NOT_FOUND: 'O package não foi encontrado nesta organização.',
    PACKAGE_NOT_SEALED: 'Somente um package selado pode ser movimentado.',
    PACKAGE_NOT_IN_EXPECTED_LOCATION: 'O package mudou de localização. Recarregue e revise.',
    PACKAGE_LOCATION_UNCHANGED: 'Selecione uma localização diferente da atual.',
    PACKAGE_ON_HOLD: 'O package está bloqueado por um hold ativo.',
    PACKAGE_RESERVED_FOR_SHIPMENT: 'O package está reservado para um Shipment.',
    PACKAGE_HAS_NO_ACTIVE_MATERIAL: 'O package não possui conteúdo ativo.',
    SHIPPED_PACKAGE_REQUIRES_RETURN_WORKFLOW: 'O package saiu por Shipment e exige o fluxo de retorno.',
    STORAGE_LOCATION_NOT_FOUND: 'O local de armazenamento não foi encontrado.',
    STORAGE_LOCATION_NOT_ACTIVE: 'O destino não está ativo.',
    STALE_PACKAGE_VERSION: 'O package mudou no servidor. Recarregue e revise.',
    INVALID_RECEIPT_LOCATION: 'Recebimento e armazenamento exigem package sem localização e um destino.',
    INVALID_MOVE_LOCATION: 'Movimentação exige localização atual e destino.',
    INVALID_WITHDRAWAL_LOCATION: 'Retirada exige localização atual e nenhum destino.',
    MOVEMENT_KEY_MISMATCH: 'A identidade do movimento não corresponde à chave da intenção.',
    MOVEMENT_BATCH_KEY_MISMATCH: 'A identidade do lote não corresponde à chave da intenção.',
    INVALID_MOVEMENT: 'Os dados do movimento não são válidos.',
    INVALID_MOVEMENT_BATCH: 'O lote deve conter entre um e cem movimentos.',
    DUPLICATE_MOVEMENT_ID: 'O lote contém identificadores de movimento duplicados.',
    BULK_MOVEMENT_TYPE_REQUIRES_DEDICATED_WORKFLOW: 'O lote contém um tipo reservado a outro workflow.',
    DISTRIBUTION_MOVEMENT_REQUIRES_SHIPMENT_WORKFLOW: 'SHIP e RETURN exigem o workflow de Shipment.',
    IDEMPOTENCY_KEY_REUSED: 'Esta intenção já foi usada com dados diferentes.',
    COMMAND_IN_PROGRESS: 'Esta operação ainda está em processamento.',
    CONCURRENT_WRITE_CONFLICT: 'O inventário mudou simultaneamente. Recarregue e revise.',
    CONSTRAINT_CONFLICT: 'O estado atual impede o movimento. Recarregue e revise.',
    INVALID_PAGE: 'A página solicitada não é válida.',
})

export const getInventoryErrorMessage = (
    error,
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
            return 'Você não tem permissão para acessar este inventário.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return 'Registro não encontrado nesta organização.'
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

export const getInventoryCommandErrorMessage = error => (
    getInventoryErrorMessage(error, { ambiguousCommand: true })
)
