import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_SEMEN_BATCH_PAGE_SIZE = 20

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

const mapProvenance = (value, contractName) => {
    const provenance = requireRecord(value, contractName)

    return {
        originType: requireString(provenance.originType, contractName),
        sourceDocumentId: asOptionalString(
            provenance.sourceDocumentId,
            contractName
        ),
        importBatchId: asOptionalString(provenance.importBatchId, contractName),
        apiClientId: asOptionalString(provenance.apiClientId, contractName),
        recordedByUserId: requireString(
            provenance.recordedByUserId,
            contractName
        ),
        recordedAt: requireString(provenance.recordedAt, contractName),
        confirmedByUserId: asOptionalString(
            provenance.confirmedByUserId,
            contractName
        ),
        confirmedAt: asOptionalString(provenance.confirmedAt, contractName),
        derivationReference: asOptionalString(
            provenance.derivationReference,
            contractName
        ),
    }
}

export const mapSemenBatch = (value) => {
    const batch = requireRecord(value, 'Semen batch')

    return {
        id: requireString(batch.id, 'Semen batch'),
        batchCode: requireString(batch.batchCode, 'Semen batch'),
        sireId: requireString(batch.sireId, 'Semen batch'),
        producerEstablishmentId: requireString(
            batch.producerEstablishmentId,
            'Semen batch'
        ),
        provenanceCode: requireString(batch.provenanceCode, 'Semen batch'),
        verificationStatus: requireString(
            batch.verificationStatus,
            'Semen batch'
        ),
        semenType: asOptionalString(batch.semenType, 'Semen batch'),
        ownerId: asOptionalString(batch.ownerId, 'Semen batch'),
        receivedAt: asOptionalString(batch.receivedAt, 'Semen batch'),
        status: requireString(batch.status, 'Semen batch'),
        version: requireVersion(batch.version, 'Semen batch'),
        provenance: mapProvenance(batch.provenance, 'Semen batch provenance'),
    }
}

export const mapExternalEstablishment = (value) => {
    const producer = requireRecord(value, 'External establishment')

    return {
        id: requireString(producer.id, 'External establishment'),
        legalPartyId: asOptionalString(
            producer.legalPartyId,
            'External establishment'
        ),
        name: requireString(producer.name, 'External establishment'),
        establishmentType: requireString(
            producer.establishmentType,
            'External establishment'
        ),
        registrationNumber: asOptionalString(
            producer.registrationNumber,
            'External establishment'
        ),
        registrationAuthority: asOptionalString(
            producer.registrationAuthority,
            'External establishment'
        ),
        country: requireString(producer.country, 'External establishment'),
        verificationStatus: requireString(
            producer.verificationStatus,
            'External establishment'
        ),
        verificationDocumentId: asOptionalString(
            producer.verificationDocumentId,
            'External establishment'
        ),
        status: requireString(producer.status, 'External establishment'),
        version: requireVersion(producer.version, 'External establishment'),
    }
}

export const mapSemenBatchPage = (value) => {
    const page = requireRecord(value, 'Semen batch page')

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError('Semen batch page')
    }

    return {
        items: page.items.map(mapSemenBatch),
        page: page.page,
        size: page.size,
    }
}

export const normalizeSemenBatchPageParams = ({
    query = '',
    page = 0,
    size = DEFAULT_SEMEN_BATCH_PAGE_SIZE,
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
        throw new TypeError('Invalid Semen batch page parameters.')
    }

    return { q: normalizedQuery, page, size }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

const requireId = (value, contractName) => requireString(value, contractName)

export const getSemenBatches = async ({ query, page, size, signal }) => {
    try {
        const response = await targetApiClient.get('/semen-batches', {
            params: normalizeSemenBatchPageParams({ query, page, size }),
            signal,
        })

        return mapSemenBatchPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar os lotes de sêmen.'
        )
    }
}

export const getSemenBatchById = async ({ semenBatchId, signal }) => {
    try {
        const id = requireId(semenBatchId, 'Semen batch identifier')
        const response = await targetApiClient.get(
            `/semen-batches/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapSemenBatch(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o lote de sêmen.'
        )
    }
}

export const getExternalEstablishmentById = async ({
    externalEstablishmentId,
    signal,
}) => {
    try {
        const id = requireId(
            externalEstablishmentId,
            'External establishment identifier'
        )
        const response = await targetApiClient.get(
            `/external-establishments/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapExternalEstablishment(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o produtor externo.'
        )
    }
}
