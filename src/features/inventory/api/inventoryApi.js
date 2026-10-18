import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_INVENTORY_PAGE_SIZE = 20

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

const optionalString = (value, contractName) => (
    value == null ? null : requireString(value, contractName)
)

const optionalText = (value, contractName) => {
    if (value == null) {
        return null
    }
    if (typeof value !== 'string') {
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

export const mapEmbryoPackage = (value) => {
    const item = requireRecord(value, 'Embryo package')

    return {
        id: requireString(item.id, 'Embryo package'),
        establishmentId: requireString(item.establishmentId, 'Embryo package'),
        packageCode: requireString(item.packageCode, 'Embryo package'),
        packagingType: requireString(item.packagingType, 'Embryo package'),
        ownerPartyId: optionalString(item.ownerPartyId, 'Embryo package'),
        status: requireString(item.status, 'Embryo package'),
        sealedAt: optionalString(item.sealedAt, 'Embryo package'),
        currentLocationId: optionalString(
            item.currentLocationId,
            'Embryo package'
        ),
        lastMovementSequence: requireNonnegativeInteger(
            item.lastMovementSequence,
            'Embryo package'
        ),
        version: requireNonnegativeInteger(item.version, 'Embryo package'),
    }
}

export const mapEmbryoPackagePage = value => mapPage(
    value,
    'Embryo package page',
    mapEmbryoPackage
)

export const mapPackageItem = (value) => {
    const item = requireRecord(value, 'Package item')

    return {
        id: requireString(item.id, 'Package item'),
        cryopreservationItemId: requireString(
            item.cryopreservationItemId,
            'Package item'
        ),
        embryoId: requireString(item.embryoId, 'Package item'),
        positionCode: optionalText(item.positionCode, 'Package item'),
    }
}

export const mapStorageLocation = (value) => {
    const location = requireRecord(value, 'Storage location')

    return {
        id: requireString(location.id, 'Storage location'),
        establishmentId: requireString(
            location.establishmentId,
            'Storage location'
        ),
        operationalLocationId: optionalString(
            location.operationalLocationId,
            'Storage location'
        ),
        parentId: optionalString(location.parentId, 'Storage location'),
        typeCode: requireString(location.typeCode, 'Storage location'),
        code: requireString(location.code, 'Storage location'),
        name: optionalText(location.name, 'Storage location'),
        status: requireString(location.status, 'Storage location'),
        version: requireNonnegativeInteger(location.version, 'Storage location'),
    }
}

export const mapStorageLocationPage = value => mapPage(
    value,
    'Storage location page',
    mapStorageLocation
)

export const mapInventoryMovement = (value) => {
    const movement = requireRecord(value, 'Inventory movement')

    return {
        id: requireString(movement.id, 'Inventory movement'),
        sequence: requireNonnegativeInteger(
            movement.sequence,
            'Inventory movement'
        ),
        type: requireString(movement.type, 'Inventory movement'),
        fromLocationId: optionalString(
            movement.fromLocationId,
            'Inventory movement'
        ),
        toLocationId: optionalString(
            movement.toLocationId,
            'Inventory movement'
        ),
        occurredAt: requireString(movement.occurredAt, 'Inventory movement'),
        reason: optionalText(movement.reason, 'Inventory movement'),
    }
}

export const mapInventoryMovementPage = value => mapPage(
    value,
    'Inventory movement page',
    mapInventoryMovement
)

export const mapProjectionCheck = (value) => {
    const projection = requireRecord(value, 'Inventory projection check')
    if (typeof projection.matchesLedger !== 'boolean') {
        throw contractError('Inventory projection check')
    }

    return { matchesLedger: projection.matchesLedger }
}

export const mapMovementResult = (value) => {
    const result = requireRecord(value, 'Inventory movement result')

    return {
        id: requireString(result.id, 'Inventory movement result'),
        packageId: requireString(result.packageId, 'Inventory movement result'),
        sequence: requireNonnegativeInteger(
            result.sequence,
            'Inventory movement result'
        ),
        currentLocationId: optionalString(
            result.currentLocationId,
            'Inventory movement result'
        ),
        version: requireNonnegativeInteger(
            result.version,
            'Inventory movement result'
        ),
    }
}

export const mapMovementBatchResult = (value) => {
    const result = requireRecord(value, 'Inventory movement batch result')
    if (!Array.isArray(result.items)) {
        throw contractError('Inventory movement batch result')
    }

    return {
        batchId: requireString(result.batchId, 'Inventory movement batch result'),
        items: result.items.map(mapMovementResult),
    }
}

const normalizePage = ({ page, size }) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid inventory page parameters.')
    }
}

export const normalizePackagePageParams = ({
    query = '',
    locationId = null,
    ownerId = null,
    page = 0,
    size = DEFAULT_INVENTORY_PAGE_SIZE,
} = {}) => {
    normalizePage({ page, size })
    const q = typeof query === 'string' ? query.trim() : null
    if (q == null || q.length > 200) {
        throw new TypeError('Invalid package search query.')
    }

    return {
        q,
        ...(locationId ? {
            locationId: requireString(locationId, 'Storage location filter'),
        } : {}),
        ...(ownerId ? { ownerId: requireString(ownerId, 'Owner filter') } : {}),
        page,
        size,
    }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getEmbryoPackages = async params => {
    try {
        const { signal, ...input } = params
        const response = await targetApiClient.get('/embryo-packages', {
            params: normalizePackagePageParams(input),
            signal,
        })

        return mapEmbryoPackagePage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os packages.')
    }
}

export const getEmbryoPackageById = async ({ packageId, signal }) => {
    try {
        const id = requireString(packageId, 'Embryo package identifier')
        const response = await targetApiClient.get(
            `/embryo-packages/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapEmbryoPackage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o package.')
    }
}

export const getEmbryoPackageItems = async ({ packageId, signal }) => {
    try {
        const id = requireString(packageId, 'Embryo package identifier')
        const response = await targetApiClient.get(
            `/embryo-packages/${encodeURIComponent(id)}/items`,
            { signal }
        )
        if (!Array.isArray(response.data)) {
            throw contractError('Package item list')
        }

        return response.data.map(mapPackageItem)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o conteúdo do package.'
        )
    }
}

export const getStorageLocations = async ({
    page = 0,
    size = DEFAULT_INVENTORY_PAGE_SIZE,
    signal,
} = {}) => {
    try {
        normalizePage({ page, size })
        const response = await targetApiClient.get('/storage-locations', {
            params: { page, size },
            signal,
        })

        return mapStorageLocationPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar os locais de armazenamento.'
        )
    }
}

export const getStorageLocationById = async ({ storageLocationId, signal }) => {
    try {
        const id = requireString(storageLocationId, 'Storage location identifier')
        const response = await targetApiClient.get(
            `/storage-locations/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapStorageLocation(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o local de armazenamento.'
        )
    }
}

export const getInventoryMovementLedger = async ({
    packageId,
    page = 0,
    size = DEFAULT_INVENTORY_PAGE_SIZE,
    signal,
}) => {
    try {
        normalizePage({ page, size })
        const id = requireString(packageId, 'Embryo package identifier')
        const response = await targetApiClient.get(
            `/inventory-movements/packages/${encodeURIComponent(id)}`,
            { params: { page, size }, signal }
        )

        return mapInventoryMovementPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o histórico de movimentos.'
        )
    }
}

export const getInventoryProjectionCheck = async ({ packageId, signal }) => {
    try {
        const id = requireString(packageId, 'Embryo package identifier')
        const response = await targetApiClient.get(
            `/inventory-movements/packages/${encodeURIComponent(id)}/projection-check`,
            { signal }
        )

        return mapProjectionCheck(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível verificar a projeção do inventário.'
        )
    }
}

export const recordInventoryMovement = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/inventory-movements',
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapMovementResult(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível registrar o movimento.')
    }
}

export const recordInventoryMovementBatch = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/inventory-movements/bulk',
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapMovementBatchResult(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível registrar o lote de movimentos.'
        )
    }
}
