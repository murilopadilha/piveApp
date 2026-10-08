import {
    act,
    fireEvent,
    render,
} from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useAnimalDetailQuery,
    useAnimalIdentifiersQuery,
    useAnimalOwnersQueries,
    useAnimalOwnershipQuery,
    useAnimalsQuery,
    useBreedDetailQuery,
} from '../../hooks/useAnimalQueries'
import AnimalDetail from '../AnimalDetail'
import AnimalSearch from '../AnimalSearch'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))

jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))

jest.mock('../../hooks/useAnimalQueries', () => ({
    useAnimalsQuery: jest.fn(),
    useAnimalDetailQuery: jest.fn(),
    useAnimalIdentifiersQuery: jest.fn(),
    useAnimalOwnershipQuery: jest.fn(),
    useBreedDetailQuery: jest.fn(),
    useAnimalOwnersQueries: jest.fn(),
}))

const effectiveQuery = (permissions = ['master-data:read']) => ({
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

const animal = {
    id: 'animal-a',
    sex: 'FEMALE',
    name: 'Aurora',
    breedId: 'breed-a',
    birthDate: '2024-01-02',
    status: 'ACTIVE',
    version: 2,
    originType: 'MANUAL',
    recordedBy: 'actor-a',
    recordedAt: '2026-09-20T12:00:00Z',
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

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(effectiveQuery())
    useAnimalsQuery.mockReturnValue(infiniteQuery([animal]))
    useAnimalDetailQuery.mockReturnValue({
        data: animal,
        error: null,
        isPending: false,
        isSuccess: true,
        refetch: jest.fn(),
    })
    useBreedDetailQuery.mockReturnValue({
        data: {
            id: 'breed-a',
            name: 'Nelore',
            code: 'NEL',
            status: 'ACTIVE',
            version: 0,
        },
        error: null,
        isPending: false,
        refetch: jest.fn(),
    })
    useAnimalIdentifiersQuery.mockReturnValue(infiniteQuery([{
        id: 'identifier-a',
        animalId: 'animal-a',
        type: 'EAR_TAG',
        value: '0042',
        issuer: 'ABC',
        validFrom: '2024-01-01',
        validUntil: null,
        status: 'ACTIVE',
        version: 0,
    }]))
    useAnimalOwnershipQuery.mockReturnValue(infiniteQuery([
        {
            id: 'ownership-a',
            animalId: 'animal-a',
            ownerId: 'owner-a',
            from: '2024-01-01',
            until: null,
            sourceDocumentId: null,
            version: 0,
        },
        {
            id: 'ownership-b',
            animalId: 'animal-a',
            ownerId: 'owner-b',
            from: '2025-01-01',
            until: null,
            sourceDocumentId: null,
            version: 0,
        },
    ]))
    useAnimalOwnersQueries.mockReturnValue([
        {
            ownerId: 'owner-a',
            data: { id: 'owner-a', displayName: 'Fazenda Aurora' },
            error: null,
            isPending: false,
            refetch: jest.fn(),
        },
        {
            ownerId: 'owner-b',
            data: { id: 'owner-b', displayName: 'Cooperativa Campo' },
            error: null,
            isPending: false,
            refetch: jest.fn(),
        },
    ])
})

afterEach(() => {
    jest.useRealTimers()
})

describe('AnimalSearch', () => {
    test('uses only list fields and navigates with animalId', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<AnimalSearch navigation={navigation} />)

        expect(screen.getByText('Aurora')).toBeTruthy()
        expect(screen.getByText('Fêmea')).toBeTruthy()
        expect(screen.getByText('Nascimento: 02/01/2024')).toBeTruthy()
        expect(screen.queryByText('Nelore')).toBeNull()
        expect(screen.queryByText('0042')).toBeNull()
        expect(screen.queryByText('Fazenda Aurora')).toBeNull()

        fireEvent.press(screen.getByLabelText('Aurora, Fêmea'))

        expect(navigation.navigate).toHaveBeenCalledWith('AnimalIdentityDetail', {
            animalId: 'animal-a',
        })
        expect(navigation.navigate.mock.calls[0][1]).not.toHaveProperty('animal')
    })

    test('presents a neutral localized fallback for a nameless Animal', () => {
        useAnimalsQuery.mockReturnValue(infiniteQuery([{ ...animal, name: null }]))

        const screen = render(
            <AnimalSearch navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByText('Animal sem nome')).toBeTruthy()
        expect(screen.queryByText('animal-a')).toBeNull()
    })

    test('debounces q for server search and does not expose role filters', () => {
        jest.useFakeTimers()
        const screen = render(
            <AnimalSearch navigation={{ navigate: jest.fn() }} />
        )

        fireEvent.changeText(screen.getByLabelText('Buscar animais'), '  0042  ')
        expect(useAnimalsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            query: '',
        }))
        act(() => jest.advanceTimersByTime(500))
        expect(useAnimalsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            query: '0042',
        }))
        expect(screen.queryByText('Doadoras')).toBeNull()
        expect(screen.queryByText('Touros')).toBeNull()
        expect(screen.queryByText('Receptoras')).toBeNull()
    })

    test('distinguishes empty search, forbidden and recoverable network failure', () => {
        useAnimalsQuery.mockReturnValue(infiniteQuery([]))
        const empty = render(
            <AnimalSearch navigation={{ navigate: jest.fn() }} />
        )
        expect(empty.getByText('Nenhum animal cadastrado.')).toBeTruthy()
        empty.unmount()

        useEffectiveContextQuery.mockReturnValue(effectiveQuery([]))
        const forbidden = render(
            <AnimalSearch navigation={{ navigate: jest.fn() }} />
        )
        expect(forbidden.getByText(
            'Você não tem permissão para consultar animais.'
        )).toBeTruthy()
        forbidden.unmount()

        const refetch = jest.fn()
        useEffectiveContextQuery.mockReturnValue(effectiveQuery())
        useAnimalsQuery.mockReturnValue({
            ...infiniteQuery([]),
            data: undefined,
            error: { kind: 'network' },
            refetch,
        })
        const network = render(
            <AnimalSearch navigation={{ navigate: jest.fn() }} />
        )
        expect(network.getByText(
            'Não foi possível conectar ao servidor. Verifique sua conexão.'
        )).toBeTruthy()
        fireEvent.press(network.getByLabelText('Tentar novamente'))
        expect(refetch).toHaveBeenCalledTimes(1)
    })
})

describe('AnimalDetail', () => {
    test('composes identity, Breed, identifiers, coownership and provenance', () => {
        const screen = render(
            <AnimalDetail route={{ params: { animalId: 'animal-a' } }} />
        )

        expect(screen.getByText('Aurora')).toBeTruthy()
        expect(screen.getByText('Nelore')).toBeTruthy()
        expect(screen.getByText('EAR_TAG: 0042')).toBeTruthy()
        expect(screen.getByText('Fazenda Aurora')).toBeTruthy()
        expect(screen.getByText('Cooperativa Campo')).toBeTruthy()
        expect(screen.getAllByText('Vínculo em aberto')).toHaveLength(2)
        expect(screen.getByText('Registro manual')).toBeTruthy()
        expect(screen.queryByText('Proprietário atual')).toBeNull()
        expect(screen.queryByText('Identificador principal')).toBeNull()
        expect(screen.queryByText('Doadora')).toBeNull()
    })

    test('does not request Breed data when breedId is null', () => {
        useAnimalDetailQuery.mockReturnValue({
            data: { ...animal, breedId: null },
            error: null,
            isPending: false,
            isSuccess: true,
            refetch: jest.fn(),
        })
        const screen = render(
            <AnimalDetail route={{ params: { animalId: 'animal-a' } }} />
        )

        expect(screen.getByText('Raça não informada.')).toBeTruthy()
        expect(useBreedDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            breedId: null,
        }))
    })

    test('preserves closed ownership intervals alongside open coowners', () => {
        useAnimalOwnershipQuery.mockReturnValue(infiniteQuery([
            {
                id: 'ownership-a',
                ownerId: 'owner-a',
                from: '2024-01-01',
                until: '2025-01-01',
            },
            {
                id: 'ownership-b',
                ownerId: 'owner-b',
                from: '2025-01-01',
                until: null,
            },
        ]))
        const screen = render(
            <AnimalDetail route={{ params: { animalId: 'animal-a' } }} />
        )

        expect(screen.getByText('Período: 01/01/2024 até 01/01/2025')).toBeTruthy()
        expect(screen.getByText('Período: 01/01/2025 até em aberto')).toBeTruthy()
        expect(screen.getAllByText('Vínculo em aberto')).toHaveLength(1)
    })

    test('keeps the main identity usable when a related query fails', () => {
        useAnimalIdentifiersQuery.mockReturnValue({
            ...infiniteQuery([]),
            data: undefined,
            error: { kind: 'timeout' },
        })
        const screen = render(
            <AnimalDetail route={{ params: { animalId: 'animal-a' } }} />
        )

        expect(screen.getByText('Aurora')).toBeTruthy()
        expect(screen.getByText(
            'O servidor demorou para responder. Tente novamente.'
        )).toBeTruthy()
        expect(screen.getByText('Nelore')).toBeTruthy()
    })

    test('renders wrong-tenant Animal as not found and rejects missing route ID', () => {
        useAnimalDetailQuery.mockReturnValue({
            data: undefined,
            error: { kind: 'notFound', code: 'ANIMAL_NOT_FOUND' },
            isPending: false,
            isSuccess: false,
            refetch: jest.fn(),
        })
        const notFound = render(
            <AnimalDetail route={{ params: { animalId: 'missing' } }} />
        )
        expect(notFound.getByText(
            'Animal não encontrado nesta organização.'
        )).toBeTruthy()
        notFound.unmount()

        const missingId = render(<AnimalDetail route={{ params: {} }} />)
        expect(missingId.getByText('Animal não identificado.')).toBeTruthy()
    })
})
