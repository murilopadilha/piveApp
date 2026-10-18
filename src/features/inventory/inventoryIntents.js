import { validate as validateUuid, version as uuidVersion } from 'uuid'

import { createUuidV7 } from '../../utils/uuid'

export const INVENTORY_MOVEMENT_TYPES = Object.freeze([
    'RECEIVE',
    'STORE',
    'MOVE',
    'WITHDRAW',
])

const optionalReason = (value) => {
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (normalized.length > 500) {
        throw new TypeError('reason must have at most 500 characters.')
    }

    return normalized || null
}

const requireTimestamp = (value) => {
    if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) {
        throw new TypeError('occurredAt must be a valid timestamp.')
    }

    return value
}

export const validateInventoryMovement = ({
    id,
    packageId,
    type,
    expectedLocationId = null,
    destinationId = null,
    expectedVersion,
    occurredAt,
    reason = null,
}) => {
    if (
        !id ||
        !validateUuid(id) ||
        uuidVersion(id) !== 7 ||
        !packageId ||
        !INVENTORY_MOVEMENT_TYPES.includes(type)
    ) {
        throw new TypeError('Movement identity, package and type are required.')
    }
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
        throw new TypeError('expectedVersion must be a nonnegative integer.')
    }

    const expected = expectedLocationId || null
    const destination = destinationId || null
    if (
        (type === 'RECEIVE' || type === 'STORE') &&
        (expected !== null || destination === null)
    ) {
        throw new TypeError(`${type} requires no current location and a destination.`)
    }
    if (
        type === 'MOVE' &&
        (expected === null || destination === null || expected === destination)
    ) {
        throw new TypeError('MOVE requires distinct current and destination locations.')
    }
    if (type === 'WITHDRAW' && (expected === null || destination !== null)) {
        throw new TypeError('WITHDRAW requires a current location and no destination.')
    }

    return {
        id,
        packageId,
        type,
        expectedLocationId: expected,
        destinationId: destination,
        expectedVersion,
        occurredAt: requireTimestamp(occurredAt),
        reason: optionalReason(reason),
    }
}

export const createInventoryMovementIntent = input => {
    const movementId = createUuidV7()

    return {
        idempotencyKey: movementId,
        sent: false,
        payload: validateInventoryMovement({ ...input, id: movementId }),
    }
}

export const markInventoryMovementIntentSent = intent => ({
    ...intent,
    sent: true,
})

export const createInventoryMovementBatchIntent = (items) => {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
        throw new TypeError('Supply between one and 100 inventory movements.')
    }
    const batchId = createUuidV7()

    return {
        idempotencyKey: batchId,
        sent: false,
        payload: {
            batchId,
            items: items.map(validateInventoryMovement),
        },
    }
}

export const markInventoryMovementBatchIntentSent = intent => ({
    ...intent,
    sent: true,
})
