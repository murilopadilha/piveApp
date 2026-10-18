import targetApiClient from '../../../../api/target/client'
import {
    analyzeRecallImpact,
    getRecallById,
    getRecalls,
    getShipmentById,
    getShipments,
    mapRecallCase,
    mapShipment,
    normalizeDistributionPageParams,
    RECALL_TRIGGER_TYPES,
    SHIPMENT_STATUSES,
    validateShipment,
} from '../distributionApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}))

const summary = {
    id: 'shipment-a', status: 'DRAFT', version: 0,
    establishmentId: 'establishment-a', recipientId: 'recipient-a',
    createdAt: '2026-10-10T10:00:00Z',
}

const shipment = {
    id: 'shipment-a', status: 'DRAFT', version: 0,
    establishmentId: 'establishment-a', recipientId: 'recipient-a',
    propertyId: null, purpose: 'EXPORT',
    items: [{
        id: 'item-a', packageId: 'package-a', expectedVersion: 3,
        expectedLocationId: 'location-a', quantity: 2,
    }],
    documents: [{
        id: 'link-a', typeCode: 'GTA', documentId: 'document-a',
        versionId: 'version-a', number: null, issuer: null, issuedAt: null,
    }],
    dispatchEvidence: null,
    receiptRecorded: false,
}

const validation = {
    evaluation: {
        result: 'UNKNOWN', ruleVersion: null,
        explanationCode: 'BLOCKED_BY_REGULATORY_SPEC_VERIFICATION_MOVEMENT_DOCUMENT_MATRIX',
        originEstablishmentId: 'establishment-a',
        destinationRecipientId: 'recipient-a', destinationCountry: 'BR',
        purpose: 'EXPORT', movementAt: '2026-10-15T12:00:00Z',
    },
    regulatedDispatch: true,
    documentCount: 1,
}

const recall = {
    id: 'recall-a', triggerType: 'DONOR', triggerId: 'donor-a',
    reason: 'Investigate source', openedAt: '2026-10-10T10:00:00Z',
    sourceDocumentId: null,
}

const material = {
    embryoId: 'embryo-a', matingId: 'mating-a', donorId: 'donor-a',
    semenBatchId: 'batch-a', sireId: 'sire-a', availability: 'SHIPPED_OUT',
    packageId: 'package-a', activeMembership: true,
    currentLocation: null, packageVersion: 4, locationAtCutoff: 'location-a',
    shipmentId: 'shipment-a', destinationName: 'Destination Lab',
    destinationPropertyName: null, destinationAddressLine: 'Road 1',
    destinationMunicipality: 'City', destinationState: 'SP',
    destinationCountry: 'BR', dispatchedAt: '2026-10-12T12:00:00Z',
    transferId: null, held: false,
}

afterEach(() => jest.clearAllMocks())

describe('M8A target Distribution API', () => {
    test('lists Shipments with q/page/size only and preserves backend order', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [summary, { ...summary, id: 'shipment-b' }], page: 0, size: 20 },
        })

        await expect(getShipments({ query: ' draft ', page: 0, size: 20, signal }))
            .resolves.toMatchObject({
                items: [{ id: 'shipment-a' }, { id: 'shipment-b' }],
                page: 0,
                size: 20,
            })
        expect(targetApiClient.get).toHaveBeenCalledWith('/shipments', {
            params: { q: 'draft', page: 0, size: 20 }, signal,
        })
        const params = normalizeDistributionPageParams()
        expect(params).toEqual({ q: '', page: 0, size: 20 })
        expect(params).not.toHaveProperty('status')
        expect(params).not.toHaveProperty('recipientId')
        expect(params).not.toHaveProperty('sort')
    })

    test('maps exact Shipment detail and only real statuses', async () => {
        targetApiClient.get.mockResolvedValueOnce({ data: shipment })
        await expect(getShipmentById({ shipmentId: 'shipment/a' }))
            .resolves.toEqual(shipment)
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/shipments/shipment%2Fa', { signal: undefined }
        )
        SHIPMENT_STATUSES.forEach(status => {
            expect(mapShipment({ ...shipment, status }).status).toBe(status)
        })
        expect(() => mapShipment({ ...shipment, status: 'DELIVERED' }))
            .toThrow(TypeError)
        expect(mapShipment(shipment).receiptRecorded).toBe(false)
    })

    test('validates readiness with exact POST body and no command headers', async () => {
        const signal = new AbortController().signal
        targetApiClient.post.mockResolvedValueOnce({ data: validation })
        await expect(validateShipment({
            shipmentId: 'shipment-a',
            movementAt: '2026-10-15T12:00:00Z',
            signal,
        })).resolves.toEqual(validation)
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/shipments/shipment-a:validate',
            { movementAt: '2026-10-15T12:00:00Z' },
            { signal }
        )
        expect(targetApiClient.post.mock.calls[0][2]).not.toHaveProperty('targetContext')
    })

    test('lists and loads Recalls without invented filters or status', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({ data: { items: [recall], page: 0, size: 20 } })
            .mockResolvedValueOnce({ data: recall })
        await getRecalls({ query: 'DONOR', page: 0, size: 20 })
        await expect(getRecallById({ recallId: 'recall-a' })).resolves.toEqual(recall)
        expect(targetApiClient.get.mock.calls[0]).toEqual([
            '/recalls',
            { params: { q: 'DONOR', page: 0, size: 20 }, signal: undefined },
        ])
        expect(mapRecallCase(recall)).not.toHaveProperty('status')
        RECALL_TRIGGER_TYPES.forEach(triggerType => {
            expect(mapRecallCase({ ...recall, triggerType }).triggerType).toBe(triggerType)
        })
    })

    test('analyzes Recall impact with cutoff/page/size and preserves current versus cutoff', async () => {
        const response = {
            recallId: 'recall-a', analysisCutoff: '2026-10-14T12:00:00Z',
            materials: [material], page: 0, size: 20,
        }
        targetApiClient.post.mockResolvedValueOnce({ data: response })
        await expect(analyzeRecallImpact({
            recallId: 'recall-a', cutoff: response.analysisCutoff,
            page: 0, size: 20,
        })).resolves.toEqual(response)
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/recalls/recall-a:analyze-impact',
            { cutoff: response.analysisCutoff, page: 0, size: 20 },
            { signal: undefined }
        )
        expect(response.materials[0].currentLocation).toBeNull()
        expect(response.materials[0].locationAtCutoff).toBe('location-a')
        expect(targetApiClient.post.mock.calls[0][2]).not.toHaveProperty('targetContext')
    })

    test('omits optional cutoff and rejects invented or malformed contracts', async () => {
        targetApiClient.post.mockResolvedValueOnce({ data: {
            recallId: 'recall-a', analysisCutoff: '2026-10-15T12:00:00Z',
            materials: [], page: 0, size: 20,
        } })
        await analyzeRecallImpact({ recallId: 'recall-a', page: 0, size: 20 })
        expect(targetApiClient.post.mock.calls[0][1]).toEqual({ page: 0, size: 20 })
        expect(() => normalizeDistributionPageParams({ query: 'x'.repeat(201) }))
            .toThrow(TypeError)
        expect(() => normalizeDistributionPageParams({ page: -1 }))
            .toThrow(TypeError)
        expect(() => mapRecallCase({ ...recall, triggerType: 'OTHER' }))
            .toThrow(TypeError)
    })

    test('normalizes wrong-tenant not found without distinguishing tenancy', async () => {
        targetApiClient.get.mockRejectedValueOnce({
            response: { status: 404, data: { code: 'SHIPMENT_NOT_FOUND' } },
        })
        await expect(getShipmentById({ shipmentId: 'shipment-a' }))
            .rejects.toMatchObject({ kind: 'notFound', code: 'SHIPMENT_NOT_FOUND' })
    })
})
