import { createUuidV7 } from '../../utils/uuid'

const asNullableId = value => value || null

export const createMatingDraftItem = ({
    collectionId,
    semenBatchId,
    semenBatchCode,
    fertilizedAt,
    allocatedOocytes = '',
    method = '',
    responsibleProfessionalId = null,
    responsibleProfessionalName = null,
}) => ({
    itemId: createUuidV7(),
    matingId: createUuidV7(),
    collectionId,
    semenBatchId,
    semenBatchCode,
    allocatedOocytes,
    fertilizedAt,
    method,
    responsibleProfessionalId,
    responsibleProfessionalName,
})

export const updateMatingDraftItem = (item, changes) => ({
    ...item,
    ...changes,
    itemId: item.itemId,
    matingId: item.matingId,
    collectionId: item.collectionId,
})

const parseAllocation = (value) => {
    const text = String(value).trim()
    const allocation = Number(text)

    if (
        !/^[1-9]\d*$/.test(text) ||
        !Number.isSafeInteger(allocation) ||
        allocation > 2147483647
    ) {
        throw new TypeError('allocatedOocytes must be a positive integer.')
    }

    return allocation
}

export const validateMatingDraftItem = (item, collectedAt) => {
    if (!item.collectionId || !item.semenBatchId || !item.fertilizedAt) {
        throw new TypeError('Mating references and fertilizedAt are required.')
    }

    const method = typeof item.method === 'string'
        ? item.method.trim().toUpperCase()
        : ''
    const fertilizedAt = new Date(item.fertilizedAt).getTime()
    const collectionTime = new Date(collectedAt).getTime()

    if (!/^[A-Z][A-Z0-9_]{0,47}$/.test(method)) {
        throw new TypeError('method must have between one and 48 characters.')
    }

    if (
        !Number.isFinite(fertilizedAt) ||
        !Number.isFinite(collectionTime) ||
        fertilizedAt < collectionTime
    ) {
        throw new TypeError('fertilizedAt cannot precede collectedAt.')
    }

    return {
        itemId: item.itemId,
        id: item.matingId,
        collectionId: item.collectionId,
        semenBatchId: item.semenBatchId,
        allocatedOocytes: parseAllocation(item.allocatedOocytes),
        fertilizedAt: item.fertilizedAt,
        method,
        responsibleProfessionalId: asNullableId(
            item.responsibleProfessionalId
        ),
    }
}

const matingBatchPayload = ({ batchId, items, collectedAt }) => ({
    batchId,
    source: {
        origin: 'MANUAL',
        sourceDocumentId: null,
        apiClientId: null,
    },
    items: items.map(item => validateMatingDraftItem(item, collectedAt)),
})

export const createMatingBatchIntent = ({ items, collectedAt }) => {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
        throw new TypeError('Supply between one and 100 Mating items.')
    }

    const batchId = createUuidV7()

    return {
        idempotencyKey: batchId,
        sent: false,
        payload: matingBatchPayload({ batchId, items, collectedAt }),
    }
}

export const markMatingBatchIntentSent = intent => ({
    ...intent,
    sent: true,
})

export const renewMatingDraftItems = items => items.map(item => ({
    ...item,
    itemId: createUuidV7(),
    matingId: createUuidV7(),
}))
