import { createUuidV7 } from '../../utils/uuid'

const asNullableText = value => {
    const text = typeof value === 'string' ? value.trim() : ''

    return text || null
}

export const createOpenOpuIntent = fields => ({
    idempotencyKey: createUuidV7(),
    payload: {
        id: createUuidV7(),
        establishmentId: fields.establishmentId,
        operationalLocationId: fields.operationalLocationId ?? null,
        farmPropertyId: fields.farmPropertyId,
        clientId: fields.clientId ?? null,
        leadProfessionalId: fields.leadProfessionalId,
        performedAt: fields.performedAt,
        timezone: fields.timezone,
        notes: asNullableText(fields.notes),
    },
})

export const createSessionTransitionIntent = ({
    opuSessionId,
    expectedVersion,
    action,
}) => ({
    idempotencyKey: createUuidV7(),
    opuSessionId,
    action,
    payload: { expectedVersion },
})

export const createCollectionDraftItem = ({
    donorId,
    donorName,
    collectedAt,
    totalRecovered = '',
    viable = '',
    folliclesAspirated = '',
    notes = '',
}) => ({
    itemId: createUuidV7(),
    collectionId: createUuidV7(),
    donorId,
    donorName,
    collectedAt,
    totalRecovered,
    viable,
    folliclesAspirated,
    notes,
})

export const updateCollectionDraftItem = (item, changes) => ({
    ...item,
    ...changes,
    itemId: item.itemId,
    collectionId: item.collectionId,
})

const parseRequiredCount = (value, fieldName) => {
    const text = String(value).trim()

    if (!/^\d+$/.test(text)) {
        throw new TypeError(`${fieldName} must be a nonnegative integer.`)
    }

    return Number(text)
}

const parseOptionalCount = (value, fieldName) => {
    if (value == null || String(value).trim() === '') {
        return null
    }

    return parseRequiredCount(value, fieldName)
}

export const validateCollectionDraftItem = (item) => {
    const totalRecovered = parseRequiredCount(
        item.totalRecovered,
        'totalRecovered'
    )
    const viable = parseRequiredCount(item.viable, 'viable')
    const folliclesAspirated = parseOptionalCount(
        item.folliclesAspirated,
        'folliclesAspirated'
    )

    if (viable > totalRecovered) {
        throw new TypeError('viable cannot exceed totalRecovered.')
    }

    if (!item.donorId || !item.collectedAt) {
        throw new TypeError('donorId and collectedAt are required.')
    }

    return {
        itemId: item.itemId,
        id: item.collectionId,
        donorId: item.donorId,
        collectedAt: item.collectedAt,
        totalRecovered,
        viable,
        folliclesAspirated,
        notes: asNullableText(item.notes),
    }
}

const collectionBatchPayload = ({ batchId, expectedSessionVersion, items }) => ({
    batchId,
    expectedSessionVersion,
    source: {
        origin: 'MANUAL',
        sourceDocumentId: null,
        apiClientId: null,
    },
    items: items.map(validateCollectionDraftItem),
})

export const createCollectionBatchIntent = ({
    opuSessionId,
    expectedSessionVersion,
    items,
}) => {
    const batchId = createUuidV7()

    return {
        idempotencyKey: batchId,
        opuSessionId,
        payload: collectionBatchPayload({
            batchId,
            expectedSessionVersion,
            items,
        }),
    }
}

export const updateCollectionBatchIntent = (
    intent,
    { expectedSessionVersion, items }
) => ({
    ...intent,
    payload: collectionBatchPayload({
        batchId: intent.payload.batchId,
        expectedSessionVersion,
        items,
    }),
})

export const renewCollectionBatchIntent = (
    intent,
    { expectedSessionVersion, items }
) => createCollectionBatchIntent({
    opuSessionId: intent.opuSessionId,
    expectedSessionVersion,
    items,
})

export const createCollectionCorrectionIntent = ({
    oocyteCollectionId,
    expectedVersion,
    totalRecovered,
    viable,
    folliclesAspirated,
    notes,
    reason,
}) => {
    const total = parseRequiredCount(totalRecovered, 'totalRecovered')
    const viableCount = parseRequiredCount(viable, 'viable')

    if (viableCount > total) {
        throw new TypeError('viable cannot exceed totalRecovered.')
    }

    const normalizedReason = asNullableText(reason)

    if (!normalizedReason) {
        throw new TypeError('reason is required.')
    }

    return {
        idempotencyKey: createUuidV7(),
        oocyteCollectionId,
        payload: {
            expectedVersion,
            counts: {
                totalRecovered: total,
                viable: viableCount,
                folliclesAspirated: parseOptionalCount(
                    folliclesAspirated,
                    'folliclesAspirated'
                ),
            },
            notes: asNullableText(notes),
            reason: normalizedReason,
        },
    }
}
