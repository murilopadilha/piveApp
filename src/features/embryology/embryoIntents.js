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

const HOLD_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{0,47}$/

const requireIdentifier = (value, field) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`${field} is required.`)
    }

    return value
}

const normalizeRequiredText = (value, maxLength, field) => {
    const raw = typeof value === 'string' ? value : ''
    const normalized = raw.trim()

    if (!normalized || raw.length > maxLength) {
        throw new TypeError(`${field} must have between one and ${maxLength} characters.`)
    }

    return normalized
}

export const normalizeEmbryoHoldType = (value) => {
    const normalized = normalizeRequiredText(value, 48, 'Hold type').toUpperCase()

    if (!HOLD_TYPE_PATTERN.test(normalized)) {
        throw new TypeError('Hold type must be an uppercase operational code.')
    }

    return normalized
}

export const createOpenEmbryoHoldIntent = ({ embryoId, type, reason }) => {
    const holdId = createUuidV7()

    return {
        idempotencyKey: createUuidV7(),
        embryoId: requireIdentifier(embryoId, 'Embryo identifier'),
        holdId,
        sent: false,
        payload: {
            id: holdId,
            type: normalizeEmbryoHoldType(type),
            reason: normalizeRequiredText(reason, 500, 'Hold reason'),
        },
    }
}

export const createReleaseEmbryoHoldIntent = ({
    embryoId,
    holdId,
    reason,
}) => ({
    idempotencyKey: createUuidV7(),
    embryoId: requireIdentifier(embryoId, 'Embryo identifier'),
    holdId: requireIdentifier(holdId, 'Hold identifier'),
    sent: false,
    payload: {
        reason: normalizeRequiredText(reason, 500, 'Hold release reason'),
    },
})

export const markEmbryoHoldIntentSent = intent => ({
    ...intent,
    sent: true,
})
