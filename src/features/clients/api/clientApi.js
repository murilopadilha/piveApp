import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_CLIENT_PAGE_SIZE = 20

const contractError = (contractName) => new TypeError(
    `Invalid ${contractName} response from target API.`
)

const requireRecord = (value, contractName) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw contractError(contractName)
    }

    return value
}

const requireString = (value, contractName) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw contractError(contractName)
    }

    return value
}

const requireVersion = (value, contractName) => {
    if (!Number.isInteger(value) || value < 0) {
        throw contractError(contractName)
    }

    return value
}

const asOptionalString = (value, contractName) => {
    if (value == null) {
        return null
    }

    return requireString(value, contractName)
}

const mapAddress = (value) => {
    if (value == null) {
        return null
    }

    const address = requireRecord(value, 'Client list address')

    return {
        addressLine: requireString(address.addressLine, 'Client list address'),
        municipality: requireString(
            address.municipality,
            'Client list address'
        ),
        state: requireString(address.state, 'Client list address'),
        country: requireString(address.country, 'Client list address'),
        postalCode: asOptionalString(
            address.postalCode,
            'Client list address'
        ),
    }
}

export const mapClientListItem = (value) => {
    const client = requireRecord(value, 'Client list item')

    return {
        id: requireString(client.id, 'Client list item'),
        type: requireString(client.type, 'Client list item'),
        displayName: requireString(client.displayName, 'Client list item'),
        legalName: asOptionalString(client.legalName, 'Client list item'),
        address: mapAddress(client.address),
        status: requireString(client.status, 'Client list item'),
        version: requireVersion(client.version, 'Client list item'),
    }
}

export const mapClientPage = (value) => {
    const page = requireRecord(value, 'Client page')

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError('Client page')
    }

    return {
        items: page.items.map(mapClientListItem),
        page: page.page,
        size: page.size,
    }
}

export const mapClientDetail = (value) => {
    const client = requireRecord(value, 'Client detail')

    return {
        id: requireString(client.id, 'Client detail'),
        type: requireString(client.type, 'Client detail'),
        displayName: requireString(client.displayName, 'Client detail'),
        version: requireVersion(client.version, 'Client detail'),
        originType: requireString(client.originType, 'Client detail'),
        recordedBy: requireString(client.recordedBy, 'Client detail'),
        recordedAt: requireString(client.recordedAt, 'Client detail'),
    }
}

export const normalizeClientSearchParams = ({
    query = '',
    page = 0,
    size = DEFAULT_CLIENT_PAGE_SIZE,
} = {}) => {
    const normalizedQuery = typeof query === 'string' ? query.trim() : ''

    if (
        normalizedQuery.length > 200 ||
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid Client search parameters.')
    }

    return {
        q: normalizedQuery,
        page,
        size,
    }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getClients = async ({
    query,
    page,
    size = DEFAULT_CLIENT_PAGE_SIZE,
    signal,
}) => {
    try {
        const response = await targetApiClient.get('/clients', {
            params: normalizeClientSearchParams({ query, page, size }),
            signal,
        })

        return mapClientPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar os clientes.'
        )
    }
}

export const getClientById = async ({ clientId, signal }) => {
    try {
        const normalizedClientId = requireString(clientId, 'Client identifier')
        const response = await targetApiClient.get(
            `/clients/${encodeURIComponent(normalizedClientId)}`,
            { signal }
        )

        return mapClientDetail(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o cliente.'
        )
    }
}
