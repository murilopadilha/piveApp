import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'
import { mapMatingLineage } from '../../fertilization/api/matingApi'

export const DEFAULT_TRANSFER_PAGE_SIZE = 20

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

const mapProvenance = (value, contractName) => {
    const provenance = requireRecord(value, contractName)

    return {
        originType: requireString(provenance.originType, contractName),
        sourceDocumentId: optionalString(provenance.sourceDocumentId, contractName),
        importBatchId: optionalString(provenance.importBatchId, contractName),
        apiClientId: optionalString(provenance.apiClientId, contractName),
        recordedByUserId: requireString(provenance.recordedByUserId, contractName),
        recordedAt: requireString(provenance.recordedAt, contractName),
        confirmedByUserId: optionalString(provenance.confirmedByUserId, contractName),
        confirmedAt: optionalString(provenance.confirmedAt, contractName),
        derivationReference: optionalString(provenance.derivationReference, contractName),
    }
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

export const mapRecipientCycle = (value) => {
    const cycle = requireRecord(value, 'Recipient cycle')

    return {
        id: requireString(cycle.id, 'Recipient cycle'),
        recipientAnimalId: requireString(
            cycle.recipientAnimalId,
            'Recipient cycle'
        ),
        recipientName: optionalText(cycle.recipientName, 'Recipient cycle'),
        protocolVersionId: optionalString(
            cycle.protocolVersionId,
            'Recipient cycle'
        ),
        openedOn: requireString(cycle.openedOn, 'Recipient cycle'),
        closedOn: optionalString(cycle.closedOn, 'Recipient cycle'),
        status: requireString(cycle.status, 'Recipient cycle'),
        notes: optionalText(cycle.notes, 'Recipient cycle'),
        closureReason: optionalText(cycle.closureReason, 'Recipient cycle'),
        version: requireNonnegativeInteger(cycle.version, 'Recipient cycle'),
        provenance: mapProvenance(cycle.provenance, 'Recipient cycle provenance'),
    }
}

export const mapRecipientCyclePage = value => mapPage(
    value,
    'Recipient cycle page',
    mapRecipientCycle
)

export const mapTransfer = (value) => {
    const transfer = requireRecord(value, 'Embryo transfer')

    return {
        id: requireString(transfer.id, 'Embryo transfer'),
        reservationId: requireString(transfer.reservationId, 'Embryo transfer'),
        embryoId: requireString(transfer.embryoId, 'Embryo transfer'),
        recipientCycleId: requireString(
            transfer.recipientCycleId,
            'Embryo transfer'
        ),
        performedAt: requireString(transfer.performedAt, 'Embryo transfer'),
        timezone: requireString(transfer.timezone, 'Embryo transfer'),
        origin: requireString(transfer.origin, 'Embryo transfer'),
        thawEventId: optionalString(transfer.thawEventId, 'Embryo transfer'),
        operatorProfessionalId: requireString(
            transfer.operatorProfessionalId,
            'Embryo transfer'
        ),
        notes: optionalText(transfer.notes, 'Embryo transfer'),
        provenance: mapProvenance(transfer.provenance, 'Embryo transfer provenance'),
    }
}

export const mapTransferPage = value => mapPage(
    value,
    'Embryo transfer page',
    mapTransfer
)

export const mapTransferDetail = (value) => {
    const detail = requireRecord(value, 'Embryo transfer detail')
    const lineage = requireRecord(detail.lineage, 'Embryo transfer lineage')

    return {
        transfer: mapTransfer(detail.transfer),
        lineage: {
            embryoId: requireString(lineage.embryoId, 'Embryo transfer lineage'),
            matingId: requireString(lineage.matingId, 'Embryo transfer lineage'),
            mating: mapMatingLineage(lineage.mating),
        },
    }
}

export const mapPregnancyCheck = (value) => {
    const check = requireRecord(value, 'Pregnancy check')

    return {
        id: requireString(check.id, 'Pregnancy check'),
        transferId: requireString(check.transferId, 'Pregnancy check'),
        checkedAt: requireString(check.checkedAt, 'Pregnancy check'),
        timezone: requireString(check.timezone, 'Pregnancy check'),
        result: requireString(check.result, 'Pregnancy check'),
        methodCode: requireString(check.methodCode, 'Pregnancy check'),
        observations: optionalText(check.observations, 'Pregnancy check'),
        professionalId: requireString(check.professionalId, 'Pregnancy check'),
        supersedesCheckId: optionalString(
            check.supersedesCheckId,
            'Pregnancy check'
        ),
        correctionReason: optionalText(check.correctionReason, 'Pregnancy check'),
        provenance: mapProvenance(check.provenance, 'Pregnancy check provenance'),
    }
}

export const mapPregnancyHistoryEntry = (value) => {
    const entry = requireRecord(value, 'Pregnancy history entry')

    return {
        check: mapPregnancyCheck(entry.check),
        invalidationId: optionalString(
            entry.invalidationId,
            'Pregnancy history entry'
        ),
        invalidationReason: optionalText(
            entry.invalidationReason,
            'Pregnancy history entry'
        ),
        invalidatedAt: optionalString(
            entry.invalidatedAt,
            'Pregnancy history entry'
        ),
    }
}

export const mapPregnancyHistoryPage = value => mapPage(
    value,
    'Pregnancy history page',
    mapPregnancyHistoryEntry
)

export const mapLatestPregnancyOutcome = (value) => {
    const outcome = requireRecord(value, 'Pregnancy outcome')

    return {
        transferId: requireString(outcome.transferId, 'Pregnancy outcome'),
        latestValidCheck: outcome.latestValidCheck == null
            ? null
            : mapPregnancyCheck(outcome.latestValidCheck),
    }
}

export const mapPregnancyFollowUp = (value) => {
    const followUp = requireRecord(value, 'Pregnancy follow-up')

    return {
        transferId: requireString(followUp.transferId, 'Pregnancy follow-up'),
        embryoId: requireString(followUp.embryoId, 'Pregnancy follow-up'),
        recipientCycleId: requireString(
            followUp.recipientCycleId,
            'Pregnancy follow-up'
        ),
        recipientAnimalId: requireString(
            followUp.recipientAnimalId,
            'Pregnancy follow-up'
        ),
        performedOn: requireString(followUp.performedOn, 'Pregnancy follow-up'),
        cohort: requireString(followUp.cohort, 'Pregnancy follow-up'),
        targetDay: requireNonnegativeInteger(followUp.targetDay, 'Pregnancy follow-up'),
        windowFromDay: requireNonnegativeInteger(
            followUp.windowFromDay,
            'Pregnancy follow-up'
        ),
        windowThroughDay: requireNonnegativeInteger(
            followUp.windowThroughDay,
            'Pregnancy follow-up'
        ),
        checkId: optionalString(followUp.checkId, 'Pregnancy follow-up'),
        result: optionalString(followUp.result, 'Pregnancy follow-up'),
        checkedAt: optionalString(followUp.checkedAt, 'Pregnancy follow-up'),
        checkedTimezone: optionalString(
            followUp.checkedTimezone,
            'Pregnancy follow-up'
        ),
        status: requireString(followUp.status, 'Pregnancy follow-up'),
    }
}

export const mapPregnancyFollowUpPage = value => mapPage(
    value,
    'Pregnancy follow-up page',
    mapPregnancyFollowUp
)

export const mapPregnancyCheckBatchResult = (value) => {
    const result = requireRecord(value, 'Pregnancy check batch result')

    if (!Array.isArray(result.items)) {
        throw contractError('Pregnancy check batch result')
    }

    return {
        batchId: requireString(result.batchId, 'Pregnancy check batch result'),
        items: result.items.map((item) => {
            const itemResult = requireRecord(
                item,
                'Pregnancy check batch item result'
            )

            return {
                itemId: requireString(
                    itemResult.itemId,
                    'Pregnancy check batch item result'
                ),
                checkId: requireString(
                    itemResult.checkId,
                    'Pregnancy check batch item result'
                ),
                transferId: requireString(
                    itemResult.transferId,
                    'Pregnancy check batch item result'
                ),
                status: requireString(
                    itemResult.status,
                    'Pregnancy check batch item result'
                ),
            }
        }),
    }
}

export const mapPregnancyCheckInvalidation = (value) => {
    const invalidation = requireRecord(value, 'Pregnancy check invalidation')

    return {
        id: requireString(invalidation.id, 'Pregnancy check invalidation'),
        checkId: requireString(
            invalidation.checkId,
            'Pregnancy check invalidation'
        ),
        transferId: requireString(
            invalidation.transferId,
            'Pregnancy check invalidation'
        ),
        reason: requireString(
            invalidation.reason,
            'Pregnancy check invalidation'
        ),
        actorId: requireString(
            invalidation.actorId,
            'Pregnancy check invalidation'
        ),
        recordedAt: requireString(
            invalidation.recordedAt,
            'Pregnancy check invalidation'
        ),
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
        throw new TypeError('Invalid Transfer page parameters.')
    }
}

export const normalizeRecipientCyclePageParams = ({
    recipientId = null,
    status = null,
    page = 0,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
} = {}) => {
    normalizePage({ page, size })
    if (status != null && !['OPEN', 'CLOSED', 'CANCELLED'].includes(status)) {
        throw new TypeError('Invalid Recipient cycle status filter.')
    }

    return {
        ...(recipientId ? { recipientId: requireString(recipientId, 'Recipient') } : {}),
        ...(status ? { status } : {}),
        page,
        size,
    }
}

export const normalizeTransferPageParams = ({
    recipientCycleId = null,
    embryoId = null,
    page = 0,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
} = {}) => {
    normalizePage({ page, size })

    return {
        ...(recipientCycleId ? {
            recipientCycleId: requireString(recipientCycleId, 'Recipient cycle'),
        } : {}),
        ...(embryoId ? { embryoId: requireString(embryoId, 'Embryo') } : {}),
        page,
        size,
    }
}

export const normalizePregnancyFollowUpParams = ({
    cohort,
    asOf,
    page = 0,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
}) => {
    normalizePage({ page, size })
    if (!['D30', 'D60'].includes(cohort)) {
        throw new TypeError('Invalid Pregnancy follow-up cohort.')
    }
    if (typeof asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
        throw new TypeError('Invalid Pregnancy follow-up analysis date.')
    }

    return { cohort, asOf, page, size }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getRecipientCycles = async params => {
    try {
        const { signal, ...input } = params
        const response = await targetApiClient.get('/recipient-cycles', {
            params: normalizeRecipientCyclePageParams(input),
            signal,
        })

        return mapRecipientCyclePage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os ciclos de receptoras.')
    }
}

export const getRecipientCycleById = async ({ recipientCycleId, signal }) => {
    try {
        const id = requireString(recipientCycleId, 'Recipient cycle')
        const response = await targetApiClient.get(
            `/recipient-cycles/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapRecipientCycle(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o ciclo da receptora.')
    }
}

export const openRecipientCycle = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/recipient-cycles',
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapRecipientCycle(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível abrir o ciclo da receptora.')
    }
}

export const closeRecipientCycle = async (intent) => {
    try {
        const id = requireString(intent.recipientCycleId, 'Recipient cycle')
        const response = await targetApiClient.post(
            `/recipient-cycles/${encodeURIComponent(id)}:close`,
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapRecipientCycle(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível fechar o ciclo da receptora.')
    }
}

export const getTransfers = async params => {
    try {
        const { signal, ...input } = params
        const response = await targetApiClient.get('/transfers', {
            params: normalizeTransferPageParams(input),
            signal,
        })

        return mapTransferPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar as transferências realizadas.')
    }
}

export const getTransferById = async ({ transferId, signal }) => {
    try {
        const id = requireString(transferId, 'Embryo transfer')
        const response = await targetApiClient.get(
            `/transfers/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapTransferDetail(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar a transferência.')
    }
}

export const getPregnancyChecks = async ({
    transferId,
    page = 0,
    size = DEFAULT_TRANSFER_PAGE_SIZE,
    signal,
}) => {
    try {
        normalizePage({ page, size })
        const id = requireString(transferId, 'Embryo transfer')
        const response = await targetApiClient.get(
            `/transfers/${encodeURIComponent(id)}/pregnancy-checks`,
            { params: { page, size }, signal }
        )

        return mapPregnancyHistoryPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o histórico gestacional.')
    }
}

export const getPregnancyOutcome = async ({ transferId, signal }) => {
    try {
        const id = requireString(transferId, 'Embryo transfer')
        const response = await targetApiClient.get(
            `/transfers/${encodeURIComponent(id)}/pregnancy-outcome`,
            { signal }
        )

        return mapLatestPregnancyOutcome(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o resultado gestacional.')
    }
}

export const getPregnancyFollowUps = async params => {
    try {
        const { signal, ...input } = params
        const response = await targetApiClient.get('/pregnancy-follow-ups', {
            params: normalizePregnancyFollowUpParams(input),
            signal,
        })

        return mapPregnancyFollowUpPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os acompanhamentos gestacionais.')
    }
}

export const recordPregnancyCheck = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/pregnancy-checks:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapPregnancyCheckBatchResult(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível registrar a checagem gestacional.')
    }
}

export const invalidatePregnancyCheck = async (intent) => {
    try {
        const id = requireString(intent.checkId, 'Pregnancy check')
        const response = await targetApiClient.post(
            `/pregnancy-checks/${encodeURIComponent(id)}:invalidate`,
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapPregnancyCheckInvalidation(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível invalidar a checagem gestacional.')
    }
}
