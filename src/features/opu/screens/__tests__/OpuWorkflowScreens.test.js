import {
    fireEvent,
    render,
    waitFor,
} from '@testing-library/react-native'
import { FlatList } from 'react-native'

import { useAnimalsQuery } from '../../../animals/hooks/useAnimalQueries'
import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useClientsQuery } from '../../../clients/hooks/useClientQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useEstablishmentsLookup,
    useFarmPropertiesLookup,
    useOperationalLocationsLookup,
    useProfessionalsLookup,
} from '../../hooks/useOpuLookupQueries'
import {
    useOpuSessionDetailQuery,
} from '../../hooks/useOpuQueries'
import {
    useOpenOpuMutation,
    useOpuCollectionsDryRunMutation,
    useRecordOpuCollectionsMutation,
} from '../../hooks/useOpuMutations'
import OpuCollectionBatch from '../OpuCollectionBatch'
import OpuSessionCreate from '../OpuSessionCreate'

jest.mock('react-native-modal-datetime-picker', () => function MockDatePicker(props) {
    if (!props.isVisible) {
        return null
    }

    const { Pressable, Text } = require('react-native')

    return (
        <Pressable
            accessibilityLabel="Confirmar data de teste"
            onPress={() => props.onConfirm(new Date('2026-10-09T12:00:00.000Z'))}
        >
            <Text>Confirmar data de teste</Text>
        </Pressable>
    )
})

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../../clients/hooks/useClientQueries', () => ({
    useClientsQuery: jest.fn(),
}))
jest.mock('../../../animals/hooks/useAnimalQueries', () => ({
    useAnimalsQuery: jest.fn(),
}))
jest.mock('../../hooks/useOpuLookupQueries', () => ({
    useEstablishmentsLookup: jest.fn(),
    useFarmPropertiesLookup: jest.fn(),
    useOperationalLocationsLookup: jest.fn(),
    useProfessionalsLookup: jest.fn(),
}))
jest.mock('../../hooks/useOpuQueries', () => ({
    useOpuSessionDetailQuery: jest.fn(),
}))
jest.mock('../../hooks/useOpuMutations', () => ({
    isAmbiguousCommandError: error => ['network', 'timeout'].includes(error?.kind),
    isStaleCommandError: error => error?.code === 'STALE_SESSION_VERSION',
    useOpenOpuMutation: jest.fn(),
    useOpuCollectionsDryRunMutation: jest.fn(),
    useRecordOpuCollectionsMutation: jest.fn(),
}))

const infiniteQuery = items => ({
    data: { pages: [{ items, page: 0, size: 20 }] },
    error: null,
    isPending: false,
    isSuccess: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
})

const mutation = overrides => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: jest.fn(),
    reset: jest.fn(),
    ...overrides,
})

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue({
        data: {
            permissions: ['opu:read', 'opu:write', 'master-data:read'],
        },
        error: null,
        isPending: false,
        isSuccess: true,
    })
    useEstablishmentsLookup.mockReturnValue(infiniteQuery([{
        id: 'establishment-a', legalDisplayName: 'Laboratório A', status: 'ACTIVE',
    }]))
    useOperationalLocationsLookup.mockReturnValue(infiniteQuery([]))
    useFarmPropertiesLookup.mockReturnValue(infiniteQuery([{
        id: 'farm-a', name: 'Fazenda A', status: 'ACTIVE',
    }]))
    useProfessionalsLookup.mockReturnValue(infiniteQuery([{
        id: 'professional-a', name: 'Dra. Ana', status: 'ACTIVE',
    }]))
    useClientsQuery.mockReturnValue(infiniteQuery([]))
    useAnimalsQuery.mockReturnValue(infiniteQuery([
        { id: 'animal-a', name: 'Aurora', sex: 'FEMALE', status: 'ACTIVE' },
        { id: 'animal-b', name: 'Touro', sex: 'MALE', status: 'ACTIVE' },
    ]))
    useOpuSessionDetailQuery.mockReturnValue({
        data: { id: 'opu-a', status: 'IN_PROGRESS', version: 1 },
        error: null,
        isPending: false,
        isSuccess: true,
        refetch: jest.fn(),
    })
})

describe('OpuSessionCreate', () => {
    test('creates one stable intention from real master-data selections', async () => {
        const navigation = { replace: jest.fn() }
        const open = mutation({
            mutate: jest.fn((intent, options) => options.onSuccess({
                id: intent.payload.id,
            })),
        })
        useOpenOpuMutation.mockReturnValue(open)
        const screen = render(<OpuSessionCreate navigation={navigation} />)

        fireEvent.press(screen.getByLabelText('Estabelecimento: não selecionado'))
        fireEvent.press(await screen.findByLabelText('Selecionar Laboratório A'))
        fireEvent.press(screen.getByLabelText('Propriedade: não selecionado'))
        fireEvent.press(await screen.findByLabelText('Selecionar Fazenda A'))
        fireEvent.press(screen.getByLabelText('Profissional responsável: não selecionado'))
        fireEvent.press(await screen.findByLabelText('Selecionar Dra. Ana'))
        fireEvent.press(screen.getByLabelText('Data e hora da OPU: não selecionado'))
        fireEvent.press(screen.getByLabelText('Confirmar data de teste'))
        fireEvent.press(screen.getByLabelText('Criar OPU'))

        expect(open.mutate).toHaveBeenCalledTimes(1)
        const intent = open.mutate.mock.calls[0][0]
        expect(intent.payload).toMatchObject({
            establishmentId: 'establishment-a',
            farmPropertyId: 'farm-a',
            leadProfessionalId: 'professional-a',
            performedAt: '2026-10-09T12:00:00.000Z',
        })
        expect(navigation.replace).toHaveBeenCalledWith('OpuSessionDetail', {
            opuSessionId: intent.payload.id,
        })
    })
})

describe('OpuCollectionBatch', () => {
    test('keeps IDs stable from dry-run through the atomic bulk command', async () => {
        let previewIntent
        const preview = mutation({
            mutate: jest.fn((intent, options) => {
                previewIntent = intent
                options.onSuccess({
                    batchId: intent.payload.batchId,
                    dryRun: true,
                    items: intent.payload.items.map(item => ({
                        itemId: item.itemId,
                        collectionId: item.id,
                        status: 'VALID',
                        errorCode: null,
                    })),
                })
            }),
        })
        const bulk = mutation()
        useOpuCollectionsDryRunMutation.mockReturnValue(preview)
        useRecordOpuCollectionsMutation.mockReturnValue(bulk)
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Aurora, elegível'))
        expect(screen.getByLabelText('Touro, não elegível')).toBeDisabled()
        fireEvent.changeText(screen.getByLabelText('Total recuperado'), '5')
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '4')
        fireEvent.changeText(screen.getByLabelText('Folículos aspirados'), '0')
        fireEvent.press(screen.getByText('Validar lote'))

        await waitFor(() => expect(screen.getByText('Válida')).toBeTruthy())
        fireEvent.press(screen.getByText('Registrar lote atômico'))

        expect(bulk.mutate).toHaveBeenCalledWith(
            previewIntent,
            expect.any(Object)
        )
        expect(previewIntent.idempotencyKey).toBe(previewIntent.payload.batchId)
        expect(previewIntent.payload.items[0]).toMatchObject({
            totalRecovered: 5,
            viable: 4,
            folliclesAspirated: 0,
        })
    })

    test('does not offer ineligible Animals as donors', () => {
        useOpuCollectionsDryRunMutation.mockReturnValue(mutation())
        useRecordOpuCollectionsMutation.mockReturnValue(mutation())
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Touro, não elegível'))
        expect(screen.getByText('Draft local (0/100)')).toBeTruthy()
    })

    test('uses the raw full Animal page to keep donor pagination available', () => {
        const fetchNextPage = jest.fn()
        const animals = Array.from({ length: 20 }, (_, index) => ({
            id: `animal-${index}`,
            name: `Animal ${index}`,
            sex: 'MALE',
            status: 'ACTIVE',
        }))
        useAnimalsQuery.mockReturnValue({
            ...infiniteQuery(animals),
            fetchNextPage,
            hasNextPage: true,
        })
        useOpuCollectionsDryRunMutation.mockReturnValue(mutation())
        useRecordOpuCollectionsMutation.mockReturnValue(mutation())
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        const animalList = screen.UNSAFE_getByType(FlatList)
        fireEvent(animalList, 'onEndReached')

        expect(animalList.props.data).toHaveLength(20)
        expect(animalList.props.data.every(animal => animal.sex === 'MALE'))
            .toBe(true)
        expect(fetchNextPage).toHaveBeenCalledTimes(1)
    })

    test.each([
        ['edita um item', (screen) => {
            fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '3')
        }],
        ['adiciona um item', (screen) => {
            fireEvent.press(screen.getByLabelText('Beatriz, elegível'))
        }],
        ['remove um item', (screen) => {
            fireEvent.press(screen.getByLabelText('Remover coleta do draft'))
        }],
    ])('requires a new dry-run when the user %s', async (_name, changeDraft) => {
        useAnimalsQuery.mockReturnValue(infiniteQuery([
            { id: 'animal-a', name: 'Aurora', sex: 'FEMALE', status: 'ACTIVE' },
            { id: 'animal-c', name: 'Beatriz', sex: 'FEMALE', status: 'ACTIVE' },
        ]))
        const preview = mutation({
            mutate: jest.fn((intent, options) => options.onSuccess({
                batchId: intent.payload.batchId,
                dryRun: true,
                items: intent.payload.items.map(item => ({
                    itemId: item.itemId,
                    collectionId: item.id,
                    status: 'VALID',
                    errorCode: null,
                })),
            })),
        })
        const bulk = mutation()
        useOpuCollectionsDryRunMutation.mockReturnValue(preview)
        useRecordOpuCollectionsMutation.mockReturnValue(bulk)
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Aurora, elegível'))
        fireEvent.changeText(screen.getByLabelText('Total recuperado'), '5')
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '4')
        fireEvent.press(screen.getByText('Validar lote'))
        await waitFor(() => {
            expect(screen.getByLabelText('Registrar lote atômico')).toBeEnabled()
        })

        changeDraft(screen)

        expect(screen.getByLabelText('Registrar lote atômico')).toBeDisabled()
        fireEvent.press(screen.getByLabelText('Registrar lote atômico'))
        expect(bulk.mutate).not.toHaveBeenCalled()
    })

    test('ignores a dry-run result that returns after the draft changes', () => {
        let completeDryRun
        const preview = mutation({
            mutate: jest.fn((intent, options) => {
                completeDryRun = () => options.onSuccess({
                    batchId: intent.payload.batchId,
                    dryRun: true,
                    items: intent.payload.items.map(item => ({
                        itemId: item.itemId,
                        collectionId: item.id,
                        status: 'VALID',
                        errorCode: null,
                    })),
                })
            }),
        })
        useOpuCollectionsDryRunMutation.mockReturnValue(preview)
        useRecordOpuCollectionsMutation.mockReturnValue(mutation())
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Aurora, elegível'))
        fireEvent.changeText(screen.getByLabelText('Total recuperado'), '5')
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '4')
        fireEvent.press(screen.getByText('Validar lote'))
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '3')
        completeDryRun()

        expect(screen.getByLabelText('Registrar lote atômico')).toBeDisabled()
        expect(screen.queryByText('Válida')).toBeNull()
    })

    test('creates a new batch intention when payload changes after a sent command', async () => {
        useAnimalsQuery.mockReturnValue(infiniteQuery([
            { id: 'animal-a', name: 'Aurora', sex: 'FEMALE', status: 'ACTIVE' },
            { id: 'animal-c', name: 'Beatriz', sex: 'FEMALE', status: 'ACTIVE' },
        ]))
        const preview = mutation({
            mutate: jest.fn((intent, options) => options.onSuccess({
                batchId: intent.payload.batchId,
                dryRun: true,
                items: intent.payload.items.map(item => ({
                    itemId: item.itemId,
                    collectionId: item.id,
                    status: 'VALID',
                    errorCode: null,
                })),
            })),
        })
        const bulk = mutation({ error: { kind: 'validation' }, isError: true })
        useOpuCollectionsDryRunMutation.mockReturnValue(preview)
        useRecordOpuCollectionsMutation.mockReturnValue(bulk)
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Aurora, elegível'))
        fireEvent.changeText(screen.getByLabelText('Total recuperado'), '5')
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '4')
        fireEvent.press(screen.getByText('Validar lote'))
        await waitFor(() => {
            expect(screen.getByLabelText('Registrar lote atômico')).toBeEnabled()
        })
        const sentIntent = preview.mutate.mock.calls[0][0]
        fireEvent.press(screen.getByLabelText('Registrar lote atômico'))

        fireEvent.press(screen.getByLabelText('Beatriz, elegível'))
        fireEvent.changeText(screen.getByLabelText('Total recuperado'), '3')
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '2')
        fireEvent.press(screen.getByText('Validar lote'))
        const changedIntent = preview.mutate.mock.calls[1][0]

        expect(changedIntent.idempotencyKey).not.toBe(sentIntent.idempotencyKey)
        expect(changedIntent.payload.batchId).toBe(changedIntent.idempotencyKey)
        expect(changedIntent.payload.items).toHaveLength(2)
    })

    test('keeps a rejected item editable with the same IDs for another dry-run', async () => {
        const preview = mutation({
            mutate: jest.fn((intent, options) => options.onSuccess({
                batchId: intent.payload.batchId,
                dryRun: true,
                items: [{
                    itemId: intent.payload.items[0].itemId,
                    collectionId: null,
                    status: 'REJECTED',
                    errorCode: 'DONOR_NOT_ELIGIBLE',
                }],
            })),
        })
        useOpuCollectionsDryRunMutation.mockReturnValue(preview)
        useRecordOpuCollectionsMutation.mockReturnValue(mutation())
        const screen = render(
            <OpuCollectionBatch
                navigation={{ replace: jest.fn() }}
                route={{ params: { opuSessionId: 'opu-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Aurora, elegível'))
        fireEvent.changeText(screen.getByLabelText('Total recuperado'), '5')
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '4')
        fireEvent.press(screen.getByText('Validar lote'))

        await waitFor(() => expect(screen.getByText('DONOR_NOT_ELIGIBLE')).toBeTruthy())
        const firstIntent = preview.mutate.mock.calls[0][0]
        fireEvent.changeText(screen.getByLabelText('Oócitos viáveis'), '3')
        fireEvent.press(screen.getByText('Validar lote'))
        const secondIntent = preview.mutate.mock.calls[1][0]

        expect(secondIntent.idempotencyKey).toBe(firstIntent.idempotencyKey)
        expect(secondIntent.payload.items[0].itemId)
            .toBe(firstIntent.payload.items[0].itemId)
        expect(secondIntent.payload.items[0].id)
            .toBe(firstIntent.payload.items[0].id)
        expect(secondIntent.payload.items[0].viable).toBe(3)
    })
})
