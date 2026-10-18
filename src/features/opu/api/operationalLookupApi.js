import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_OPERATIONAL_LOOKUP_PAGE_SIZE = 20

const contractError = contractName => new TypeError(
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

const mapAddress = (value, contractName) => {
    const address = requireRecord(value, contractName)

    return {
        addressLine: requireString(address.addressLine, contractName),
        municipality: requireString(address.municipality, contractName),
        state: requireString(address.state, contractName),
        country: requireString(address.country, contractName),
        postalCode: asOptionalString(address.postalCode, contractName),
    }
}

const mapPage = (value, contractName, mapItem) => {
    const page = requireRecord(value, contractName)

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError(contractName)
    }

    return {
        items: page.items.map(mapItem),
        page: page.page,
        size: page.size,
    }
}

export const normalizeOperationalLookupParams = ({
    query = '',
    page = 0,
    size = DEFAULT_OPERATIONAL_LOOKUP_PAGE_SIZE,
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
        throw new TypeError('Invalid operational lookup parameters.')
    }

    return { q: normalizedQuery, page, size }
}

export const mapEstablishment = (value) => {
    const establishment = requireRecord(value, 'Establishment')
    const details = requireRecord(establishment.details, 'Establishment details')

    if (!Array.isArray(details.capabilities)) {
        throw contractError('Establishment details')
    }

    return {
        id: requireString(details.id, 'Establishment details'),
        legalDisplayName: requireString(
            details.legalDisplayName,
            'Establishment details'
        ),
        operatingMode: requireString(
            details.operatingMode,
            'Establishment details'
        ),
        address: mapAddress(details.address, 'Establishment address'),
        registrationIssuer: asOptionalString(
            details.registrationIssuer,
            'Establishment details'
        ),
        registrationNumber: asOptionalString(
            details.registrationNumber,
            'Establishment details'
        ),
        capabilities: details.capabilities.map(capability => (
            requireString(capability, 'Establishment capability')
        )),
        status: requireString(establishment.status, 'Establishment'),
        version: requireVersion(establishment.version, 'Establishment'),
    }
}

export const mapOperationalLocation = (value) => {
    const location = requireRecord(value, 'Operational location')

    return {
        id: requireString(location.id, 'Operational location'),
        establishmentId: requireString(
            location.establishmentId,
            'Operational location'
        ),
        name: requireString(location.name, 'Operational location'),
        type: requireString(location.type, 'Operational location'),
        timezone: asOptionalString(location.timezone, 'Operational location'),
        status: requireString(location.status, 'Operational location'),
        version: requireVersion(location.version, 'Operational location'),
    }
}

export const mapFarmProperty = (value) => {
    const property = requireRecord(value, 'Farm property')
    const details = requireRecord(property.details, 'Farm property details')

    return {
        id: requireString(details.id, 'Farm property details'),
        name: requireString(details.name, 'Farm property details'),
        ownerId: asOptionalString(details.ownerId, 'Farm property details'),
        operatorId: asOptionalString(
            details.operatorId,
            'Farm property details'
        ),
        address: mapAddress(details.address, 'Farm property address'),
        municipalityCode: asOptionalString(
            details.municipalityCode,
            'Farm property details'
        ),
        internalCode: asOptionalString(
            details.internalCode,
            'Farm property details'
        ),
        status: requireString(property.status, 'Farm property'),
        version: requireVersion(property.version, 'Farm property'),
    }
}

export const mapProfessional = (value) => {
    const professional = requireRecord(value, 'Professional')

    return {
        id: requireString(professional.id, 'Professional'),
        name: requireString(professional.name, 'Professional'),
        professionalType: requireString(
            professional.professionalType,
            'Professional'
        ),
        linkedUserId: asOptionalString(
            professional.linkedUserId,
            'Professional'
        ),
        status: requireString(professional.status, 'Professional'),
        version: requireVersion(professional.version, 'Professional'),
    }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

const getPage = async ({
    path,
    query,
    page,
    size,
    signal,
    contractName,
    mapItem,
    fallbackDetail,
}) => {
    try {
        const response = await targetApiClient.get(path, {
            params: normalizeOperationalLookupParams({ query, page, size }),
            signal,
        })

        return mapPage(response.data, contractName, mapItem)
    } catch (error) {
        return normalizeAndThrow(error, fallbackDetail)
    }
}

export const getEstablishments = params => getPage({
    ...params,
    path: '/establishments',
    contractName: 'Establishment page',
    mapItem: mapEstablishment,
    fallbackDetail: 'Não foi possível carregar os estabelecimentos.',
})

export const getFarmProperties = params => getPage({
    ...params,
    path: '/farm-properties',
    contractName: 'Farm property page',
    mapItem: mapFarmProperty,
    fallbackDetail: 'Não foi possível carregar as propriedades.',
})

export const getProfessionals = params => getPage({
    ...params,
    path: '/professionals',
    contractName: 'Professional page',
    mapItem: mapProfessional,
    fallbackDetail: 'Não foi possível carregar os profissionais.',
})

export const getOperationalLocations = ({ establishmentId, ...params }) => {
    const id = requireString(establishmentId, 'Establishment identifier')

    return getPage({
        ...params,
        path: `/establishments/${encodeURIComponent(id)}/operational-locations`,
        contractName: 'Operational location page',
        mapItem: mapOperationalLocation,
        fallbackDetail: 'Não foi possível carregar os locais operacionais.',
    })
}

const getDetail = async ({ path, signal, map, fallbackDetail }) => {
    try {
        const response = await targetApiClient.get(path, { signal })

        return map(response.data)
    } catch (error) {
        return normalizeAndThrow(error, fallbackDetail)
    }
}

export const getEstablishmentById = ({ establishmentId, signal }) => (
    getDetail({
        path: `/establishments/${encodeURIComponent(requireString(
            establishmentId,
            'Establishment identifier'
        ))}`,
        signal,
        map: mapEstablishment,
        fallbackDetail: 'Não foi possível carregar o estabelecimento.',
    })
)

export const getOperationalLocationById = ({
    establishmentId,
    operationalLocationId,
    signal,
}) => getDetail({
    path: `/establishments/${encodeURIComponent(requireString(
        establishmentId,
        'Establishment identifier'
    ))}/operational-locations/${encodeURIComponent(requireString(
        operationalLocationId,
        'Operational location identifier'
    ))}`,
    signal,
    map: mapOperationalLocation,
    fallbackDetail: 'Não foi possível carregar o local operacional.',
})

export const getFarmPropertyById = ({ farmPropertyId, signal }) => (
    getDetail({
        path: `/farm-properties/${encodeURIComponent(requireString(
            farmPropertyId,
            'Farm property identifier'
        ))}`,
        signal,
        map: mapFarmProperty,
        fallbackDetail: 'Não foi possível carregar a propriedade.',
    })
)

export const getProfessionalById = ({ professionalId, signal }) => (
    getDetail({
        path: `/professionals/${encodeURIComponent(requireString(
            professionalId,
            'Professional identifier'
        ))}`,
        signal,
        map: mapProfessional,
        fallbackDetail: 'Não foi possível carregar o profissional.',
    })
)
