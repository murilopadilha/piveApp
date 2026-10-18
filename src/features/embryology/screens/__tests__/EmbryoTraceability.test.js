import { fireEvent, render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useEmbryoAuditEventsQuery,
    useEmbryoTimelineQuery,
    useEmbryoTraceabilityQuery,
} from '../../hooks/useEmbryoQueries'
import EmbryoTraceability from '../EmbryoTraceability'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useEmbryoQueries', () => ({
    useEmbryoAuditEventsQuery: jest.fn(),
    useEmbryoTimelineQuery: jest.fn(),
    useEmbryoTraceabilityQuery: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
})

const tracePermissions = [
    'embryology:read',
    'opu:read',
    'fertilization:read',
    'semen:read',
    'inventory:read',
    'transfer:read',
    'shipment:read',
]

const lineage = {
    embryoId: 'embryo-a',
    humanCode: 'EMB-001',
    matingId: 'mating-a',
    collectionId: 'collection-a',
    donorId: 'donor-a',
    opuSessionId: null,
    farmPropertyId: null,
    semenBatchId: 'semen-a',
    sireId: 'sire-a',
    producerEstablishmentId: null,
    currentPackageId: null,
    currentLocationId: null,
    transferId: null,
    recipientCycleId: null,
    recipientAnimalId: null,
}

const timeline = {
    pages: [{
        items: [{
            factId: 'fact-a',
            type: 'IDENTIFIED',
            occurredAt: '2026-10-10T12:00:00Z',
            recordedAt: '2026-10-10T12:00:01Z',
            relatedId: null,
        }, {
            factId: 'fact-b',
            type: 'TRANSFERRED',
            occurredAt: '2026-10-11T12:00:00Z',
            recordedAt: '2026-10-11T12:00:01Z',
            relatedId: 'transfer-a',
        }],
        page: 0,
        size: 20,
    }],
}

const audit = {
    pages: [{
        items: [{
            id: 'audit-a',
            occurredAt: '2026-10-13T12:00:00Z',
            actorId: 'actor-a',
            action: 'OPEN_HOLD',
            entityType: 'EMBRYO',
            entityId: 'embryo-a',
            entityVersion: null,
            reason: 'Revisão',
            correlationId: 'correlation-a',
        }],
        page: 0,
        size: 20,
    }],
}

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: [...tracePermissions, 'compliance:read'],
    }))
    useEmbryoTraceabilityQuery.mockReturnValue(query(lineage))
    useEmbryoTimelineQuery.mockReturnValue(query(timeline))
    useEmbryoAuditEventsQuery.mockReturnValue(query(audit))
})

afterEach(() => {
    jest.clearAllMocks()
})

describe('EmbryoTraceability', () => {
    test('renders backend lineage and timeline ordering separately from audit', () => {
        const screen = render(
            <EmbryoTraceability route={{ params: { embryoId: 'embryo-a' } }} />
        )

        expect(screen.getByText('Lineage canônica')).toBeTruthy()
        expect(screen.getByText('mating-a')).toBeTruthy()
        const timelineEvents = screen.getAllByLabelText(/^Evento /)
        expect(timelineEvents.map(event => event.props.accessibilityLabel)).toEqual([
            'Evento IDENTIFIED',
            'Evento TRANSFERRED',
        ])
        expect(screen.queryByText('HOLD')).toBeNull()
        expect(screen.getByText('Auditoria operacional')).toBeTruthy()
        expect(screen.getByLabelText('Auditoria OPEN_HOLD')).toBeTruthy()
        expect(screen.getByText(
            'Eventos operacionais; esta lista não é combinada com a timeline de domínio.'
        )).toBeTruthy()
    })

    test('gates all traceability reads when one cumulative permission is missing', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: [
                ...tracePermissions.filter(value => value !== 'shipment:read'),
                'compliance:read',
            ],
        }))
        const screen = render(
            <EmbryoTraceability route={{ params: { embryoId: 'embryo-a' } }} />
        )

        expect(useEmbryoTraceabilityQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: false,
        }))
        expect(useEmbryoTimelineQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: false,
        }))
        expect(useEmbryoAuditEventsQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: true,
        }))
        expect(screen.getByText(/Lineage e timeline não estão disponíveis/)).toBeTruthy()
        expect(screen.getByLabelText('Auditoria OPEN_HOLD')).toBeTruthy()
    })

    test('gates audit independently without blocking traceability', () => {
        useEffectiveContextQuery.mockReturnValue(query({ permissions: tracePermissions }))
        const screen = render(
            <EmbryoTraceability route={{ params: { embryoId: 'embryo-a' } }} />
        )

        expect(useEmbryoTraceabilityQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: true,
        }))
        expect(useEmbryoTimelineQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: true,
        }))
        expect(useEmbryoAuditEventsQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: false,
        }))
        expect(screen.getByText('Lineage canônica')).toBeTruthy()
        expect(screen.queryByText('Auditoria operacional')).toBeNull()
    })

    test('uses independent raw pagination actions', () => {
        const timelineQuery = {
            ...query(timeline),
            hasNextPage: true,
        }
        const auditQuery = {
            ...query(audit),
            hasNextPage: true,
        }
        useEmbryoTimelineQuery.mockReturnValue(timelineQuery)
        useEmbryoAuditEventsQuery.mockReturnValue(auditQuery)
        const screen = render(
            <EmbryoTraceability route={{ params: { embryoId: 'embryo-a' } }} />
        )

        fireEvent.press(screen.getByLabelText('Carregar mais eventos da timeline'))
        fireEvent.press(screen.getByLabelText('Carregar mais eventos de auditoria'))

        expect(timelineQuery.fetchNextPage).toHaveBeenCalledTimes(1)
        expect(auditQuery.fetchNextPage).toHaveBeenCalledTimes(1)
    })
})
