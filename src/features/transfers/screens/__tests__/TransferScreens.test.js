import {
    act,
    fireEvent,
    render,
} from '@testing-library/react-native'
import { FlatList } from 'react-native'

import { useAnimalsQuery } from '../../../animals/hooks/useAnimalQueries'
import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useProfessionalDetailQuery } from '../../../opu/hooks/useOpuLookupQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import RecipientAnimalSelector, {
    isEligibleRecipientAnimal,
} from '../../components/RecipientAnimalSelector'
import {
    useCloseRecipientCycleMutation,
    useOpenRecipientCycleMutation,
} from '../../hooks/useRecipientCycleMutations'
import {
    usePregnancyChecksQuery,
    usePregnancyFollowUpsQuery,
    usePregnancyOutcomeQuery,
    useRecipientCycleDetailQuery,
    useRecipientCyclesQuery,
    useTransferDetailQuery,
    useTransfersQuery,
} from '../../hooks/useTransferQueries'
import PregnancyFollowUps from '../PregnancyFollowUps'
import RecipientCycleCreate from '../RecipientCycleCreate'
import RecipientCycleDetail from '../RecipientCycleDetail'
import RecipientCycleList from '../RecipientCycleList'
import TransferDetail from '../TransferDetail'

jest.mock('../../../animals/hooks/useAnimalQueries', () => ({
    useAnimalsQuery: jest.fn(),
}))
jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../opu/hooks/useOpuLookupQueries', () => ({
    useProfessionalDetailQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useRecipientCycleMutations', () => ({
    isAmbiguousRecipientCycleError: error => ['network', 'timeout'].includes(error?.kind),
    isStaleRecipientCycleError: error => [
        'STALE_RECIPIENT_CYCLE_VERSION',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ].includes(error?.code),
    useCloseRecipientCycleMutation: jest.fn(),
    useOpenRecipientCycleMutation: jest.fn(),
}))
jest.mock('../../hooks/useTransferQueries', () => ({
    usePregnancyChecksQuery: jest.fn(),
    usePregnancyFollowUpsQuery: jest.fn(),
    usePregnancyOutcomeQuery: jest.fn(),
    useRecipientCycleDetailQuery: jest.fn(),
    useRecipientCyclesQuery: jest.fn(),
    useTransferDetailQuery: jest.fn(),
    useTransfersQuery: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    hasNextPage: false,
    isFetchingNextPage: false,
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
const provenance = { originType: 'MANUAL', recordedAt: '2026-10-11T12:00:00Z' }
const cycle = {
    id: 'cycle-a', recipientAnimalId: 'animal-a', recipientName: 'Receptora A',
    protocolVersionId: null, openedOn: '2026-10-01', closedOn: null,
    status: 'OPEN', notes: null, closureReason: null, version: 3, provenance,
}
const transfer = {
    id: 'transfer-a', reservationId: 'reservation-a', embryoId: 'embryo-a',
    recipientCycleId: 'cycle-a', performedAt: '2026-10-11T12:00:00Z',
    timezone: 'America/Sao_Paulo', origin: 'FRESH', thawEventId: null,
    operatorProfessionalId: 'professional-a', notes: null, provenance,
}
const transferDetail = {
    transfer,
    lineage: {
        embryoId: 'embryo-a', matingId: 'mating-a',
        mating: {
            collectionId: 'collection-a', donorId: 'donor-a',
            semen: {
                batch: { batchCode: 'LOTE-42' },
                sire: { name: 'Sire A' },
                producer: { name: 'Central A' },
            },
        },
    },
}
const female = {
    id: 'animal-a', name: 'Receptora A', sex: 'FEMALE', status: 'ACTIVE',
}

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['transfer:read', 'transfer:write', 'master-data:read'],
    }))
    useAnimalsQuery.mockReturnValue(query({ pages: [{ items: [female], page: 0, size: 20 }] }))
    useRecipientCyclesQuery.mockReturnValue(query({ pages: [{ items: [cycle], page: 0, size: 20 }] }))
    useRecipientCycleDetailQuery.mockReturnValue(query(cycle))
    useTransfersQuery.mockReturnValue(query({ pages: [{ items: [transfer], page: 0, size: 20 }] }))
    useTransferDetailQuery.mockReturnValue(query(transferDetail))
    usePregnancyChecksQuery.mockReturnValue(query({ pages: [{ items: [], page: 0, size: 20 }] }))
    usePregnancyOutcomeQuery.mockReturnValue(query({ transferId: 'transfer-a', latestValidCheck: null }))
    usePregnancyFollowUpsQuery.mockReturnValue(query({ pages: [{ items: [], page: 0, size: 20 }] }))
    useProfessionalDetailQuery.mockReturnValue(query({ id: 'professional-a', name: 'Vet A' }))
    useOpenRecipientCycleMutation.mockReturnValue(mutation())
    useCloseRecipientCycleMutation.mockReturnValue(mutation())
})

afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
})

describe('RecipientCycle screens', () => {
    test('lists cycles and navigates using only recipientCycleId', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<RecipientCycleList navigation={navigation} />)

        fireEvent.press(screen.getByLabelText('Receptora A, ciclo Aberto'))
        expect(navigation.navigate).toHaveBeenCalledWith('RecipientCycleDetail', {
            recipientCycleId: 'cycle-a',
        })
        expect(screen.queryByText(/cancelar ciclo/i)).toBeNull()
    })

    test('keeps read access and hides create for read-only permission', () => {
        useEffectiveContextQuery.mockReturnValue(query({ permissions: ['transfer:read'] }))
        const screen = render(<RecipientCycleList navigation={{ navigate: jest.fn() }} />)

        expect(screen.getByText('Receptora A')).toBeTruthy()
        expect(screen.queryByLabelText('Abrir novo ciclo de receptora')).toBeNull()
    })

    test('general Animal selector disables ineligible rows without ending raw pagination', () => {
        const next = jest.fn()
        const fullRawPage = Array.from({ length: 20 }, (_, index) => ({
            id: `animal-${index}`, name: `Animal ${index}`,
            sex: index === 19 ? 'FEMALE' : 'MALE', status: 'ACTIVE',
        }))
        const animalQuery = {
            ...query({ pages: [{ items: fullRawPage, page: 0, size: 20 }] }),
            hasNextPage: true,
            fetchNextPage: next,
        }
        const screen = render(
            <RecipientAnimalSelector visible query={animalQuery} onQueryChange={jest.fn()} onSelect={jest.fn()} onClose={jest.fn()} />
        )

        expect(isEligibleRecipientAnimal(fullRawPage[0])).toBe(false)
        expect(isEligibleRecipientAnimal(fullRawPage[19])).toBe(true)
        fireEvent(screen.UNSAFE_getByType(FlatList), 'onEndReached')
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('creates a stable intention with optional null protocol and reuses it on timeout', () => {
        const open = mutation({ error: { kind: 'timeout' }, isError: true })
        useOpenRecipientCycleMutation.mockReturnValue(open)
        const screen = render(
            <RecipientCycleCreate navigation={{ replace: jest.fn() }} />
        )

        fireEvent.press(screen.getByLabelText('Selecionar Animal receptora'))
        fireEvent.press(screen.getByLabelText('Selecionar Receptora A, Fêmea, Ativo'))
        fireEvent.changeText(screen.getByLabelText('Data de abertura do ciclo'), '2026-10-01')
        fireEvent.press(screen.getByLabelText('Reenviar a mesma intenção de abertura'))
        fireEvent.press(screen.getByLabelText('Reenviar a mesma intenção de abertura'))

        expect(screen.getByText(
            'O resultado é incerto. Tente novamente com a mesma intenção.'
        )).toBeTruthy()
        expect(open.mutate).toHaveBeenCalledTimes(2)
        expect(open.mutate.mock.calls[1][0]).toBe(open.mutate.mock.calls[0][0])
        expect(open.mutate.mock.calls[0][0].payload.protocolVersionId).toBeNull()
        expect(open.mutate.mock.calls[0][0].payload).not.toHaveProperty('recipientRole')
    })

    test('requires master-data permission for selection and clears local draft on tenant change', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['transfer:write'],
        }))
        const screen = render(
            <RecipientCycleCreate navigation={{ replace: jest.fn() }} />
        )

        expect(screen.getByLabelText('Selecionar Animal receptora').props)
            .toMatchObject({ accessibilityState: { disabled: true } })
        expect(screen.getByText('A seleção requer permissão de dados mestres.')).toBeTruthy()
        fireEvent.changeText(
            screen.getByLabelText('Data de abertura do ciclo'),
            '2026-10-01'
        )
        fireEvent.changeText(
            screen.getByLabelText('Observações do ciclo'),
            'Tenant A draft'
        )

        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['transfer:write', 'master-data:read'],
        }))
        useOrganization.mockReturnValue({ activeOrganizationId: 'organization-b' })
        screen.rerender(
            <RecipientCycleCreate navigation={{ replace: jest.fn() }} />
        )
        expect(screen.getByLabelText('Data de abertura do ciclo').props.value).toBe('')
        expect(screen.getByLabelText('Observações do ciclo').props.value).toBe('')
    })

    test('presents a normal retry message for read-side network failures', () => {
        useRecipientCyclesQuery.mockReturnValue({
            ...query(undefined),
            error: { kind: 'network' },
            isSuccess: false,
        })
        const screen = render(
            <RecipientCycleList navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByText(
            'Não foi possível conectar ao servidor. Tente novamente.'
        )).toBeTruthy()
        expect(screen.queryByText(/mesma intenção/i)).toBeNull()
    })

    test('closes with loaded expectedVersion and stable route to performed Transfer', () => {
        const close = mutation()
        const navigation = { navigate: jest.fn() }
        useCloseRecipientCycleMutation.mockReturnValue(close)
        const screen = render(
            <RecipientCycleDetail navigation={navigation} route={{ params: { recipientCycleId: 'cycle-a' } }} />
        )

        fireEvent.changeText(screen.getByLabelText('Data de fechamento do ciclo'), '2026-10-12')
        fireEvent.changeText(screen.getByLabelText('Motivo do fechamento'), 'Completed')
        fireEvent.press(screen.getByLabelText('Fechar ciclo de receptora'))
        fireEvent.press(screen.getByLabelText(/Transferência Fresco realizada/))

        expect(close.mutate.mock.calls[0][0].payload).toEqual({
            expectedVersion: 3, closedOn: '2026-10-12', reason: 'Completed',
        })
        expect(navigation.navigate).toHaveBeenCalledWith('TransferDetail', {
            transferId: 'transfer-a',
        })
    })

    test('stale close refetches and requires conscious new review', async () => {
        const close = mutation({
            error: { kind: 'conflict', code: 'STALE_RECIPIENT_CYCLE_VERSION' },
            isError: true,
        })
        useCloseRecipientCycleMutation.mockReturnValue(close)
        const screen = render(
            <RecipientCycleDetail navigation={{ navigate: jest.fn() }} route={{ params: { recipientCycleId: 'cycle-a' } }} />
        )

        await act(async () => fireEvent.press(screen.getByLabelText('Recarregar ciclo e revisar fechamento')))
        expect(useRecipientCycleDetailQuery.mock.results.at(-1).value.refetch).toHaveBeenCalled()
        expect(close.reset).toHaveBeenCalled()
    })
})

describe('performed Transfer and Pregnancy read screens', () => {
    test('shows lineage, null latest outcome and stable capture navigation', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<TransferDetail navigation={navigation} route={{ params: { transferId: 'transfer-a' } }} />)

        expect(screen.getByText('LOTE-42')).toBeTruthy()
        expect(screen.getByText('Sire A')).toBeTruthy()
        expect(screen.getByText('Ainda sem outcome gestacional válido.')).toBeTruthy()
        fireEvent.press(screen.getByLabelText('Registrar nova checagem gestacional'))
        expect(navigation.navigate).toHaveBeenCalledWith('PregnancyCheckCapture', {
            transferId: 'transfer-a',
        })
        expect(screen.queryByText(/invalidar/i)).toBeNull()
    })

    test('keeps M5A read-only when transfer:write is absent', () => {
        useEffectiveContextQuery.mockReturnValue(query({ permissions: ['transfer:read'] }))
        const screen = render(
            <TransferDetail navigation={{ navigate: jest.fn() }} route={{ params: { transferId: 'transfer-a' } }} />
        )

        expect(screen.getByText('Transferência realizada')).toBeTruthy()
        expect(screen.queryByLabelText('Registrar nova checagem gestacional')).toBeNull()
        expect(screen.queryByText('Corrigir')).toBeNull()
        expect(screen.queryByText('Invalidar')).toBeNull()
    })

    test('shows invalidated checks without hiding historical facts', () => {
        usePregnancyChecksQuery.mockReturnValue(query({
            pages: [{
                page: 0, size: 20, items: [{
                    check: {
                        id: 'check-a', result: 'PREGNANT', methodCode: 'ULTRASOUND',
                        checkedAt: '2026-11-10T12:00:00Z', observations: null,
                    },
                    invalidationId: 'invalidation-a',
                    invalidationReason: 'Evidence withdrawn',
                    invalidatedAt: '2026-11-11T12:00:00Z',
                }],
            }],
        }))
        const screen = render(<TransferDetail navigation={{ navigate: jest.fn() }} route={{ params: { transferId: 'transfer-a' } }} />)

        expect(screen.getByText('Prenhe')).toBeTruthy()
        expect(screen.getByText('Registro invalidado')).toBeTruthy()
        expect(screen.getByText('Evidence withdrawn')).toBeTruthy()
        expect(screen.queryByLabelText('Corrigir checagem check-a')).toBeNull()
        expect(screen.queryByLabelText('Invalidar checagem check-a')).toBeNull()
    })

    test('corrects a valid fact using only transferId and checkId', () => {
        const navigation = { navigate: jest.fn() }
        usePregnancyChecksQuery.mockReturnValue(query({
            pages: [{
                page: 0, size: 20, items: [{
                    check: {
                        id: 'check-a', result: 'PREGNANT', methodCode: 'ORG_METHOD',
                        checkedAt: '2026-11-10T12:00:00Z', observations: null,
                        supersedesCheckId: null, correctionReason: null,
                    },
                    invalidationId: null,
                    invalidationReason: null,
                    invalidatedAt: null,
                }],
            }],
        }))
        const screen = render(
            <TransferDetail navigation={navigation} route={{ params: { transferId: 'transfer-a' } }} />
        )

        fireEvent.press(screen.getByLabelText('Corrigir checagem check-a'))
        expect(navigation.navigate).toHaveBeenCalledWith('PregnancyCheckCapture', {
            transferId: 'transfer-a', checkId: 'check-a',
        })
    })

    test('uses only D30 and D60 cohorts', () => {
        const screen = render(<PregnancyFollowUps navigation={{ navigate: jest.fn() }} />)

        expect(screen.getByLabelText('Cohort D30')).toBeTruthy()
        expect(screen.getByLabelText('Cohort D60')).toBeTruthy()
        expect(screen.queryByText('D45')).toBeNull()
        fireEvent.press(screen.getByLabelText('Cohort D60'))
        expect(usePregnancyFollowUpsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            cohort: 'D60',
        }))
    })
})
