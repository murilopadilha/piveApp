import { TARGET_ERROR_KINDS } from '../../api/target/problemDetails'

export const getClientTypeLabel = type => ({
    PERSON: 'Pessoa',
    COMPANY: 'Empresa',
}[type] ?? type)

export const getClientStatusLabel = status => ({
    ACTIVE: 'Ativo',
    ARCHIVED: 'Arquivado',
}[status] ?? status)

export const getClientErrorMessage = (error) => {
    if (!error) {
        return null
    }

    const reference = error?.traceId ? ` Referência: ${error.traceId}.` : ''

    switch (error?.kind) {
        case TARGET_ERROR_KINDS.UNAUTHORIZED:
            return 'A sessão expirou. Entre novamente para continuar.'
        case TARGET_ERROR_KINDS.FORBIDDEN:
            return 'Você não tem permissão para acessar estes clientes.'
        case TARGET_ERROR_KINDS.NOT_FOUND:
            return 'Cliente não encontrado nesta organização.'
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
