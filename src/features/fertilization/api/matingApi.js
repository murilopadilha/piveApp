import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'
import {
    mapExternalEstablishment,
    mapSemenBatch,
} from '../../semen/api/semenApi'

export const DEFAULT_MATING_PAGE_SIZE = 20

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

const requireNonnegativeInteger = (value, contractName) => {
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

const mapProvenance = (value) => {
    const provenance = requireRecord(value, 'Mating provenance')

    return {
        originType: requireString(
            provenance.originType,
            'Mating provenance'
        ),
        sourceDocumentId: asOptionalString(
            provenance.sourceDocumentId,
            'Mating provenance'
        ),
        importBatchId: asOptionalString(
            provenance.importBatchId,
            'Mating provenance'
        ),
        apiClientId: asOptionalString(
            provenance.apiClientId,
            'Mating provenance'
        ),
        recordedByUserId: requireString(
            provenance.recordedByUserId,
            'Mating provenance'
        ),
        recordedAt: requireString(
            provenance.recordedAt,
            'Mating provenance'
        ),
        confirmedByUserId: asOptionalString(
            provenance.confirmedByUserId,
            'Mating provenance'
        ),
        confirmedAt: asOptionalString(
            provenance.confirmedAt,
            'Mating provenance'
        ),
        derivationReference: asOptionalString(
            provenance.derivationReference,
            'Mating provenance'
        ),
    }
}

export const mapMating = (value) => {
    const mating = requireRecord(value, 'Mating')

    return {
        id: requireString(mating.id, 'Mating'),
        collectionId: requireString(mating.collectionId, 'Mating'),
        semenBatchId: requireString(mating.semenBatchId, 'Mating'),
        allocatedOocytes: requireNonnegativeInteger(
            mating.allocatedOocytes,
            'Mating'
        ),
        fertilizedAt: requireString(mating.fertilizedAt, 'Mating'),
        method: requireString(mating.method, 'Mating'),
        responsibleProfessionalId: asOptionalString(
            mating.responsibleProfessionalId,
            'Mating'
        ),
        status: requireString(mating.status, 'Mating'),
        version: requireNonnegativeInteger(mating.version, 'Mating'),
        provenance: mapProvenance(mating.provenance),
    }
}

const mapSireIdentifier = (value) => {
    const identifier = requireRecord(value, 'Mating sire identifier')

    return {
        type: requireString(identifier.type, 'Mating sire identifier'),
        issuer: asOptionalString(identifier.issuer, 'Mating sire identifier'),
        value: requireString(identifier.value, 'Mating sire identifier'),
    }
}

const mapSireSnapshot = (value) => {
    const sire = requireRecord(value, 'Mating sire snapshot')

    if (!Array.isArray(sire.identifiers)) {
        throw contractError('Mating sire snapshot')
    }

    return {
        id: requireString(sire.id, 'Mating sire snapshot'),
        name: asOptionalString(sire.name, 'Mating sire snapshot'),
        sex: requireString(sire.sex, 'Mating sire snapshot'),
        status: requireString(sire.status, 'Mating sire snapshot'),
        version: requireNonnegativeInteger(
            sire.version,
            'Mating sire snapshot'
        ),
        identifiers: sire.identifiers.map(mapSireIdentifier),
    }
}

export const mapMatingDetail = (value) => {
    const detail = requireRecord(value, 'Mating detail')
    const lineage = requireRecord(detail.lineage, 'Mating lineage')
    const semen = requireRecord(lineage.semen, 'Mating semen lineage')

    return {
        mating: mapMating(detail.mating),
        lineage: {
            collectionId: requireString(
                lineage.collectionId,
                'Mating lineage'
            ),
            donorId: requireString(lineage.donorId, 'Mating lineage'),
            semen: {
                batch: mapSemenBatch(semen.batch),
                sire: mapSireSnapshot(semen.sire),
                producer: mapExternalEstablishment(semen.producer),
            },
        },
    }
}

export const mapMatingPage = (value) => {
    const page = requireRecord(value, 'Mating page')

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError('Mating page')
    }

    return {
        items: page.items.map(mapMating),
        page: page.page,
        size: page.size,
    }
}

export const mapMatingBatchResult = (value) => {
    const result = requireRecord(value, 'Mating batch result')

    if (!Array.isArray(result.items)) {
        throw contractError('Mating batch result')
    }

    return {
        batchId: requireString(result.batchId, 'Mating batch result'),
        items: result.items.map((value) => {
            const item = requireRecord(value, 'Mating batch item result')

            return {
                itemId: requireString(item.itemId, 'Mating batch item result'),
                matingId: requireString(
                    item.matingId,
                    'Mating batch item result'
                ),
                status: requireString(item.status, 'Mating batch item result'),
            }
        }),
    }
}

export const normalizeMatingPageParams = ({
    collectionId,
    semenBatchId,
    page = 0,
    size = DEFAULT_MATING_PAGE_SIZE,
} = {}) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid Mating page parameters.')
    }

    const params = { page, size }

    if (collectionId != null) {
        params.collectionId = requireString(
            collectionId,
            'Mating collection filter'
        )
    }
    if (semenBatchId != null) {
        params.semenBatchId = requireString(
            semenBatchId,
            'Mating Semen batch filter'
        )
    }

    return params
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getMatings = async ({
    collectionId,
    semenBatchId,
    page,
    size,
    signal,
}) => {
    try {
        const response = await targetApiClient.get('/matings', {
            params: normalizeMatingPageParams({
                collectionId,
                semenBatchId,
                page,
                size,
            }),
            signal,
        })

        return mapMatingPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar as alocações.')
    }
}

export const getMatingById = async ({ matingId, signal }) => {
    try {
        const id = requireString(matingId, 'Mating identifier')
        const response = await targetApiClient.get(
            `/matings/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapMatingDetail(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar a alocação.')
    }
}

export const allocateMatings = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/matings:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapMatingBatchResult(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível registrar as alocações.')
    }
}
