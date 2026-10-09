import {
    act,
    fireEvent,
    render,
} from '@testing-library/react-native'

import { useAnimalDetailQuery } from '../../../animals/hooks/useAnimalQueries'
import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOocyteCollectionDetailQuery } from '../../../opu/hooks/useOpuQueries'
import {
    useProfessionalDetailQuery,
    useProfessionalsLookup,
} from '../../../opu/hooks/useOpuLookupQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useExternalEstablishmentDetailQuery,
    useSemenBatchDetailQuery,
} from '../../../semen/hooks/useSemenQueries'
import {
    useAllocateMatingsMutation,
} from '../../hooks/useMatingMutations'
import {
    useMatingDetailQuery,
    useMatingsQuery,
} from '../../hooks/useMatingQueries'
import MatingBatchCreate from '../MatingBatchCreate'
import MatingDetail from '../MatingDetail'
import MatingList from '../MatingList'

jest.mock('react-native-modal-datetime-picker', () => () => null)
jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../../animals/hooks/useAnimalQueries', () => ({
    useAnimalDetailQuery: jest.fn(),
}))
jest.mock('../../../opu/hooks/useOpuQueries', () => ({
    useOocyteCollectionDetailQuery: jest.fn(),
}))
jest.mock('../../../opu/hooks/useOpuLookupQueries', () => ({
    useProfessionalsLookup: jest.fn(),
    useProfessionalDetailQuery: jest.fn(),
}))
jest.mock('../../../semen/hooks/useSemenQueries', () => ({
    useSemenBatchDetailQuery: jest.fn(),
    useExternalEstablishmentDetailQuery: jest.fn(),
}))
jest.mock('../../hooks/useMatingQueries', () => ({
    useMatingsQuery: jest.fn(),
    useMatingDetailQuery: jest.fn(),
}))
jest.mock('../../hooks/useMatingMutations', () => ({
    isAmbiguousMatingCommandError: error => ['network', 'timeout'].includes(error?.kind),
    isMatingConcurrencyError: error => [
        'OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ].includes(error?.code),
    useAllocateMatingsMutation: jest.fn(),
}))
jest.mock('../../components/SemenBatchSelectorModal', () => function MockSelector({
    visible,
    onSelect,
}) {
    if (!visible) {
        return null
    }

    const { Pressable, Text } = require('react-native')

    return (
        <Pressable
            accessibilityLabel="Selecionar lote de teste"
            onPress={() => onSelect({
                id: 'batch-a', batchCode: 'LOTE-42', status: 'ACTIVE',
            })}
        >
            <Text>Selecionar lote de teste</Text>
        </Pressable>
    )
})
jest.mock('../../../opu/components/OpuLookupModal', () => () => null)

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

const permissions = [
    'fertilization:read',
    'fertilization:write',
    'opu:write',
    'semen:read',
    'master-data:read',
]

const provenance = {
    originType: 'MANUAL',
    recordedAt: '2026-10-09T12:00:00Z',
}

const mating = {
    id: 'mating-a', collectionId: 'collection-a', semenBatchId: 'batch-a',
    allocatedOocytes: 3, fertilizedAt: '2026-10-09T13:00:00Z', method: 'IVF',
    responsibleProfessionalId: null, status: 'FERTILIZED', version: 0,
    provenance,
}

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({ permissions }))
    useOocyteCollectionDetailQuery.mockReturnValue(query({
        id: 'collection-a', status: 'COMPLETED', viable: 8,
        collectedAt: '2026-10-09T12:00:00Z',
    }))
    useMatingsQuery.mockReturnValue({
        ...query({ pages: [{ items: [mating], page: 0, size: 100 }] }),
    })
    useSemenBatchDetailQuery.mockReturnValue(query({
        id: 'batch-a', batchCode: 'LOTE-42', sireId: 'sire-a',
        producerEstablishmentId: 'producer-a', status: 'ACTIVE',
    }))
    useAnimalDetailQuery.mockImplementation(({ animalId }) => query({
        id: animalId,
        name: animalId === 'donor-a' ? 'Doadora A' : 'Reprodutor A',
        sex: animalId === 'donor-a' ? 'FEMALE' : 'MALE',
        status: 'ACTIVE',
    }))
    useExternalEstablishmentDetailQuery.mockReturnValue(query({
        id: 'producer-a', name: 'Central Genética', status: 'ACTIVE',
    }))
    useProfessionalsLookup.mockReturnValue(query({
        pages: [{ items: [], page: 0, size: 20 }],
    }))
    useProfessionalDetailQuery.mockReturnValue(query(undefined))
    useAllocateMatingsMutation.mockReturnValue(mutation())
    useMatingDetailQuery.mockReturnValue(query({
        mating,
        lineage: {
            collectionId: 'collection-a',
            donorId: 'donor-a',
            semen: {
                batch: { id: 'batch-a', batchCode: 'LOTE-42' },
                sire: {
                    id: 'sire-a', name: 'Reprodutor A', identifiers: [],
                },
                producer: { id: 'producer-a', name: 'Central Genética' },
            },
        },
    }))
})

describe('Mating list and detail', () => {
    test('keeps read access without write and navigates by matingId', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['fertilization:read'],
        }))
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <MatingList
                navigation={navigation}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Alocação de 3 oócitos'))

        expect(navigation.navigate).toHaveBeenCalledWith('MatingDetail', {
            matingId: 'mating-a',
        })
        expect(screen.queryByLabelText('Criar nova alocação')).toBeNull()
    })

    test('presents the persisted core lineage without Embryology concepts', () => {
        const screen = render(
            <MatingDetail route={{ params: { matingId: 'mating-a' } }} />
        )

        expect(screen.getByText('LOTE-42')).toBeTruthy()
        expect(screen.getByText('Doadora A')).toBeTruthy()
        expect(screen.getByText('Reprodutor A')).toBeTruthy()
        expect(screen.getByText('Central Genética')).toBeTruthy()
        expect(screen.queryByText(/embri/i)).toBeNull()
        expect(useMatingDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            matingId: 'mating-a',
        }))
    })

    test('resolves the responsible professional separately from recordedBy', () => {
        useMatingDetailQuery.mockReturnValue(query({
            mating: {
                ...mating,
                responsibleProfessionalId: 'professional-a',
                provenance: {
                    ...provenance,
                    recordedByUserId: 'actor-b',
                },
            },
            lineage: {
                collectionId: 'collection-a',
                donorId: 'donor-a',
                semen: {
                    batch: { id: 'batch-a', batchCode: 'LOTE-42' },
                    sire: {
                        id: 'sire-a', name: 'Reprodutor A', identifiers: [],
                    },
                    producer: { id: 'producer-a', name: 'Central Genética' },
                },
            },
        }))
        useProfessionalDetailQuery.mockReturnValue(query({
            id: 'professional-a', name: 'Dra. Ana',
        }))

        const screen = render(
            <MatingDetail route={{ params: { matingId: 'mating-a' } }} />
        )

        expect(screen.getByText('Dra. Ana')).toBeTruthy()
        expect(screen.queryByText('actor-b')).toBeNull()
        expect(useProfessionalDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            professionalId: 'professional-a',
        }))
    })
})

describe('MatingBatchCreate', () => {
    test('creates an atomic multi-Mating intention using stable IDs', () => {
        const allocate = mutation()
        useAllocateMatingsMutation.mockReturnValue(allocate)
        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Adicionar lote de sêmen'))
        fireEvent.press(screen.getByLabelText('Selecionar lote de teste'))
        fireEvent.changeText(screen.getByLabelText('Oócitos alocados'), '2')
        fireEvent.changeText(screen.getByLabelText('Método de fertilização'), 'IVF')
        fireEvent.press(screen.getByLabelText('Adicionar lote de sêmen'))
        fireEvent.press(screen.getByLabelText('Selecionar lote de teste'))
        fireEvent.changeText(screen.getByLabelText('Oócitos alocados'), '1')
        fireEvent.changeText(screen.getByLabelText('Método de fertilização'), 'ICSI')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de fertilizações'))

        expect(allocate.mutate).toHaveBeenCalledTimes(1)
        const intent = allocate.mutate.mock.calls[0][0]
        expect(intent.idempotencyKey).toBe(intent.payload.batchId)
        expect(intent.payload.items).toHaveLength(2)
        expect(intent.payload.items.map(item => item.collectionId))
            .toEqual(['collection-a', 'collection-a'])
        expect(intent.payload.items[0].itemId)
            .not.toBe(intent.payload.items[1].itemId)
        expect(intent.payload.items[0].id)
            .not.toBe(intent.payload.items[1].id)
        expect(intent.payload).not.toHaveProperty('expectedCollectionVersion')
    })

    test('retries an ambiguous outcome with the same key, IDs and payload', () => {
        const allocate = mutation({
            error: { kind: 'timeout' },
            isError: true,
        })
        useAllocateMatingsMutation.mockReturnValue(allocate)
        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Adicionar lote de sêmen'))
        fireEvent.press(screen.getByLabelText('Selecionar lote de teste'))
        fireEvent.changeText(screen.getByLabelText('Oócitos alocados'), '2')
        fireEvent.changeText(screen.getByLabelText('Método de fertilização'), 'IVF')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de fertilizações'))
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de fertilizações'))

        expect(allocate.mutate).toHaveBeenCalledTimes(2)
        expect(allocate.mutate.mock.calls[1][0])
            .toBe(allocate.mutate.mock.calls[0][0])
        expect(screen.queryByLabelText('Editar como nova intenção')).toBeNull()
    })

    test('creates a new intention before editing a command that was sent', () => {
        const allocate = mutation({
            error: { kind: 'validation', code: 'INVALID_MATING' },
            isError: true,
        })
        useAllocateMatingsMutation.mockReturnValue(allocate)
        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Adicionar lote de sêmen'))
        fireEvent.press(screen.getByLabelText('Selecionar lote de teste'))
        fireEvent.changeText(screen.getByLabelText('Oócitos alocados'), '2')
        fireEvent.changeText(screen.getByLabelText('Método de fertilização'), 'IVF')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de fertilizações'))
        const first = allocate.mutate.mock.calls[0][0]

        fireEvent.press(screen.getByLabelText('Editar como nova intenção'))
        fireEvent.changeText(screen.getByLabelText('Oócitos alocados'), '3')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de fertilizações'))
        const second = allocate.mutate.mock.calls[1][0]

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.items[0].itemId)
            .not.toBe(first.payload.items[0].itemId)
        expect(second.payload.items[0].id)
            .not.toBe(first.payload.items[0].id)
        expect(second.payload.items[0].allocatedOocytes).toBe(3)
    })

    test('refetches collection and Matings before reviewing a concurrency conflict', async () => {
        const collection = query({
            id: 'collection-a', status: 'COMPLETED', viable: 8,
            collectedAt: '2026-10-09T12:00:00Z',
        })
        const matings = {
            ...query({ pages: [{ items: [mating], page: 0, size: 100 }] }),
        }
        useOocyteCollectionDetailQuery.mockReturnValue(collection)
        useMatingsQuery.mockReturnValue(matings)
        const allocate = mutation({
            error: {
                kind: 'conflict',
                code: 'OOCYTE_ALLOCATION_EXCEEDS_VIABLE_COUNT',
            },
            isError: true,
        })
        useAllocateMatingsMutation.mockReturnValue(allocate)
        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Adicionar lote de sêmen'))
        fireEvent.press(screen.getByLabelText('Selecionar lote de teste'))
        fireEvent.changeText(screen.getByLabelText('Oócitos alocados'), '2')
        fireEvent.changeText(screen.getByLabelText('Método de fertilização'), 'IVF')
        fireEvent.press(screen.getByLabelText('Registrar lote atômico de fertilizações'))
        await act(async () => {
            fireEvent.press(screen.getByLabelText('Recarregar capacidade e revisar nova intenção'))
        })

        expect(collection.refetch).toHaveBeenCalledTimes(1)
        expect(matings.refetch).toHaveBeenCalledTimes(1)
    })

    test('does not present a definitive remaining balance from incomplete pages', () => {
        useMatingsQuery.mockReturnValue({
            ...query({ pages: [{ items: [mating], page: 0, size: 100 }] }),
            hasNextPage: true,
        })
        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        expect(screen.getByText('Há mais alocações a carregar; o saldo não é exibido como definitivo.')).toBeTruthy()
        expect(screen.getByText('O backend recalcula a capacidade sob lock no envio.')).toBeTruthy()
    })

    test('blocks allocation for a collection that is not completed', () => {
        useOocyteCollectionDetailQuery.mockReturnValue(query({
            id: 'collection-a', status: 'RECORDED', viable: 8,
            collectedAt: '2026-10-09T12:00:00Z',
        }))

        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        expect(screen.getByText('A coleta precisa estar concluída para receber fertilizações.')).toBeTruthy()
    })

    test('requires fertilization:write and opu:write separately', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: [
                'fertilization:write', 'semen:read', 'master-data:read',
            ],
        }))

        const screen = render(
            <MatingBatchCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { oocyteCollectionId: 'collection-a' } }}
            />
        )

        expect(screen.getByText('Você não tem as permissões necessárias para registrar alocações.')).toBeTruthy()
    })
})
