import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const UNNAMED_ANIMAL_LABEL = 'Animal sem nome'

export const getAnimalName = animal => (
    animal?.name?.trim() || UNNAMED_ANIMAL_LABEL
)

export const getAnimalSexLabel = sex => ({
    FEMALE: 'Fêmea',
    MALE: 'Macho',
    UNKNOWN: 'Não informado',
}[sex] ?? sex)

export const getAnimalStatusLabel = status => ({
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    DECEASED: 'Falecido',
    ARCHIVED: 'Arquivado',
}[status] ?? status)

export const getBreedStatusLabel = status => ({
    ACTIVE: 'Ativa',
    INACTIVE: 'Inativa',
}[status] ?? status)

export const getIdentifierStatusLabel = status => ({
    ACTIVE: 'Ativo',
    CORRECTED: 'Corrigido',
    REVOKED: 'Revogado',
}[status] ?? status)

export const getOriginTypeLabel = originType => ({
    MANUAL: 'Registro manual',
    IMPORT: 'Importação',
    API: 'Integração',
    AI_EXTRACTED_CONFIRMED: 'Extração confirmada',
    SYSTEM_DERIVED: 'Derivado pelo sistema',
}[originType] ?? originType)

export const formatAnimalDate = (value, fallback = 'Não informado') => {
    const match = typeof value === 'string' &&
        value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    return match ? `${match[3]}/${match[2]}/${match[1]}` : fallback
}

export const formatAnimalTimestamp = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        return 'Não informado'
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('pt-BR')
}

export const getAnimalErrorMessage = (
    error,
    notFoundMessage = 'Animal não encontrado nesta organização.'
) => {
    if (!error) {
        return null
    }

    const reference = error?.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error?.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para consultar animais.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return notFoundMessage
        case TARGET_ERROR_KINDS.VALIDATION:
            return 'A consulta enviada não é válida.'
        case TARGET_ERROR_KINDS.NETWORK:
            return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
        case TARGET_ERROR_KINDS.TIMEOUT:
            return 'O servidor demorou para responder. Tente novamente.'
        case TARGET_ERROR_KINDS.CANCELED:
            return null
        default:
            return `Não foi possível concluir a consulta.${reference}`
    }
}
