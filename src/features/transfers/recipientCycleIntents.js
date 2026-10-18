import { createUuidV7 } from '../../utils/uuid'

const optionalText = value => {
    const normalized = typeof value === 'string' ? value.trim() : ''

    return normalized || null
}

const requireDate = (value, field) => {
    const parsed = typeof value === 'string'
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(Number.NaN)
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
    ) {
        throw new TypeError(`${field} must use YYYY-MM-DD.`)
    }

    return value
}

export const createOpenRecipientCycleIntent = ({
    recipientAnimalId,
    protocolVersionId = null,
    openedOn,
    notes = '',
}) => {
    if (!recipientAnimalId) {
        throw new TypeError('recipientAnimalId is required.')
    }
    const normalizedNotes = optionalText(notes)
    if (normalizedNotes && normalizedNotes.length > 1000) {
        throw new TypeError('notes must have at most 1000 characters.')
    }

    return {
        idempotencyKey: createUuidV7(),
        payload: {
            id: createUuidV7(),
            recipientAnimalId,
            protocolVersionId: protocolVersionId || null,
            openedOn: requireDate(openedOn, 'openedOn'),
            notes: normalizedNotes,
        },
    }
}

export const createCloseRecipientCycleIntent = ({
    recipientCycleId,
    expectedVersion,
    closedOn,
    reason,
}) => {
    const normalizedReason = optionalText(reason)
    if (!recipientCycleId || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
        throw new TypeError('recipientCycleId and expectedVersion are required.')
    }
    if (!normalizedReason || normalizedReason.length > 500) {
        throw new TypeError('reason must have between one and 500 characters.')
    }

    return {
        idempotencyKey: createUuidV7(),
        recipientCycleId,
        payload: {
            expectedVersion,
            closedOn: requireDate(closedOn, 'closedOn'),
            reason: normalizedReason,
        },
    }
}
