import { createUuidV7 } from '../../utils/uuid'

export const createEmbryoDraftItem = ({
    matingId,
    humanCode = '',
    ownerId = null,
    identifiedAt = new Date().toISOString(),
} = {}) => ({
    itemId: createUuidV7(),
    embryoId: createUuidV7(),
    matingId,
    humanCode,
    ownerId,
    identifiedAt,
})

export const updateEmbryoDraftItem = (item, changes) => ({
    ...item,
    ...changes,
    itemId: item.itemId,
    embryoId: item.embryoId,
    matingId: item.matingId,
})

const validateEmbryoDraftItem = (item) => {
    const humanCode = typeof item.humanCode === 'string'
        ? item.humanCode.trim()
        : ''
    const identifiedAt = new Date(item.identifiedAt).getTime()

    if (!humanCode || humanCode.length > 160) {
        throw new TypeError('humanCode must have between one and 160 characters.')
    }
    if (!item.matingId || !Number.isFinite(identifiedAt)) {
        throw new TypeError('matingId and identifiedAt are required.')
    }

    return {
        itemId: item.itemId,
        id: item.embryoId,
        matingId: item.matingId,
        humanCode,
        ownerId: item.ownerId || null,
        identifiedAt: item.identifiedAt,
    }
}

export const createEmbryoBatchIntent = (items) => {
    if (!Array.isArray(items) || items.length < 1 || items.length > 200) {
        throw new TypeError('Supply between one and 200 Embryo items.')
    }

    const batchId = createUuidV7()

    return {
        idempotencyKey: batchId,
        sent: false,
        payload: {
            batchId,
            source: {
                origin: 'MANUAL',
                sourceDocumentId: null,
                apiClientId: null,
            },
            items: items.map(validateEmbryoDraftItem),
        },
    }
}

export const markEmbryoBatchIntentSent = intent => ({
    ...intent,
    sent: true,
})

export const renewEmbryoDraftItems = items => items.map(item => ({
    ...item,
    itemId: createUuidV7(),
    embryoId: createUuidV7(),
}))
