import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_ANIMAL_PAGE_SIZE = 20

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

const mapAddress = (value) => {
    if (value == null) {
        return null
    }

    const address = requireRecord(value, 'Animal owner address')

    return {
        addressLine: requireString(address.addressLine, 'Animal owner address'),
        municipality: requireString(
            address.municipality,
            'Animal owner address'
        ),
        state: requireString(address.state, 'Animal owner address'),
        country: requireString(address.country, 'Animal owner address'),
        postalCode: asOptionalString(
            address.postalCode,
            'Animal owner address'
        ),
    }
}

export const mapAnimalView = (value) => {
    const animal = requireRecord(value, 'Animal')
    const registration = requireRecord(animal.registration, 'Animal registration')

    return {
        id: requireString(registration.id, 'Animal registration'),
        sex: requireString(registration.sex, 'Animal registration'),
        name: asOptionalString(registration.name, 'Animal registration'),
        breedId: asOptionalString(registration.breedId, 'Animal registration'),
        birthDate: asOptionalString(
            registration.birthDate,
            'Animal registration'
        ),
        status: requireString(animal.status, 'Animal'),
        version: requireVersion(animal.version, 'Animal'),
        originType: requireString(animal.originType, 'Animal'),
        recordedBy: requireString(animal.recordedBy, 'Animal'),
        recordedAt: requireString(animal.recordedAt, 'Animal'),
    }
}

export const mapAnimalPage = value => mapPage(
    value,
    'Animal page',
    mapAnimalView
)

export const mapAnimalIdentifier = (value) => {
    const entry = requireRecord(value, 'Animal identifier')
    const identifier = requireRecord(
        entry.identifier,
        'Animal identifier value'
    )

    return {
        id: requireString(entry.id, 'Animal identifier'),
        animalId: requireString(entry.animalId, 'Animal identifier'),
        type: requireString(entry.type, 'Animal identifier'),
        value: requireString(identifier.value, 'Animal identifier value'),
        issuer: asOptionalString(
            identifier.issuer,
            'Animal identifier value'
        ),
        validFrom: asOptionalString(entry.validFrom, 'Animal identifier'),
        validUntil: asOptionalString(entry.validUntil, 'Animal identifier'),
        status: requireString(entry.status, 'Animal identifier'),
        version: requireVersion(entry.version, 'Animal identifier'),
    }
}

export const mapAnimalIdentifierPage = value => mapPage(
    value,
    'Animal identifier page',
    mapAnimalIdentifier
)

export const mapAnimalOwnership = (value) => {
    const assignment = requireRecord(value, 'Animal ownership')
    const period = requireRecord(assignment.period, 'Animal ownership period')

    return {
        id: requireString(assignment.id, 'Animal ownership'),
        animalId: requireString(assignment.animalId, 'Animal ownership'),
        ownerId: requireString(assignment.ownerId, 'Animal ownership'),
        from: requireString(period.from, 'Animal ownership period'),
        until: asOptionalString(period.until, 'Animal ownership period'),
        sourceDocumentId: asOptionalString(
            assignment.sourceDocumentId,
            'Animal ownership'
        ),
        version: requireVersion(assignment.version, 'Animal ownership'),
    }
}

export const mapAnimalOwnershipPage = value => mapPage(
    value,
    'Animal ownership page',
    mapAnimalOwnership
)

export const mapBreed = (value) => {
    const breed = requireRecord(value, 'Breed')

    return {
        id: requireString(breed.id, 'Breed'),
        name: requireString(breed.name, 'Breed'),
        code: asOptionalString(breed.code, 'Breed'),
        status: requireString(breed.status, 'Breed'),
        version: requireVersion(breed.version, 'Breed'),
    }
}

export const mapAnimalOwner = (value) => {
    const owner = requireRecord(value, 'Animal owner')

    return {
        id: requireString(owner.id, 'Animal owner'),
        type: requireString(owner.type, 'Animal owner'),
        displayName: requireString(owner.displayName, 'Animal owner'),
        legalName: asOptionalString(owner.legalName, 'Animal owner'),
        address: mapAddress(owner.address),
        status: requireString(owner.status, 'Animal owner'),
        version: requireVersion(owner.version, 'Animal owner'),
    }
}

export const normalizeAnimalPageParams = ({
    query = '',
    page = 0,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
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
        throw new TypeError('Invalid Animal page parameters.')
    }

    return {
        q: normalizedQuery,
        page,
        size,
    }
}

const normalizeHistoryPageParams = ({
    page = 0,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
} = {}) => {
    const { page: normalizedPage, size: normalizedSize } =
        normalizeAnimalPageParams({ page, size })

    return {
        page: normalizedPage,
        size: normalizedSize,
    }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getAnimals = async ({
    query,
    page,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
    signal,
}) => {
    try {
        const response = await targetApiClient.get('/animals', {
            params: normalizeAnimalPageParams({ query, page, size }),
            signal,
        })

        return mapAnimalPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar os animais.'
        )
    }
}

export const getAnimalById = async ({ animalId, signal }) => {
    try {
        const id = requireString(animalId, 'Animal identifier')
        const response = await targetApiClient.get(
            `/animals/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapAnimalView(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o animal.'
        )
    }
}

export const getAnimalIdentifiers = async ({
    animalId,
    page,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
    signal,
}) => {
    try {
        const id = requireString(animalId, 'Animal identifier')
        const params = normalizeHistoryPageParams({ page, size })
        const response = await targetApiClient.get(
            `/animals/${encodeURIComponent(id)}/identifiers`,
            { params, signal }
        )

        return mapAnimalIdentifierPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar os identificadores do animal.'
        )
    }
}

export const getAnimalOwnership = async ({
    animalId,
    page,
    size = DEFAULT_ANIMAL_PAGE_SIZE,
    signal,
}) => {
    try {
        const id = requireString(animalId, 'Animal identifier')
        const params = normalizeHistoryPageParams({ page, size })
        const response = await targetApiClient.get(
            `/animals/${encodeURIComponent(id)}/ownership`,
            { params, signal }
        )

        return mapAnimalOwnershipPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o histórico de propriedade.'
        )
    }
}

export const getBreedById = async ({ breedId, signal }) => {
    try {
        const id = requireString(breedId, 'Breed identifier')
        const response = await targetApiClient.get(
            `/breeds/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapBreed(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a raça.'
        )
    }
}

export const getAnimalOwnerById = async ({ ownerId, signal }) => {
    try {
        const id = requireString(ownerId, 'Animal owner identifier')
        const response = await targetApiClient.get(
            `/owners/${encodeURIComponent(id)}`,
            {
                params: { scope: 'ANIMAL' },
                signal,
            }
        )

        return mapAnimalOwner(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o proprietário.'
        )
    }
}
