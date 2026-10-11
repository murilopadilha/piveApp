import {
    act,
    fireEvent,
    render,
} from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useMatingDetailQuery } from '../../../fertilization/hooks/useMatingQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import { useIdentifyEmbryosMutation } from '../../hooks/useEmbryoMutations'
import {
    useAssessmentVersionsQueries,
    useEmbryoDetailQuery,
    useEmbryoEvaluationsQuery,
    useEmbryosQuery,
} from '../../hooks/useEmbryoQueries'
import EmbryoBatchIdentify from '../EmbryoBatchIdentify'
import EmbryoDetail from '../EmbryoDetail'
import EmbryoList from '../EmbryoList'

jest.mock('react-native-modal-datetime-picker', () => () => null)
jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../fertilization/hooks/useMatingQueries', () => ({
    useMatingDetailQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useEmbryoQueries', () => ({
    useAssessmentVersionsQueries: jest.fn(),
    useEmbryoDetailQuery: jest.fn(),
    useEmbryoEvaluationsQuery: jest.fn(),
    useEmbryosQuery: jest.fn(),
}))
jest.mock('../../hooks/useEmbryoMutations', () => ({
    isAmbiguousEmbryoCommandError: error => ['network', 'timeout'].includes(
        error?.kind
    ),
    isEmbryoConcurrencyError: error => [
        'EMBRYO_COUNT_EXCEEDS_ALLOCATION',
        'MATING_NOT_OPEN',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ].includes(error?.code),
    useIdentifyEmbryosMutation: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(() => Promise.resolve({ data })),
})

const mutation = overrides => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: jest.fn(),
    reset: jest.fn(),
    ...overrides,
})

const provenance = {
    originType: 'MANUAL',
    recordedAt: '2026-10-11T12:00:00Z',
}

const evaluation = {
    id: 'evaluation-a',
    embryoId: 'embryo-a',
    schemeVersionId: 'version-a',
    developmentStageCodeId: 'stage-a',
    qualityGradeCodeId: 'grade-a',
    evaluatedAt: '2026-10-11T13:00:00Z',
    evaluatorProfessionalId: null,
    notes: 'Avaliação histórica',
    supersedesEvaluationId: null,
    provenance,
}

const embryo = {
    id: 'embryo-a',
    matingId: 'mating-a',
    humanCode: 'EMB-001',
    ownerId: null,
    identifiedAt: '2026-10-11T12:00:00Z',
    availability: 'AVAILABLE',
    preservation: 'FRESH',
    holds: [{
        id: 'hold-a',
        type: 'QUALITY',
        reason: 'Revisão',
        openedAt: '2026-10-11T12:30:00Z',
        releasedAt: null,
    }],
    currentLocationId: 'location-a',
    currentEvaluation: evaluation,
    version: 0,
    provenance,
}

const matingDetail = {
    mating: {
        id: 'mating-a',
        allocatedOocytes: 3,
        status: 'FERTILIZED',
    },
}

const allPermissions = [
    'embryology:read',
    'embryology:write',
    'fertilization:read',
]

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({ permissions: allPermissions }))
    useMatingDetailQuery.mockReturnValue(query(matingDetail))
    useEmbryosQuery.mockReturnValue(query({
        pages: [{ items: [embryo], page: 0, size: 20 }],
    }))
    useEmbryoDetailQuery.mockReturnValue(query(embryo))
    useEmbryoEvaluationsQuery.mockReturnValue(query([evaluation]))
    useAssessmentVersionsQueries.mockReturnValue([{
        schemeVersionId: 'version-a',
        data: {
            id: 'version-a',
            versionLabel: '2026.1',
            codes: [{
                id: 'stage-a', displayName: 'Mórula',
            }, {
                id: 'grade-a', displayName: 'Grau A',
            }],
        },
        error: null,
        isSuccess: true,
    }])
    useIdentifyEmbryosMutation.mockReturnValue(mutation())
})

afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
})

describe('Embryo list and detail', () => {
    test('lists Embryos and navigates using only embryoId', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <EmbryoList
                navigation={navigation}
                route={{ params: { matingId: 'mating-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Embrião EMB-001, Disponível'))

        expect(navigation.navigate).toHaveBeenCalledWith('EmbryoDetail', {
            embryoId: 'embryo-a',
        })
        expect(useEmbryosQuery).toHaveBeenCalledWith(expect.objectContaining({
            matingId: 'mating-a',
        }))
    })

    test('keeps read access without offering identification to read-only users', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['embryology:read'],
        }))
        const screen = render(
            <EmbryoList
                navigation={{ navigate: jest.fn() }}
                route={{ params: { matingId: 'mating-a' } }}
            />
        )

        expect(screen.getByText('EMB-001')).toBeTruthy()
        expect(screen.queryByLabelText('Identificar embriões')).toBeNull()
    })

    test('debounces humanCode search into the server query', () => {
        jest.useFakeTimers()
        const screen = render(
            <EmbryoList
                navigation={{ navigate: jest.fn() }}
                route={{ params: {} }}
            />
        )

        fireEvent.changeText(screen.getByLabelText('Buscar embriões'), ' EMB-42 ')
        act(() => jest.advanceTimersByTime(500))

        expect(useEmbryosQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            matingId: null,
            query: 'EMB-42',
        }))
    })

    test('presents orthogonal state and read-only historical labels', () => {
        const screen = render(
            <EmbryoDetail route={{ params: { embryoId: 'embryo-a' } }} />
        )

        expect(screen.getAllByText('Disponibilidade')).toHaveLength(2)
        expect(screen.getByText('Preservação')).toBeTruthy()
        expect(screen.getByText('Holds')).toBeTruthy()
        expect(screen.getByText('Identificador técnico: location-a')).toBeTruthy()
        expect(screen.getAllByText('Esquema: 2026.1')).toHaveLength(2)
        expect(screen.getAllByText('Estágio: Mórula')).toHaveLength(2)
        expect(screen.getAllByText('Qualidade: Grau A')).toHaveLength(2)
        expect(screen.getByText('Proprietário não informado.')).toBeTruthy()
        expect(screen.queryByText(/criar avaliação/i)).toBeNull()
        expect(screen.queryByText(/concluir embriologia/i)).toBeNull()
    })

    test('resolves only assessment versions referenced by history', () => {
        render(<EmbryoDetail route={{ params: { embryoId: 'embryo-a' } }} />)

        expect(useAssessmentVersionsQueries).toHaveBeenCalledWith({
            organizationId: 'organization-a',
            evaluations: [evaluation],
            enabled: true,
        })
    })
})

describe('EmbryoBatchIdentify', () => {
    const renderScreen = () => render(
        <EmbryoBatchIdentify
            navigation={{ replace: jest.fn() }}
            route={{ params: { matingId: 'mating-a' } }}
        />
    )

    test('creates one atomic intention with null owner and stable IDs', () => {
        const identify = mutation()
        useIdentifyEmbryosMutation.mockReturnValue(identify)
        const screen = renderScreen()

        fireEvent.press(screen.getByLabelText('Adicionar embrião ao lote'))
        fireEvent.changeText(screen.getByLabelText('Código do embrião 1'), 'EMB-002')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de embriões'))

        expect(identify.mutate).toHaveBeenCalledTimes(1)
        const intent = identify.mutate.mock.calls[0][0]
        expect(intent.idempotencyKey).toBe(intent.payload.batchId)
        expect(intent.payload.items).toHaveLength(1)
        expect(intent.payload.items[0]).toMatchObject({
            matingId: 'mating-a',
            humanCode: 'EMB-002',
            ownerId: null,
        })
        expect(intent.payload).not.toHaveProperty('expectedMatingVersion')
    })

    test('retries an ambiguous outcome with the same intention', () => {
        const identify = mutation({
            error: { kind: 'timeout' },
            isError: true,
        })
        useIdentifyEmbryosMutation.mockReturnValue(identify)
        const screen = renderScreen()

        fireEvent.press(screen.getByLabelText('Adicionar embrião ao lote'))
        fireEvent.changeText(screen.getByLabelText('Código do embrião 1'), 'EMB-002')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de embriões'))
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de embriões'))

        expect(identify.mutate).toHaveBeenCalledTimes(2)
        expect(identify.mutate.mock.calls[1][0])
            .toBe(identify.mutate.mock.calls[0][0])
    })

    test('renews the command and item identities before editing after send', () => {
        const identify = mutation({
            error: { kind: 'validation', code: 'INVALID_EMBRYO_CODE' },
            isError: true,
        })
        useIdentifyEmbryosMutation.mockReturnValue(identify)
        const screen = renderScreen()

        fireEvent.press(screen.getByLabelText('Adicionar embrião ao lote'))
        fireEvent.changeText(screen.getByLabelText('Código do embrião 1'), 'EMB-002')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de embriões'))
        const first = identify.mutate.mock.calls[0][0]

        fireEvent.press(screen.getByLabelText('Editar como nova intenção'))
        fireEvent.changeText(screen.getByLabelText('Código do embrião 1'), 'EMB-003')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de embriões'))
        const second = identify.mutate.mock.calls[1][0]

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.items[0].itemId)
            .not.toBe(first.payload.items[0].itemId)
        expect(second.payload.items[0].id)
            .not.toBe(first.payload.items[0].id)
        expect(second.payload.items[0].humanCode).toBe('EMB-003')
    })

    test('refetches Mating and Embryos before reviewing a capacity conflict', async () => {
        const mating = query(matingDetail)
        const embryos = query({
            pages: [{ items: [embryo], page: 0, size: 100 }],
        })
        useMatingDetailQuery.mockReturnValue(mating)
        useEmbryosQuery.mockReturnValue(embryos)
        useIdentifyEmbryosMutation.mockReturnValue(mutation({
            error: {
                kind: 'validation',
                code: 'EMBRYO_COUNT_EXCEEDS_ALLOCATION',
            },
            isError: true,
        }))
        const screen = renderScreen()

        fireEvent.press(screen.getByLabelText('Adicionar embrião ao lote'))
        fireEvent.changeText(screen.getByLabelText('Código do embrião 1'), 'EMB-002')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de embriões'))
        await act(async () => {
            fireEvent.press(screen.getByLabelText(
                'Recarregar fertilização e revisar nova intenção'
            ))
        })

        expect(mating.refetch).toHaveBeenCalledTimes(1)
        expect(embryos.refetch).toHaveBeenCalledTimes(1)
    })

    test('does not present a definitive remaining capacity from partial pages', () => {
        useEmbryosQuery.mockReturnValue({
            ...query({ pages: [{ items: [embryo], page: 0, size: 100 }] }),
            hasNextPage: true,
        })
        const screen = renderScreen()

        expect(screen.getByText(
            'Há mais páginas possíveis; o saldo não é definitivo.'
        )).toBeTruthy()
        expect(screen.getByText(
            'O backend recalcula a capacidade sob lock no envio.'
        )).toBeTruthy()
    })

    test('blocks identification when the Mating is no longer FERTILIZED', () => {
        useMatingDetailQuery.mockReturnValue(query({
            mating: { ...matingDetail.mating, status: 'COMPLETED' },
        }))

        expect(renderScreen().getByText(
            'A fertilização não está aberta para identificação de embriões.'
        )).toBeTruthy()
    })

    test('requires write permission independently from read permission', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['embryology:read', 'fertilization:read'],
        }))

        expect(renderScreen().getByText(
            'Você não tem as permissões necessárias para identificar embriões.'
        )).toBeTruthy()
    })

    test('clears the local draft when Organization changes', () => {
        const screen = renderScreen()

        fireEvent.press(screen.getByLabelText('Adicionar embrião ao lote'))
        fireEvent.changeText(
            screen.getByLabelText('Código do embrião 1'),
            'ORG-A-EMB'
        )
        expect(screen.getByDisplayValue('ORG-A-EMB')).toBeTruthy()

        useOrganization.mockReturnValue({
            activeOrganizationId: 'organization-b',
        })
        screen.rerender(
            <EmbryoBatchIdentify
                navigation={{ replace: jest.fn() }}
                route={{ params: { matingId: 'mating-a' } }}
            />
        )

        expect(screen.queryByDisplayValue('ORG-A-EMB')).toBeNull()
        expect(screen.getByText('Nenhum embrião no lote.')).toBeTruthy()
    })
})
