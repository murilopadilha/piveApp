import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_OPU_PAGE_SIZE = 20

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

const requireInteger = (value, contractName) => {
    if (!Number.isInteger(value) || value < 0) {
        throw contractError(contractName)
    }

    return value
}

const requireBoolean = (value, contractName) => {
    if (typeof value !== 'boolean') {
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

const asOptionalInteger = (value, contractName) => {
    if (value == null) {
        return null
    }

    return requireInteger(value, contractName)
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

const mapAddress = (value, contractName) => {
    if (value == null) {
        return null
    }

    const address = requireRecord(value, contractName)

    return {
        addressLine: requireString(address.addressLine, contractName),
        municipality: requireString(address.municipality, contractName),
        state: requireString(address.state, contractName),
        country: requireString(address.country, contractName),
        postalCode: asOptionalString(address.postalCode, contractName),
    }
}

export const mapOpuProvenance = (value) => {
    const provenance = requireRecord(value, 'OPU provenance')

    return {
        originType: requireString(provenance.originType, 'OPU provenance'),
        sourceDocumentId: asOptionalString(
            provenance.sourceDocumentId,
            'OPU provenance'
        ),
        importBatchId: asOptionalString(
            provenance.importBatchId,
            'OPU provenance'
        ),
        apiClientId: asOptionalString(
            provenance.apiClientId,
            'OPU provenance'
        ),
        recordedByUserId: requireString(
            provenance.recordedByUserId,
            'OPU provenance'
        ),
        recordedAt: requireString(provenance.recordedAt, 'OPU provenance'),
        confirmedByUserId: asOptionalString(
            provenance.confirmedByUserId,
            'OPU provenance'
        ),
        confirmedAt: asOptionalString(
            provenance.confirmedAt,
            'OPU provenance'
        ),
        derivationReference: asOptionalString(
            provenance.derivationReference,
            'OPU provenance'
        ),
    }
}

export const mapOpuSession = (value) => {
    const session = requireRecord(value, 'OPU session')
    const registration = requireRecord(
        session.registration,
        'OPU session registration'
    )

    return {
        id: requireString(registration.id, 'OPU session registration'),
        establishmentId: requireString(
            registration.establishmentId,
            'OPU session registration'
        ),
        operationalLocationId: asOptionalString(
            registration.operationalLocationId,
            'OPU session registration'
        ),
        farmPropertyId: requireString(
            registration.farmPropertyId,
            'OPU session registration'
        ),
        clientId: asOptionalString(
            registration.clientId,
            'OPU session registration'
        ),
        leadProfessionalId: requireString(
            registration.leadProfessionalId,
            'OPU session registration'
        ),
        performedAt: requireString(
            registration.performedAt,
            'OPU session registration'
        ),
        timezone: requireString(
            registration.timezone,
            'OPU session registration'
        ),
        notes: asOptionalString(registration.notes, 'OPU session registration'),
        status: requireString(session.status, 'OPU session'),
        version: requireInteger(session.version, 'OPU session'),
        provenance: mapOpuProvenance(session.provenance),
        completedAt: asOptionalString(session.completedAt, 'OPU session'),
        completedBy: asOptionalString(session.completedBy, 'OPU session'),
    }
}

export const mapOpuSessionPage = value => mapPage(
    value,
    'OPU session page',
    mapOpuSession
)

export const mapOocyteCollection = (value) => {
    const collection = requireRecord(value, 'Oocyte collection')
    const registration = requireRecord(
        collection.registration,
        'Oocyte collection registration'
    )
    const counts = requireRecord(
        registration.counts,
        'Oocyte collection counts'
    )

    return {
        id: requireString(registration.id, 'Oocyte collection registration'),
        sessionId: requireString(collection.sessionId, 'Oocyte collection'),
        donorId: requireString(
            registration.donorId,
            'Oocyte collection registration'
        ),
        collectedAt: requireString(
            registration.collectedAt,
            'Oocyte collection registration'
        ),
        totalRecovered: requireInteger(
            counts.totalRecovered,
            'Oocyte collection counts'
        ),
        viable: requireInteger(counts.viable, 'Oocyte collection counts'),
        folliclesAspirated: asOptionalInteger(
            counts.folliclesAspirated,
            'Oocyte collection counts'
        ),
        notes: asOptionalString(
            registration.notes,
            'Oocyte collection registration'
        ),
        status: requireString(collection.status, 'Oocyte collection'),
        version: requireInteger(collection.version, 'Oocyte collection'),
        provenance: mapOpuProvenance(collection.provenance),
    }
}

export const mapOocyteCollectionPage = value => mapPage(
    value,
    'Oocyte collection page',
    mapOocyteCollection
)

export const mapOpuSummary = (value) => {
    const summary = requireRecord(value, 'OPU summary')
    const farm = summary.farmSnapshot == null
        ? null
        : requireRecord(summary.farmSnapshot, 'OPU farm snapshot')

    return {
        id: requireString(summary.id, 'OPU summary'),
        status: requireString(summary.status, 'OPU summary'),
        collections: requireInteger(summary.collections, 'OPU summary'),
        totalRecovered: requireInteger(summary.totalRecovered, 'OPU summary'),
        viable: requireInteger(summary.viable, 'OPU summary'),
        farmSnapshot: farm ? {
            id: requireString(farm.id, 'OPU farm snapshot'),
            name: requireString(farm.name, 'OPU farm snapshot'),
            address: mapAddress(farm.address, 'OPU farm snapshot address'),
            municipalityCode: asOptionalString(
                farm.municipalityCode,
                'OPU farm snapshot'
            ),
            internalCode: asOptionalString(
                farm.internalCode,
                'OPU farm snapshot'
            ),
            ownerId: asOptionalString(farm.ownerId, 'OPU farm snapshot'),
            operatorId: asOptionalString(farm.operatorId, 'OPU farm snapshot'),
            version: requireInteger(farm.version, 'OPU farm snapshot'),
        } : null,
    }
}

export const mapDonorSnapshot = (value) => {
    const donor = requireRecord(value, 'OPU donor snapshot')

    if (!Array.isArray(donor.identifiers)) {
        throw contractError('OPU donor snapshot')
    }

    return {
        id: requireString(donor.id, 'OPU donor snapshot'),
        name: asOptionalString(donor.name, 'OPU donor snapshot'),
        sex: requireString(donor.sex, 'OPU donor snapshot'),
        status: requireString(donor.status, 'OPU donor snapshot'),
        version: requireInteger(donor.version, 'OPU donor snapshot'),
        identifiers: donor.identifiers.map((value) => {
            const identifier = requireRecord(value, 'OPU donor identifier')

            return {
                type: requireString(identifier.type, 'OPU donor identifier'),
                issuer: asOptionalString(
                    identifier.issuer,
                    'OPU donor identifier'
                ),
                value: requireString(identifier.value, 'OPU donor identifier'),
            }
        }),
    }
}

export const mapCollectionBatchResult = (value) => {
    const result = requireRecord(value, 'OPU collection batch result')

    if (!Array.isArray(result.items)) {
        throw contractError('OPU collection batch result')
    }

    return {
        batchId: requireString(result.batchId, 'OPU collection batch result'),
        dryRun: requireBoolean(result.dryRun, 'OPU collection batch result'),
        items: result.items.map((value) => {
            const item = requireRecord(value, 'OPU collection item result')

            return {
                itemId: requireString(
                    item.itemId,
                    'OPU collection item result'
                ),
                collectionId: asOptionalString(
                    item.collectionId,
                    'OPU collection item result'
                ),
                status: requireString(
                    item.status,
                    'OPU collection item result'
                ),
                errorCode: asOptionalString(
                    item.errorCode,
                    'OPU collection item result'
                ),
            }
        }),
    }
}

export const normalizeOpuPageParams = ({
    page = 0,
    size = DEFAULT_OPU_PAGE_SIZE,
} = {}) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid OPU page parameters.')
    }

    return { page, size }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

const requireId = (value, contractName) => requireString(value, contractName)

export const getOpuSessions = async ({
    page,
    size = DEFAULT_OPU_PAGE_SIZE,
    signal,
}) => {
    try {
        const response = await targetApiClient.get('/opu-sessions', {
            params: normalizeOpuPageParams({ page, size }),
            signal,
        })

        return mapOpuSessionPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar as OPUs.')
    }
}

export const getOpuSessionById = async ({ opuSessionId, signal }) => {
    try {
        const id = requireId(opuSessionId, 'OPU session identifier')
        const response = await targetApiClient.get(
            `/opu-sessions/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapOpuSession(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar a OPU.')
    }
}

export const getOpuSessionSummary = async ({ opuSessionId, signal }) => {
    try {
        const id = requireId(opuSessionId, 'OPU session identifier')
        const response = await targetApiClient.get(
            `/opu-sessions/${encodeURIComponent(id)}/summary`,
            { signal }
        )

        return mapOpuSummary(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o resumo da OPU.'
        )
    }
}

export const getOpuSessionCollections = async ({
    opuSessionId,
    page,
    size = DEFAULT_OPU_PAGE_SIZE,
    signal,
}) => {
    try {
        const id = requireId(opuSessionId, 'OPU session identifier')
        const response = await targetApiClient.get(
            `/opu-sessions/${encodeURIComponent(id)}/collections`,
            { params: normalizeOpuPageParams({ page, size }), signal }
        )

        return mapOocyteCollectionPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar as coletas da OPU.'
        )
    }
}

export const getOocyteCollectionById = async ({
    oocyteCollectionId,
    signal,
}) => {
    try {
        const id = requireId(
            oocyteCollectionId,
            'Oocyte collection identifier'
        )
        const response = await targetApiClient.get(
            `/oocyte-collections/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapOocyteCollection(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a coleta de oócitos.'
        )
    }
}

export const getOocyteCollectionDonorSnapshot = async ({
    oocyteCollectionId,
    signal,
}) => {
    try {
        const id = requireId(
            oocyteCollectionId,
            'Oocyte collection identifier'
        )
        const response = await targetApiClient.get(
            `/oocyte-collections/${encodeURIComponent(id)}/donor-snapshot`,
            { signal }
        )

        return mapDonorSnapshot(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a identidade registrada da doadora.'
        )
    }
}

const commandConfig = idempotencyKey => ({
    targetContext: { idempotencyKey },
})

export const openOpuSession = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/opu-sessions',
            intent.payload,
            commandConfig(intent.idempotencyKey)
        )

        return mapOpuSession(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível criar a OPU.')
    }
}

const TRANSITION_PATHS = Object.freeze({
    start: 'start',
    cancel: 'cancel',
    complete: 'complete',
})

export const transitionOpuSession = async (intent) => {
    try {
        const id = requireId(intent.opuSessionId, 'OPU session identifier')
        const action = TRANSITION_PATHS[intent.action]

        if (!action) {
            throw new TypeError('Invalid OPU session transition.')
        }

        const response = await targetApiClient.post(
            `/opu-sessions/${encodeURIComponent(id)}:${action}`,
            intent.payload,
            commandConfig(intent.idempotencyKey)
        )

        return mapOpuSession(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível atualizar o estado da OPU.'
        )
    }
}

export const dryRunOpuCollections = async (intent) => {
    try {
        const id = requireId(intent.opuSessionId, 'OPU session identifier')
        const response = await targetApiClient.post(
            `/opu-sessions/${encodeURIComponent(id)}/collections:dry-run`,
            intent.payload
        )

        return mapCollectionBatchResult(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível validar o lote de coletas.'
        )
    }
}

export const recordOpuCollections = async (intent) => {
    try {
        const id = requireId(intent.opuSessionId, 'OPU session identifier')
        const response = await targetApiClient.post(
            `/opu-sessions/${encodeURIComponent(id)}/collections:bulk`,
            intent.payload,
            commandConfig(intent.idempotencyKey)
        )

        return mapCollectionBatchResult(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível registrar o lote de coletas.'
        )
    }
}

export const correctOocyteCollection = async (intent) => {
    try {
        const id = requireId(
            intent.oocyteCollectionId,
            'Oocyte collection identifier'
        )
        const response = await targetApiClient.post(
            `/oocyte-collections/${encodeURIComponent(id)}:correct`,
            intent.payload,
            commandConfig(intent.idempotencyKey)
        )

        return mapOocyteCollection(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível corrigir a coleta de oócitos.'
        )
    }
}
