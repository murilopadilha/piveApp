import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_EMBRYO_PAGE_SIZE = 20
export const DEFAULT_EMBRYO_TIMELINE_PAGE_SIZE = 20
export const DEFAULT_EMBRYO_AUDIT_PAGE_SIZE = 20

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

const requireInteger = (value, contractName) => {
    if (!Number.isInteger(value)) {
        throw contractError(contractName)
    }

    return value
}

const requireNonnegativeInteger = (value, contractName) => {
    const integer = requireInteger(value, contractName)

    if (integer < 0) {
        throw contractError(contractName)
    }

    return integer
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

export const mapEmbryoHold = (value) => {
    const hold = requireRecord(value, 'Embryo hold')

    return {
        id: requireString(hold.id, 'Embryo hold'),
        embryoId: requireString(hold.embryoId, 'Embryo hold'),
        type: requireString(hold.type, 'Embryo hold'),
        reason: requireString(hold.reason, 'Embryo hold'),
        openedBy: requireString(hold.openedBy, 'Embryo hold'),
        openedAt: requireString(hold.openedAt, 'Embryo hold'),
        releasedBy: optionalString(hold.releasedBy, 'Embryo hold'),
        releasedAt: optionalString(hold.releasedAt, 'Embryo hold'),
        releaseReason: optionalString(hold.releaseReason, 'Embryo hold'),
    }
}

export const mapEmbryoEvaluation = (value) => {
    const evaluation = requireRecord(value, 'Embryo evaluation')

    return {
        id: requireString(evaluation.id, 'Embryo evaluation'),
        embryoId: requireString(evaluation.embryoId, 'Embryo evaluation'),
        schemeVersionId: requireString(
            evaluation.schemeVersionId,
            'Embryo evaluation'
        ),
        developmentStageCodeId: requireString(
            evaluation.developmentStageCodeId,
            'Embryo evaluation'
        ),
        qualityGradeCodeId: requireString(
            evaluation.qualityGradeCodeId,
            'Embryo evaluation'
        ),
        evaluatedAt: requireString(evaluation.evaluatedAt, 'Embryo evaluation'),
        evaluatorProfessionalId: optionalString(
            evaluation.evaluatorProfessionalId,
            'Embryo evaluation'
        ),
        notes: optionalText(evaluation.notes, 'Embryo evaluation'),
        supersedesEvaluationId: optionalString(
            evaluation.supersedesEvaluationId,
            'Embryo evaluation'
        ),
        provenance: mapProvenance(
            evaluation.provenance,
            'Embryo evaluation provenance'
        ),
    }
}

export const mapEmbryo = (value) => {
    const embryo = requireRecord(value, 'Embryo')

    if (!Array.isArray(embryo.holds)) {
        throw contractError('Embryo')
    }

    return {
        id: requireString(embryo.id, 'Embryo'),
        matingId: requireString(embryo.matingId, 'Embryo'),
        humanCode: requireString(embryo.humanCode, 'Embryo'),
        ownerId: optionalString(embryo.ownerId, 'Embryo'),
        identifiedAt: requireString(embryo.identifiedAt, 'Embryo'),
        availability: requireString(embryo.availability, 'Embryo'),
        preservation: requireString(embryo.preservation, 'Embryo'),
        holds: embryo.holds.map(mapEmbryoHold),
        currentLocationId: optionalString(embryo.currentLocationId, 'Embryo'),
        currentEvaluation: embryo.currentEvaluation == null
            ? null
            : mapEmbryoEvaluation(embryo.currentEvaluation),
        version: requireNonnegativeInteger(embryo.version, 'Embryo'),
        provenance: mapProvenance(embryo.provenance, 'Embryo provenance'),
    }
}

export const mapEmbryoPage = (value) => {
    const page = requireRecord(value, 'Embryo page')

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError('Embryo page')
    }

    return {
        items: page.items.map(mapEmbryo),
        page: page.page,
        size: page.size,
    }
}

export const mapAssessmentVersion = (value) => {
    const version = requireRecord(value, 'Assessment version')

    if (!Array.isArray(version.codes) || version.codes.length < 1) {
        throw contractError('Assessment version')
    }

    return {
        id: requireString(version.id, 'Assessment version'),
        schemeId: requireString(version.schemeId, 'Assessment version'),
        versionLabel: requireString(version.versionLabel, 'Assessment version'),
        effectiveFrom: optionalString(version.effectiveFrom, 'Assessment version'),
        status: requireString(version.status, 'Assessment version'),
        publishedBy: requireString(version.publishedBy, 'Assessment version'),
        publishedAt: requireString(version.publishedAt, 'Assessment version'),
        codes: version.codes.map((value) => {
            const code = requireRecord(value, 'Assessment code')

            return {
                id: requireString(code.id, 'Assessment code'),
                schemeVersionId: requireString(
                    code.schemeVersionId,
                    'Assessment code'
                ),
                dimension: requireString(code.dimension, 'Assessment code'),
                code: requireString(code.code, 'Assessment code'),
                displayName: requireString(code.displayName, 'Assessment code'),
                sortOrder: requireInteger(code.sortOrder, 'Assessment code'),
            }
        }),
    }
}

export const mapEmbryoBatchResult = (value) => {
    const result = requireRecord(value, 'Embryo batch result')

    if (!Array.isArray(result.items)) {
        throw contractError('Embryo batch result')
    }

    return {
        batchId: requireString(result.batchId, 'Embryo batch result'),
        items: result.items.map((value) => {
            const item = requireRecord(value, 'Embryo batch item result')

            return {
                itemId: requireString(item.itemId, 'Embryo batch item result'),
                embryoId: requireString(item.embryoId, 'Embryo batch item result'),
                status: requireString(item.status, 'Embryo batch item result'),
            }
        }),
    }
}

export const mapEmbryoTraceability = (value) => {
    const lineage = requireRecord(value, 'Embryo traceability')

    return {
        embryoId: requireString(lineage.embryoId, 'Embryo traceability'),
        humanCode: requireString(lineage.humanCode, 'Embryo traceability'),
        matingId: optionalString(lineage.matingId, 'Embryo traceability'),
        collectionId: optionalString(lineage.collectionId, 'Embryo traceability'),
        donorId: optionalString(lineage.donorId, 'Embryo traceability'),
        opuSessionId: optionalString(lineage.opuSessionId, 'Embryo traceability'),
        farmPropertyId: optionalString(lineage.farmPropertyId, 'Embryo traceability'),
        semenBatchId: optionalString(lineage.semenBatchId, 'Embryo traceability'),
        sireId: optionalString(lineage.sireId, 'Embryo traceability'),
        producerEstablishmentId: optionalString(
            lineage.producerEstablishmentId,
            'Embryo traceability'
        ),
        currentPackageId: optionalString(
            lineage.currentPackageId,
            'Embryo traceability'
        ),
        currentLocationId: optionalString(
            lineage.currentLocationId,
            'Embryo traceability'
        ),
        transferId: optionalString(lineage.transferId, 'Embryo traceability'),
        recipientCycleId: optionalString(
            lineage.recipientCycleId,
            'Embryo traceability'
        ),
        recipientAnimalId: optionalString(
            lineage.recipientAnimalId,
            'Embryo traceability'
        ),
    }
}

export const mapEmbryoTimelineEntry = (value) => {
    const entry = requireRecord(value, 'Embryo timeline entry')

    return {
        factId: requireString(entry.factId, 'Embryo timeline entry'),
        type: requireString(entry.type, 'Embryo timeline entry'),
        occurredAt: requireString(entry.occurredAt, 'Embryo timeline entry'),
        recordedAt: requireString(entry.recordedAt, 'Embryo timeline entry'),
        relatedId: optionalString(entry.relatedId, 'Embryo timeline entry'),
    }
}

export const mapAuditEvent = (value) => {
    const entry = requireRecord(value, 'Audit event')

    return {
        id: requireString(entry.id, 'Audit event'),
        occurredAt: requireString(entry.occurredAt, 'Audit event'),
        actorId: requireString(entry.actorId, 'Audit event'),
        action: requireString(entry.action, 'Audit event'),
        entityType: requireString(entry.entityType, 'Audit event'),
        entityId: requireString(entry.entityId, 'Audit event'),
        entityVersion: entry.entityVersion == null
            ? null
            : requireNonnegativeInteger(entry.entityVersion, 'Audit event'),
        reason: optionalText(entry.reason, 'Audit event'),
        correlationId: requireString(entry.correlationId, 'Audit event'),
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

export const mapEmbryoTimelinePage = value => mapPage(
    value,
    'Embryo timeline page',
    mapEmbryoTimelineEntry
)

export const mapAuditEventPage = value => mapPage(
    value,
    'Audit event page',
    mapAuditEvent
)

export const normalizeEmbryoPageParams = ({
    matingId = null,
    query = '',
    page = 0,
    size = DEFAULT_EMBRYO_PAGE_SIZE,
} = {}) => {
    const normalizedQuery = typeof query === 'string' ? query.trim() : null

    if (
        normalizedQuery == null ||
        normalizedQuery.length > 200 ||
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid Embryo page parameters.')
    }

    const params = { q: normalizedQuery, page, size }

    if (matingId != null) {
        params.matingId = requireString(matingId, 'Mating identifier')
    }

    return params
}

export const normalizeEmbryoHistoryPageParams = ({
    page = 0,
    size = 20,
} = {}) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid Embryo history page parameters.')
    }

    return { page, size }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getEmbryos = async ({ matingId, query, page, size, signal }) => {
    try {
        const response = await targetApiClient.get('/embryos', {
            params: normalizeEmbryoPageParams({ matingId, query, page, size }),
            signal,
        })

        return mapEmbryoPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os embriões.')
    }
}

export const getEmbryoById = async ({ embryoId, signal }) => {
    try {
        const id = requireString(embryoId, 'Embryo identifier')
        const response = await targetApiClient.get(
            `/embryos/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapEmbryo(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o embrião.')
    }
}

export const getEmbryoEvaluations = async ({ embryoId, signal }) => {
    try {
        const id = requireString(embryoId, 'Embryo identifier')
        const response = await targetApiClient.get(
            `/embryos/${encodeURIComponent(id)}/evaluations`,
            { signal }
        )

        if (!Array.isArray(response.data)) {
            throw contractError('Embryo evaluation history')
        }

        return response.data.map(mapEmbryoEvaluation)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o histórico de avaliações.'
        )
    }
}

export const getAssessmentVersionById = async ({ schemeVersionId, signal }) => {
    try {
        const id = requireString(schemeVersionId, 'Assessment version identifier')
        const response = await targetApiClient.get(
            `/assessment-schemes/versions/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapAssessmentVersion(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível resolver o catálogo histórico da avaliação.'
        )
    }
}

export const identifyEmbryos = async (intent) => {
    try {
        const response = await targetApiClient.post(
            '/embryos:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapEmbryoBatchResult(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível identificar os embriões.')
    }
}

export const openEmbryoHold = async (intent) => {
    try {
        const embryoId = requireString(intent.embryoId, 'Embryo identifier')
        const response = await targetApiClient.post(
            `/embryos/${encodeURIComponent(embryoId)}/holds`,
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapEmbryoHold(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível abrir o hold.')
    }
}

export const releaseEmbryoHold = async (intent) => {
    try {
        const embryoId = requireString(intent.embryoId, 'Embryo identifier')
        const holdId = requireString(intent.holdId, 'Hold identifier')
        const response = await targetApiClient.post(
            `/embryos/${encodeURIComponent(embryoId)}/holds/${encodeURIComponent(holdId)}:release`,
            intent.payload,
            { targetContext: { idempotencyKey: intent.idempotencyKey } }
        )

        return mapEmbryoHold(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível liberar o hold.')
    }
}

export const getEmbryoTraceability = async ({ embryoId, signal }) => {
    try {
        const id = requireString(embryoId, 'Embryo identifier')
        const response = await targetApiClient.get(
            `/embryos/${encodeURIComponent(id)}/traceability`,
            { signal }
        )

        return mapEmbryoTraceability(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a rastreabilidade do embrião.'
        )
    }
}

export const getEmbryoTimeline = async ({ embryoId, page, size, signal }) => {
    try {
        const id = requireString(embryoId, 'Embryo identifier')
        const response = await targetApiClient.get(
            `/embryos/${encodeURIComponent(id)}/timeline`,
            {
                params: normalizeEmbryoHistoryPageParams({ page, size }),
                signal,
            }
        )

        return mapEmbryoTimelinePage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a timeline do embrião.'
        )
    }
}

export const getEmbryoAuditEvents = async ({ embryoId, page, size, signal }) => {
    try {
        const id = requireString(embryoId, 'Embryo identifier')
        const response = await targetApiClient.get('/audit-events', {
            params: {
                entityType: 'EMBRYO',
                entityId: id,
                ...normalizeEmbryoHistoryPageParams({ page, size }),
            },
            signal,
        })

        return mapAuditEventPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a auditoria operacional.'
        )
    }
}
