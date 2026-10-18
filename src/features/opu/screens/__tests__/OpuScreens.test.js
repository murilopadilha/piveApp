import {
    act,
    fireEvent,
    render,
} from '@testing-library/react-native'
import { Alert } from 'react-native'

import { useAnimalDetailQuery } from '../../../animals/hooks/useAnimalQueries'
import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useOocyteCollectionDetailQuery,
    useOocyteCollectionDonorSnapshotQuery,
    useOpuReferenceQueries,
    useOpuSessionCollectionsQuery,
    useOpuSessionDetailQuery,
    useOpuSessionSummaryQuery,
    useOpuSessionsQuery,
} from '../../hooks/useOpuQueries'
import {
    useCorrectOocyteCollectionMutation,
    useOpuTransitionMutation,
} from '../../hooks/useOpuMutations'
import OocyteCollectionDetail from '../OocyteCollectionDetail'
import OpuSessionDetail from '../OpuSessionDetail'
import OpuSessionList from '../OpuSessionList'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))

jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))

jest.mock('../../../animals/hooks/useAnimalQueries', () => ({
    useAnimalDetailQuery: jest.fn(),
}))

jest.mock('../../hooks/useOpuQueries', () => ({
    useOpuSessionsQuery: jest.fn(),
    useOpuSessionDetailQuery: jest.fn(),
    useOpuSessionSummaryQuery: jest.fn(),
    useOpuSessionCollectionsQuery: jest.fn(),
    useOocyteCollectionDetailQuery: jest.fn(),
    useOocyteCollectionDonorSnapshotQuery: jest.fn(),
    useOpuReferenceQueries: jest.fn(),
}))

jest.mock('../../hooks/useOpuMutations', () => ({
    useCorrectOocyteCollectionMutation: jest.fn(),
    useOpuTransitionMutation: jest.fn(),
}))

const effectiveQuery = (permissions = [
    'opu:read',
    'master-data:read',
    'client:read',
]) => ({
    data: {
        tenantId: 'organization-a',
        actorId: 'actor-a',
        permissions,
        correlationId: 'trace-a',
    },
    error: null,
    isPending: false,
    isSuccess: true,
    refetch: jest.fn(),
})

const session = {
    id: 'opu-a',
    establishmentId: 'establishment-a',
    operationalLocationId: 'location-a',
    farmPropertyId: 'farm-a',
    clientId: 'client-a',
    leadProfessionalId: 'professional-a',
    performedAt: '2026-10-09T12:00:00Z',
    timezone: 'America/Sao_Paulo',
    notes: 'Coleta de campo',
    status: 'IN_PROGRESS',
    version: 1,
    provenance: {
        originType: 'MANUAL',
        recordedByUserId: 'actor-a',
        recordedAt: '2026-10-09T12:01:00Z',
    },
    completedAt: null,
    completedBy: null,
}

const collection = {
    id: 'collection-a',
    sessionId: 'opu-a',
    donorId: 'animal-a',
    collectedAt: '2026-10-09T13:00:00Z',
    totalRecovered: 8,
    viable: 5,
    folliclesAspirated: 0,
    notes: null,
    status: 'RECORDED',
    version: 0,
    provenance: {
        originType: 'MANUAL',
        recordedByUserId: 'actor-a',
        recordedAt: '2026-10-09T13:01:00Z',
    },
}

const infiniteQuery = (items = []) => ({
    data: { pages: [{ items, page: 0, size: 20 }] },
    error: null,
    isPending: false,
    isSuccess: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
})

const successQuery = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    refetch: jest.fn(),
})

const mutationState = () => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: jest.fn(),
    reset: jest.fn(),
})

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(effectiveQuery())
    useOpuSessionsQuery.mockReturnValue(infiniteQuery([session]))
    useOpuSessionDetailQuery.mockReturnValue(successQuery(session))
    useOpuSessionSummaryQuery.mockReturnValue(successQuery({
        id: 'opu-a',
        status: 'IN_PROGRESS',
        collections: 1,
        totalRecovered: 8,
        viable: 5,
        farmSnapshot: { name: 'Fazenda Aurora' },
    }))
    useOpuSessionCollectionsQuery.mockReturnValue(infiniteQuery([collection]))
    useOpuReferenceQueries.mockReturnValue({
        establishment: successQuery({ legalDisplayName: 'Laboratório A' }),
        operationalLocation: successQuery({ name: 'Sala de coleta' }),
        farmProperty: successQuery({ name: 'Fazenda Aurora' }),
        professional: successQuery({ name: 'Dra. Ana' }),
        client: successQuery({ displayName: 'Cliente A' }),
    })
    useOocyteCollectionDetailQuery.mockReturnValue(successQuery(collection))
    useOocyteCollectionDonorSnapshotQuery.mockReturnValue({
        data: undefined,
        error: null,
        isPending: false,
        isSuccess: false,
        refetch: jest.fn(),
    })
    useAnimalDetailQuery.mockReturnValue(successQuery({
        id: 'animal-a',
        name: 'Aurora',
        sex: 'FEMALE',
        status: 'ACTIVE',
    }))
    useOpuTransitionMutation.mockReturnValue(mutationState())
    useCorrectOocyteCollectionMutation.mockReturnValue(mutationState())
})

afterEach(() => {
    jest.restoreAllMocks()
})

describe('OpuSessionList', () => {
    test('shows the paged read directory without fictional search and navigates by stable ID', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<OpuSessionList navigation={navigation} />)

        expect(screen.getByText('Sessões de coleta de oócitos')).toBeTruthy()
        expect(screen.queryByPlaceholderText(/buscar/i)).toBeNull()
        fireEvent.press(screen.getByLabelText(/OPU em/))
        expect(navigation.navigate).toHaveBeenCalledWith('OpuSessionDetail', {
            opuSessionId: 'opu-a',
        })
        expect(navigation.navigate.mock.calls[0][1]).not.toHaveProperty('session')
    })

    test('keeps read access separate from write permission', () => {
        useEffectiveContextQuery.mockReturnValue(effectiveQuery(['opu:write']))

        const screen = render(
            <OpuSessionList navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByText(
            'Você não tem permissão para consultar OPUs.'
        )).toBeTruthy()
    })

    test('renders empty and recoverable network states', () => {
        useOpuSessionsQuery.mockReturnValue(infiniteQuery([]))
        const empty = render(
            <OpuSessionList navigation={{ navigate: jest.fn() }} />
        )
        expect(empty.getByText('Nenhuma OPU registrada.')).toBeTruthy()
        empty.unmount()

        const refetch = jest.fn()
        useOpuSessionsQuery.mockReturnValue({
            ...infiniteQuery([]),
            data: undefined,
            error: { kind: 'network' },
            refetch,
        })
        const network = render(
            <OpuSessionList navigation={{ navigate: jest.fn() }} />
        )
        expect(network.getByText(
            'Não foi possível conectar ao servidor. Verifique sua conexão.'
        )).toBeTruthy()
        fireEvent.press(network.getByLabelText('Tentar novamente'))
        expect(refetch).toHaveBeenCalledTimes(1)
    })
})

describe('OpuSessionDetail', () => {
    test('composes session, independent references, summary and collections', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <OpuSessionDetail
                navigation={navigation}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        expect(screen.getByText('Laboratório A')).toBeTruthy()
        expect(screen.getByText('Sala de coleta')).toBeTruthy()
        expect(screen.getAllByText('Fazenda Aurora')).toHaveLength(2)
        expect(screen.getByText('Dra. Ana')).toBeTruthy()
        expect(screen.getByText('Cliente A')).toBeTruthy()
        expect(screen.getByText('8 recuperados · 5 viáveis')).toBeTruthy()
        fireEvent.press(screen.getByLabelText('Coleta 1, Registrada'))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'OocyteCollectionDetail',
            { oocyteCollectionId: 'collection-a' }
        )
    })

    test('keeps the session usable when summary fails', () => {
        useOpuSessionSummaryQuery.mockReturnValue({
            data: undefined,
            error: { kind: 'timeout' },
            isPending: false,
            isSuccess: false,
            refetch: jest.fn(),
        })

        const screen = render(
            <OpuSessionDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        expect(screen.getByText('Laboratório A')).toBeTruthy()
        expect(screen.getByText(
            'O servidor demorou para responder. Tente novamente.'
        )).toBeTruthy()
        expect(screen.getByText('8 recuperados · 5 viáveis')).toBeTruthy()
    })

    test('treats wrong-tenant detail as not found and requires route ID', () => {
        useOpuSessionDetailQuery.mockReturnValue({
            data: undefined,
            error: { kind: 'notFound', code: 'OPU_SESSION_NOT_FOUND' },
            isPending: false,
            isSuccess: false,
            refetch: jest.fn(),
        })
        const notFound = render(
            <OpuSessionDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: { opuSessionId: 'missing' } }}
            />
        )
        expect(notFound.getByText(
            'OPU não encontrada nesta organização.'
        )).toBeTruthy()
        notFound.unmount()

        const missingId = render(
            <OpuSessionDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: {} }}
            />
        )
        expect(missingId.getByText('OPU não identificada.')).toBeTruthy()
    })

    test('derives write actions from DRAFT status and current session version', () => {
        const transition = {
            error: null,
            isError: false,
            isPending: false,
            mutate: jest.fn(),
            reset: jest.fn(),
        }
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read', 'opu:write', 'master-data:read', 'client:read',
        ]))
        useOpuSessionDetailQuery.mockReturnValue(successQuery({
            ...session,
            status: 'DRAFT',
            version: 0,
        }))
        useOpuTransitionMutation.mockReturnValue(transition)
        const screen = render(
            <OpuSessionDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Iniciar OPU'))
        const intent = transition.mutate.mock.calls[0][0]
        expect(intent).toMatchObject({
            opuSessionId: 'opu-a',
            action: 'start',
            payload: { expectedVersion: 0 },
        })
        expect(screen.queryByLabelText('Registrar coletas da OPU')).toBeNull()
    })

    test('exposes capture only in progress and navigates with the session ID', () => {
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read', 'opu:write', 'master-data:read', 'client:read',
        ]))
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <OpuSessionDetail
                navigation={navigation}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Registrar coletas da OPU'))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'OpuCollectionBatch',
            { opuSessionId: 'opu-a' }
        )
        expect(navigation.navigate.mock.calls[0][1]).not.toHaveProperty('session')
    })

    test('allows completion without collections after explicit confirmation', () => {
        const transition = mutationState()
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read', 'opu:write', 'master-data:read', 'client:read',
        ]))
        useOpuSessionSummaryQuery.mockReturnValue(successQuery({
            id: 'opu-a',
            status: 'IN_PROGRESS',
            collections: 0,
            totalRecovered: 0,
            viable: 0,
            farmSnapshot: null,
        }))
        useOpuTransitionMutation.mockReturnValue(transition)
        const screen = render(
            <OpuSessionDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Concluir OPU'))
        expect(alert).toHaveBeenCalledWith(
            'Concluir OPU?',
            expect.stringContaining('não possui coletas'),
            expect.any(Array)
        )
        act(() => alert.mock.calls[0][2][1].onPress())
        expect(transition.mutate.mock.calls[0][0]).toMatchObject({
            action: 'complete',
            payload: { expectedVersion: 1 },
        })
        alert.mockRestore()
    })

    test('allows cancellation with existing collections after confirmation', () => {
        const transition = mutationState()
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read', 'opu:write', 'master-data:read', 'client:read',
        ]))
        useOpuTransitionMutation.mockReturnValue(transition)
        const screen = render(
            <OpuSessionDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Cancelar OPU'))
        expect(alert).toHaveBeenCalledWith(
            'Cancelar OPU?',
            expect.stringContaining('Coletas existentes não impedem'),
            expect.any(Array)
        )
        act(() => alert.mock.calls[0][2][1].onPress())
        expect(transition.mutate.mock.calls[0][0]).toMatchObject({
            action: 'cancel',
            payload: { expectedVersion: 1 },
        })
        alert.mockRestore()
    })
})

describe('OocyteCollectionDetail', () => {
    test('shows zero follicles and resolves an open collection donor through canonical Animal', () => {
        const screen = render(
            <OocyteCollectionDetail
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        expect(screen.getAllByText('0').length).toBeGreaterThan(0)
        expect(screen.getByText('Aurora')).toBeTruthy()
        expect(useAnimalDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            animalId: 'animal-a',
            enabled: true,
        }))
        expect(useOocyteCollectionDonorSnapshotQuery).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: false })
        )
        expect(screen.queryByText(/sire/i)).toBeNull()
        expect(screen.queryByText(/embri/i)).toBeNull()
    })

    test('uses the frozen donor snapshot only after completion', () => {
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read', 'opu:write', 'master-data:read',
        ]))
        useOocyteCollectionDetailQuery.mockReturnValue(successQuery({
            ...collection,
            status: 'COMPLETED',
            version: 1,
        }))
        useOocyteCollectionDonorSnapshotQuery.mockReturnValue(successQuery({
            id: 'animal-a',
            name: null,
            sex: 'FEMALE',
            status: 'ACTIVE',
            version: 4,
            identifiers: [{ type: 'EAR_TAG', issuer: null, value: '0042' }],
        }))

        const screen = render(
            <OocyteCollectionDetail
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        expect(screen.getByText('Identidade registrada na conclusão')).toBeTruthy()
        expect(screen.getByText('Animal sem nome')).toBeTruthy()
        expect(screen.getByText('0042')).toBeTruthy()
        expect(useAnimalDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: false,
        }))
        expect(screen.queryByLabelText('Corrigir coleta de oócitos')).toBeNull()
    })

    test('offers correction only for a recorded collection in an active session', () => {
        const correction = {
            error: null,
            isError: false,
            isPending: false,
            mutate: jest.fn(),
            reset: jest.fn(),
        }
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read', 'opu:write', 'master-data:read',
        ]))
        useCorrectOocyteCollectionMutation.mockReturnValue(correction)
        const screen = render(
            <OocyteCollectionDetail
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Corrigir coleta de oócitos'))
        fireEvent.changeText(
            screen.getByLabelText('Motivo da correção'),
            'Conferência de campo'
        )
        fireEvent.press(screen.getByText('Salvar correção'))

        expect(correction.mutate.mock.calls[0][0]).toMatchObject({
            oocyteCollectionId: 'collection-a',
            payload: {
                expectedVersion: 0,
                counts: {
                    totalRecovered: 8,
                    viable: 5,
                    folliclesAspirated: 0,
                },
                reason: 'Conferência de campo',
            },
        })
    })

    test('opens contextual Mating routes with only the collection stable ID', () => {
        useEffectiveContextQuery.mockReturnValue(effectiveQuery([
            'opu:read',
            'opu:write',
            'master-data:read',
            'semen:read',
            'fertilization:read',
            'fertilization:write',
        ]))
        useOocyteCollectionDetailQuery.mockReturnValue(successQuery({
            ...collection,
            status: 'COMPLETED',
        }))
        useOocyteCollectionDonorSnapshotQuery.mockReturnValue(successQuery({
            id: 'animal-a',
            name: 'Aurora',
            sex: 'FEMALE',
            status: 'ACTIVE',
            version: 4,
            identifiers: [],
        }))
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <OocyteCollectionDetail
                navigation={navigation}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Ver fertilizações da coleta'))
        fireEvent.press(screen.getByLabelText('Criar nova alocação para a coleta'))

        expect(navigation.navigate).toHaveBeenNthCalledWith(1, 'MatingList', {
            oocyteCollectionId: 'collection-a',
        })
        expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'MatingBatchCreate', {
            oocyteCollectionId: 'collection-a',
        })
    })
})
