import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_DISTRIBUTION_PAGE_SIZE = 20

export const SHIPMENT_STATUSES = Object.freeze([
    'DRAFT',
    'SHIPPED',
    'CANCELLED',
])

export const RECALL_TRIGGER_TYPES = Object.freeze([
    'DONOR',
    'SEMEN_BATCH',
    'MATING',
    'PACKAGE',
    'OOCYTE_COLLECTION',
    'CRYOPRESERVATION_EVENT',
])

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
    if (value == null) return null
    if (typeof value !== 'string') throw contractError(contractName)
    return value
}

const requireNonnegativeInteger = (value, contractName) => {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw contractError(contractName)
    }
    return value
}

const optionalNonnegativeInteger = (value, contractName) => (
    value == null ? null : requireNonnegativeInteger(value, contractName)
)

const requireBoolean = (value, contractName) => {
    if (typeof value !== 'boolean') throw contractError(contractName)
    return value
}

const mapPage = (value, contractName, itemField, mapItem) => {
    const page = requireRecord(value, contractName)
    if (
        !Array.isArray(page[itemField]) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError(contractName)
    }
    return {
        [itemField]: page[itemField].map(mapItem),
        page: page.page,
        size: page.size,
    }
}

const mapAddress = (value) => {
    if (value == null) return null
    const address = requireRecord(value, 'Shipment destination address')
    return {
        addressLine: requireString(address.addressLine, 'Shipment destination address'),
        municipality: requireString(address.municipality, 'Shipment destination address'),
        state: requireString(address.state, 'Shipment destination address'),
        country: requireString(address.country, 'Shipment destination address'),
        postalCode: optionalText(address.postalCode, 'Shipment destination address'),
    }
}

const mapDestination = (value) => {
    const destination = requireRecord(value, 'Shipment destination')
    return {
        recipientName: requireString(destination.recipientName, 'Shipment destination'),
        legalName: optionalText(destination.legalName, 'Shipment destination'),
        recipientVersion: requireNonnegativeInteger(
            destination.recipientVersion,
            'Shipment destination'
        ),
        propertyName: optionalText(destination.propertyName, 'Shipment destination'),
        propertyVersion: optionalNonnegativeInteger(
            destination.propertyVersion,
            'Shipment destination'
        ),
        address: mapAddress(destination.address),
    }
}

export const mapShipmentSummary = (value) => {
    const shipment = requireRecord(value, 'Shipment summary')
    const status = requireString(shipment.status, 'Shipment summary')
    if (!SHIPMENT_STATUSES.includes(status)) throw contractError('Shipment summary')
    return {
        id: requireString(shipment.id, 'Shipment summary'),
        status,
        version: requireNonnegativeInteger(shipment.version, 'Shipment summary'),
        establishmentId: requireString(shipment.establishmentId, 'Shipment summary'),
        recipientId: requireString(shipment.recipientId, 'Shipment summary'),
        createdAt: requireString(shipment.createdAt, 'Shipment summary'),
    }
}

const mapShipmentItem = (value) => {
    const item = requireRecord(value, 'Shipment item')
    return {
        id: requireString(item.id, 'Shipment item'),
        packageId: requireString(item.packageId, 'Shipment item'),
        expectedVersion: requireNonnegativeInteger(item.expectedVersion, 'Shipment item'),
        expectedLocationId: requireString(item.expectedLocationId, 'Shipment item'),
        quantity: requireNonnegativeInteger(item.quantity, 'Shipment item'),
    }
}

const mapShipmentDocument = (value) => {
    const document = requireRecord(value, 'Shipment document link')
    return {
        id: requireString(document.id, 'Shipment document link'),
        typeCode: requireString(document.typeCode, 'Shipment document link'),
        documentId: requireString(document.documentId, 'Shipment document link'),
        versionId: requireString(document.versionId, 'Shipment document link'),
        number: optionalText(document.number, 'Shipment document link'),
        issuer: optionalText(document.issuer, 'Shipment document link'),
        issuedAt: optionalString(document.issuedAt, 'Shipment document link'),
    }
}

const mapDispatchEvidence = (value) => {
    if (value == null) return null
    const evidence = requireRecord(value, 'Shipment dispatch evidence')
    return {
        destination: mapDestination(evidence.destination),
        dispatchedAt: requireString(evidence.dispatchedAt, 'Shipment dispatch evidence'),
        regulatedDispatch: requireBoolean(
            evidence.regulatedDispatch,
            'Shipment dispatch evidence'
        ),
        complianceResult: requireString(
            evidence.complianceResult,
            'Shipment dispatch evidence'
        ),
        complianceExplanation: requireString(
            evidence.complianceExplanation,
            'Shipment dispatch evidence'
        ),
    }
}

export const mapShipment = (value) => {
    const shipment = requireRecord(value, 'Shipment')
    const status = requireString(shipment.status, 'Shipment')
    if (
        !SHIPMENT_STATUSES.includes(status) ||
        !Array.isArray(shipment.items) ||
        !Array.isArray(shipment.documents)
    ) {
        throw contractError('Shipment')
    }
    return {
        id: requireString(shipment.id, 'Shipment'),
        status,
        version: requireNonnegativeInteger(shipment.version, 'Shipment'),
        establishmentId: requireString(shipment.establishmentId, 'Shipment'),
        recipientId: requireString(shipment.recipientId, 'Shipment'),
        propertyId: optionalString(shipment.propertyId, 'Shipment'),
        purpose: requireString(shipment.purpose, 'Shipment'),
        items: shipment.items.map(mapShipmentItem),
        documents: shipment.documents.map(mapShipmentDocument),
        dispatchEvidence: mapDispatchEvidence(shipment.dispatchEvidence),
        receiptRecorded: requireBoolean(shipment.receiptRecorded, 'Shipment'),
    }
}

const mapReadinessEvaluation = (value) => {
    const evaluation = requireRecord(value, 'Shipment readiness evaluation')
    return {
        result: requireString(evaluation.result, 'Shipment readiness evaluation'),
        ruleVersion: optionalText(evaluation.ruleVersion, 'Shipment readiness evaluation'),
        explanationCode: requireString(
            evaluation.explanationCode,
            'Shipment readiness evaluation'
        ),
        originEstablishmentId: requireString(
            evaluation.originEstablishmentId,
            'Shipment readiness evaluation'
        ),
        destinationRecipientId: requireString(
            evaluation.destinationRecipientId,
            'Shipment readiness evaluation'
        ),
        destinationCountry: requireString(
            evaluation.destinationCountry,
            'Shipment readiness evaluation'
        ),
        purpose: requireString(evaluation.purpose, 'Shipment readiness evaluation'),
        movementAt: requireString(
            evaluation.movementAt,
            'Shipment readiness evaluation'
        ),
    }
}

export const mapShipmentValidation = (value) => {
    const validation = requireRecord(value, 'Shipment validation')
    return {
        evaluation: mapReadinessEvaluation(validation.evaluation),
        regulatedDispatch: requireBoolean(
            validation.regulatedDispatch,
            'Shipment validation'
        ),
        documentCount: requireNonnegativeInteger(
            validation.documentCount,
            'Shipment validation'
        ),
    }
}

export const mapRecallCase = (value) => {
    const recall = requireRecord(value, 'Recall case')
    const triggerType = requireString(recall.triggerType, 'Recall case')
    if (!RECALL_TRIGGER_TYPES.includes(triggerType)) throw contractError('Recall case')
    return {
        id: requireString(recall.id, 'Recall case'),
        triggerType,
        triggerId: requireString(recall.triggerId, 'Recall case'),
        reason: requireString(recall.reason, 'Recall case'),
        openedAt: requireString(recall.openedAt, 'Recall case'),
        sourceDocumentId: optionalString(recall.sourceDocumentId, 'Recall case'),
    }
}

export const mapRecallMaterialImpact = (value) => {
    const material = requireRecord(value, 'Recall material impact')
    return {
        embryoId: requireString(material.embryoId, 'Recall material impact'),
        matingId: requireString(material.matingId, 'Recall material impact'),
        donorId: requireString(material.donorId, 'Recall material impact'),
        semenBatchId: requireString(material.semenBatchId, 'Recall material impact'),
        sireId: requireString(material.sireId, 'Recall material impact'),
        availability: requireString(material.availability, 'Recall material impact'),
        packageId: optionalString(material.packageId, 'Recall material impact'),
        activeMembership: requireBoolean(
            material.activeMembership,
            'Recall material impact'
        ),
        currentLocation: optionalString(material.currentLocation, 'Recall material impact'),
        packageVersion: optionalNonnegativeInteger(
            material.packageVersion,
            'Recall material impact'
        ),
        locationAtCutoff: optionalString(
            material.locationAtCutoff,
            'Recall material impact'
        ),
        shipmentId: optionalString(material.shipmentId, 'Recall material impact'),
        destinationName: optionalText(material.destinationName, 'Recall material impact'),
        destinationPropertyName: optionalText(
            material.destinationPropertyName,
            'Recall material impact'
        ),
        destinationAddressLine: optionalText(
            material.destinationAddressLine,
            'Recall material impact'
        ),
        destinationMunicipality: optionalText(
            material.destinationMunicipality,
            'Recall material impact'
        ),
        destinationState: optionalText(material.destinationState, 'Recall material impact'),
        destinationCountry: optionalText(
            material.destinationCountry,
            'Recall material impact'
        ),
        dispatchedAt: optionalString(material.dispatchedAt, 'Recall material impact'),
        transferId: optionalString(material.transferId, 'Recall material impact'),
        held: requireBoolean(material.held, 'Recall material impact'),
    }
}

export const mapShipmentPage = value => mapPage(
    value,
    'Shipment page',
    'items',
    mapShipmentSummary
)

export const mapRecallPage = value => mapPage(
    value,
    'Recall page',
    'items',
    mapRecallCase
)

export const mapRecallImpact = value => mapPage(
    value,
    'Recall impact',
    'materials',
    mapRecallMaterialImpact
)

export const normalizeDistributionPageParams = ({
    query = '',
    page = 0,
    size = DEFAULT_DISTRIBUTION_PAGE_SIZE,
} = {}) => {
    const q = typeof query === 'string' ? query.trim() : null
    if (
        q == null || q.length > 200 ||
        !Number.isInteger(page) || page < 0 || page > 10000 ||
        !Number.isInteger(size) || size < 1 || size > 100
    ) {
        throw new TypeError('Invalid distribution search parameters.')
    }
    return { q, page, size }
}

const requireInstant = (value, label) => {
    const instant = requireString(value, label)
    if (!Number.isFinite(new Date(instant).getTime())) throw new TypeError(`Invalid ${label}.`)
    return instant
}

const requireIdentifier = value => requireString(value, 'Distribution identifier')

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getShipments = async ({
    query = '', page = 0, size = DEFAULT_DISTRIBUTION_PAGE_SIZE, signal,
} = {}) => {
    try {
        const response = await targetApiClient.get('/shipments', {
            params: normalizeDistributionPageParams({ query, page, size }),
            signal,
        })
        return mapShipmentPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os Shipments.')
    }
}

export const getShipmentById = async ({ shipmentId, signal }) => {
    try {
        const id = requireIdentifier(shipmentId)
        const response = await targetApiClient.get(
            `/shipments/${encodeURIComponent(id)}`,
            { signal }
        )
        return mapShipment(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o Shipment.')
    }
}

export const validateShipment = async ({ shipmentId, movementAt, signal }) => {
    try {
        const id = requireIdentifier(shipmentId)
        const timestamp = requireInstant(movementAt, 'Shipment movement timestamp')
        const response = await targetApiClient.post(
            `/shipments/${encodeURIComponent(id)}:validate`,
            { movementAt: timestamp },
            { signal }
        )
        return mapShipmentValidation(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível calcular a readiness do Shipment.')
    }
}

export const getRecalls = async ({
    query = '', page = 0, size = DEFAULT_DISTRIBUTION_PAGE_SIZE, signal,
} = {}) => {
    try {
        const response = await targetApiClient.get('/recalls', {
            params: normalizeDistributionPageParams({ query, page, size }),
            signal,
        })
        return mapRecallPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os Recalls.')
    }
}

export const getRecallById = async ({ recallId, signal }) => {
    try {
        const id = requireIdentifier(recallId)
        const response = await targetApiClient.get(
            `/recalls/${encodeURIComponent(id)}`,
            { signal }
        )
        return mapRecallCase(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o Recall.')
    }
}

export const analyzeRecallImpact = async ({
    recallId,
    cutoff = null,
    page = 0,
    size = DEFAULT_DISTRIBUTION_PAGE_SIZE,
    signal,
}) => {
    try {
        const id = requireIdentifier(recallId)
        const params = normalizeDistributionPageParams({ page, size })
        const response = await targetApiClient.post(
            `/recalls/${encodeURIComponent(id)}:analyze-impact`,
            {
                ...(cutoff ? { cutoff: requireInstant(cutoff, 'Recall cutoff') } : {}),
                page: params.page,
                size: params.size,
            },
            { signal }
        )
        const impact = mapRecallImpact(response.data)
        return {
            recallId: requireString(response.data.recallId, 'Recall impact'),
            analysisCutoff: requireString(response.data.analysisCutoff, 'Recall impact'),
            ...impact,
        }
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível calcular o impacto do Recall.')
    }
}
