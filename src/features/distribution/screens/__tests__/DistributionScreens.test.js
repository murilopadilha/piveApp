import { act, fireEvent, render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useRecallDetailQuery,
    useRecallImpactQuery,
    useRecallsQuery,
    useShipmentDetailQuery,
    useShipmentsQuery,
    useShipmentValidationQuery,
} from '../../hooks/useDistributionQueries'
import RecallDetail from '../RecallDetail'
import RecallList from '../RecallList'
import ShipmentDetail from '../ShipmentDetail'
import ShipmentList from '../ShipmentList'

let datePickerProps
jest.mock('react-native-modal-datetime-picker', () => function MockPicker(props) {
    datePickerProps = props
    return null
})
jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useDistributionQueries', () => ({
    useRecallDetailQuery: jest.fn(),
    useRecallImpactQuery: jest.fn(),
    useRecallsQuery: jest.fn(),
    useShipmentDetailQuery: jest.fn(),
    useShipmentsQuery: jest.fn(),
    useShipmentValidationQuery: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(() => Promise.resolve({ data })),
})

const shipmentSummary = {
    id: 'shipment-a', status: 'DRAFT', version: 0,
    establishmentId: 'establishment-a', recipientId: 'recipient-a',
    createdAt: '2026-10-10T10:00:00Z',
}

const shipment = {
    ...shipmentSummary,
    propertyId: null,
    purpose: 'EXPORT',
    items: [{ id: 'item-a', packageId: 'package-a', expectedVersion: 3, expectedLocationId: 'location-a', quantity: 2 }],
    documents: [{ id: 'link-a', typeCode: 'GTA', documentId: 'document-a', versionId: 'version-a', number: null, issuer: null, issuedAt: null }],
    dispatchEvidence: null,
    receiptRecorded: true,
}

const validation = {
    evaluation: {
        result: 'UNKNOWN', ruleVersion: null,
        explanationCode: 'BLOCKED_BY_REGULATORY_SPEC_VERIFICATION_MOVEMENT_DOCUMENT_MATRIX',
        originEstablishmentId: 'establishment-a', destinationRecipientId: 'recipient-a',
        destinationCountry: 'BR', purpose: 'EXPORT',
        movementAt: '2026-10-15T12:00:00Z',
    },
    regulatedDispatch: true,
    documentCount: 1,
}

const recall = {
    id: 'recall-a', triggerType: 'DONOR', triggerId: 'donor-a',
    reason: 'Investigar origem', openedAt: '2026-10-10T10:00:00Z',
    sourceDocumentId: 'reference-a',
}

const impact = {
    recallId: 'recall-a', analysisCutoff: '2026-10-15T12:00:00Z',
    page: 0, size: 20,
    materials: [{
        embryoId: 'embryo-a', matingId: 'mating-a', donorId: 'donor-a',
        semenBatchId: 'batch-a', sireId: 'sire-a', availability: 'SHIPPED_OUT',
        packageId: 'package-a', activeMembership: true, currentLocation: null,
        packageVersion: 4, locationAtCutoff: 'location-old', shipmentId: 'shipment-a',
        destinationName: 'Destination Lab', destinationPropertyName: null,
        destinationAddressLine: null, destinationMunicipality: null,
        destinationState: null, destinationCountry: 'BR',
        dispatchedAt: '2026-10-12T12:00:00Z', transferId: null, held: false,
    }],
}

beforeEach(() => {
    datePickerProps = null
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['shipment:read', 'recall:read'],
    }))
    useShipmentsQuery.mockReturnValue(query({ pages: [{ items: [shipmentSummary], page: 0, size: 20 }] }))
    useShipmentDetailQuery.mockReturnValue(query(shipment))
    useShipmentValidationQuery.mockReturnValue(query(validation))
    useRecallsQuery.mockReturnValue(query({ pages: [{ items: [recall], page: 0, size: 20 }] }))
    useRecallDetailQuery.mockReturnValue(query(recall))
    useRecallImpactQuery.mockReturnValue(query({ pages: [impact] }))
})

afterEach(() => jest.clearAllMocks())

describe('M8A Distribution screens', () => {
    test('Shipment list preserves order, sends backend search and navigates by stable ID', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<ShipmentList navigation={navigation} />)
        fireEvent.changeText(screen.getByLabelText('Buscar Shipments'), ' DRAFT ')
        fireEvent.press(screen.getByLabelText('Executar busca de Shipments'))
        expect(useShipmentsQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a', query: 'DRAFT', enabled: true,
        })
        fireEvent.press(screen.getByLabelText('Shipment shipment-a, status Rascunho'))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'ShipmentDetail', { shipmentId: 'shipment-a' }
        )
    })

    test('Shipment detail keeps factual status, receipt and immutable links', () => {
        const screen = render(<ShipmentDetail route={{ params: { shipmentId: 'shipment-a' } }} />)
        expect(screen.getByText('Código retornado: DRAFT')).toBeTruthy()
        expect(screen.getByText('O acknowledgment é um fato booleano; não cria status entregue, recebido ou encerrado.')).toBeTruthy()
        expect(screen.getByText('GTA')).toBeTruthy()
        expect(screen.getByText('version-a')).toBeTruthy()
        expect(screen.queryByText('DELIVERED')).toBeNull()
        expect(screen.queryByText('RETURNED')).toBeNull()
        expect(screen.queryByText('CLOSED')).toBeNull()
        expect(screen.queryByText('Dispatch')).toBeNull()
    })

    test('makes movementAt explicit and presents UNKNOWN without compliant inference', () => {
        const screen = render(<ShipmentDetail route={{ params: { shipmentId: 'shipment-a' } }} />)
        expect(screen.getByLabelText('Calcular readiness do Shipment').props.accessibilityState.disabled).toBe(true)
        fireEvent.press(screen.getByLabelText('Selecionar momento da readiness'))
        act(() => datePickerProps.onConfirm(new Date('2026-10-15T12:00:00Z')))
        fireEvent.press(screen.getByLabelText('Calcular readiness do Shipment'))
        expect(useShipmentValidationQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            movementAt: '2026-10-15T12:00:00.000Z', enabled: true,
        }))
        expect(screen.getByText('UNKNOWN')).toBeTruthy()
        expect(screen.getByText(/UNKNOWN não significa conformidade/)).toBeTruthy()
        expect(screen.queryByText('Aprovado')).toBeNull()
        expect(screen.queryByText('Ready to dispatch')).toBeNull()
    })

    test('gates Shipment only by shipment:read', () => {
        useEffectiveContextQuery.mockReturnValue(query({ permissions: ['recall:read'] }))
        render(<ShipmentList navigation={{ navigate: jest.fn() }} />)
        expect(useShipmentsQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a', query: '', enabled: false,
        })
    })

    test('Recall list searches backend and navigates by recallId only', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<RecallList navigation={navigation} />)
        fireEvent.changeText(screen.getByLabelText('Buscar Recalls'), ' donor ')
        fireEvent.press(screen.getByLabelText('Executar busca de Recalls'))
        expect(useRecallsQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a', query: 'donor', enabled: true,
        })
        fireEvent.press(screen.getByLabelText('Recall recall-a, gatilho DONOR'))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'RecallDetail', { recallId: 'recall-a' }
        )
    })

    test('Recall detail has no invented lifecycle and preserves DocumentReference semantics', () => {
        const screen = render(<RecallDetail route={{ params: { recallId: 'recall-a' } }} />)
        expect(screen.getByText('reference-a')).toBeTruthy()
        expect(screen.getByText(/DocumentReference externo declarado/)).toBeTruthy()
        expect(screen.getByText(/não expõe status, encerramento/)).toBeTruthy()
        expect(screen.queryByText('OPEN')).toBeNull()
        expect(screen.queryByText('RESOLVED')).toBeNull()
    })

    test('Recall impact keeps current and cutoff locations distinct', () => {
        const screen = render(<RecallDetail route={{ params: { recallId: 'recall-a' } }} />)
        fireEvent.press(screen.getByLabelText('Calcular impacto do Recall'))
        expect(useRecallImpactQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a', recallId: 'recall-a',
            cutoff: null, enabled: true,
        })
        expect(screen.getByLabelText('Localização atual: não informada')).toBeTruthy()
        expect(screen.getByLabelText('Localização no corte: location-old')).toBeTruthy()
        expect(screen.getByText('A localização no corte é histórica e não substitui a localização atual.')).toBeTruthy()
    })

    test('gates Recall independently and never requires shipment:read', () => {
        useEffectiveContextQuery.mockReturnValue(query({ permissions: ['shipment:read'] }))
        render(<RecallList navigation={{ navigate: jest.fn() }} />)
        expect(useRecallsQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a', query: '', enabled: false,
        })
    })
})
