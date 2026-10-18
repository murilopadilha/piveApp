import {
    act,
    fireEvent,
    render,
} from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useClientDetailQuery,
    useClientsQuery,
} from '../../hooks/useClientQueries'
import ClientDetail from '../ClientDetail'
import ClientSearch from '../ClientSearch'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))

jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))

jest.mock('../../hooks/useClientQueries', () => ({
    useClientsQuery: jest.fn(),
    useClientDetailQuery: jest.fn(),
}))

const effectiveQuery = permissions => ({
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

const listClient = {
    id: 'client-a',
    type: 'COMPANY',
    displayName: 'Fazenda Aurora',
    legalName: 'Aurora Pecuária Ltda.',
    address: {
        addressLine: 'Rodovia 1',
        municipality: 'Uberaba',
        state: 'MG',
        country: 'BR',
        postalCode: null,
    },
    status: 'ACTIVE',
    version: 2,
}

const loadedClientsQuery = (items = [listClient]) => ({
    data: { pages: [{ items, page: 0, size: 20 }] },
    error: null,
    isPending: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
})

beforeEach(() => {
    useOrganization.mockReturnValue({
        activeOrganizationId: 'organization-a',
    })
    useEffectiveContextQuery.mockReturnValue(
        effectiveQuery(['master-data:read', 'client:read'])
    )
    useClientsQuery.mockReturnValue(loadedClientsQuery())
    useClientDetailQuery.mockReturnValue({
        data: {
            id: 'client-a',
            type: 'COMPANY',
            displayName: 'Fazenda Aurora',
            version: 2,
            originType: 'MANUAL',
            recordedBy: 'actor-a',
            recordedAt: '2026-09-20T12:00:00Z',
        },
        error: null,
        isPending: false,
        refetch: jest.fn(),
    })
})

afterEach(() => {
    jest.useRealTimers()
})

describe('ClientSearch', () => {
    test('renders the initial loading state', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: undefined,
            error: null,
            isPending: true,
            isSuccess: false,
            refetch: jest.fn(),
        })
        const screen = render(
            <ClientSearch navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByLabelText('Carregando clientes')).toBeTruthy()
    })

    test('renders list data and navigates using only clientId', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<ClientSearch navigation={navigation} />)

        expect(screen.getByText('Fazenda Aurora')).toBeTruthy()
        expect(screen.getByText('Aurora Pecuária Ltda.')).toBeTruthy()
        expect(screen.getByText('Uberaba — MG')).toBeTruthy()

        fireEvent.press(screen.getByLabelText('Cliente Fazenda Aurora'))

        expect(navigation.navigate).toHaveBeenCalledWith('ClientDetail', {
            clientId: 'client-a',
        })
        expect(navigation.navigate.mock.calls[0][1]).not.toHaveProperty('client')
    })

    test('debounces server search without filtering the loaded list locally', () => {
        jest.useFakeTimers()
        const screen = render(
            <ClientSearch navigation={{ navigate: jest.fn() }} />
        )

        fireEvent.changeText(
            screen.getByLabelText('Buscar clientes'),
            '  Aurora  '
        )
        expect(useClientsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            query: '',
        }))

        act(() => {
            jest.advanceTimersByTime(500)
        })

        expect(useClientsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            query: 'Aurora',
        }))
    })

    test('distinguishes empty catalog from no search results', () => {
        useClientsQuery.mockReturnValue(loadedClientsQuery([]))
        const screen = render(
            <ClientSearch navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByText('Nenhum cliente cadastrado.')).toBeTruthy()

        jest.useFakeTimers()
        fireEvent.changeText(screen.getByLabelText('Buscar clientes'), 'Ausente')
        act(() => {
            jest.advanceTimersByTime(500)
        })
        expect(screen.getByText(
            'Nenhum cliente encontrado para esta busca.'
        )).toBeTruthy()
    })

    test('renders forbidden and recoverable network states explicitly', () => {
        useEffectiveContextQuery.mockReturnValueOnce(
            effectiveQuery(['client:read'])
        )
        const forbidden = render(
            <ClientSearch navigation={{ navigate: jest.fn() }} />
        )
        expect(forbidden.getByText(
            'Você não tem permissão para listar clientes.'
        )).toBeTruthy()
        forbidden.unmount()

        const refetch = jest.fn()
        useEffectiveContextQuery.mockReturnValue(
            effectiveQuery(['master-data:read', 'client:read'])
        )
        useClientsQuery.mockReturnValue({
            ...loadedClientsQuery([]),
            data: undefined,
            error: { kind: 'network' },
            refetch,
        })
        const network = render(
            <ClientSearch navigation={{ navigate: jest.fn() }} />
        )
        expect(network.getByText(
            'Não foi possível conectar ao servidor. Verifique sua conexão.'
        )).toBeTruthy()
        fireEvent.press(network.getByLabelText('Tentar novamente'))
        expect(refetch).toHaveBeenCalledTimes(1)
    })

    test('shows loading-more without replacing existing Clients', () => {
        useClientsQuery.mockReturnValue({
            ...loadedClientsQuery(),
            isFetchingNextPage: true,
        })
        const screen = render(
            <ClientSearch navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByText('Fazenda Aurora')).toBeTruthy()
        expect(screen.getByLabelText('Carregando mais clientes')).toBeTruthy()
    })
})

describe('ClientDetail', () => {
    test('renders only fields from ClientView', () => {
        const screen = render(
            <ClientDetail route={{ params: { clientId: 'client-a' } }} />
        )

        expect(screen.getByText('Fazenda Aurora')).toBeTruthy()
        expect(screen.getByText('Empresa')).toBeTruthy()
        expect(screen.getByText('MANUAL')).toBeTruthy()
        expect(screen.getByText('actor-a')).toBeTruthy()
        expect(screen.queryByText('Aurora Pecuária Ltda.')).toBeNull()
        expect(screen.queryByText('Uberaba')).toBeNull()
        expect(screen.queryByText('Ativo')).toBeNull()
    })

    test('gates detail permission independently from list permission', () => {
        useEffectiveContextQuery.mockReturnValue(
            effectiveQuery(['master-data:read'])
        )
        const screen = render(
            <ClientDetail route={{ params: { clientId: 'client-a' } }} />
        )

        expect(screen.getByText(
            'Você não tem permissão para consultar este cliente.'
        )).toBeTruthy()
        expect(useClientDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            enabled: false,
            clientId: 'client-a',
        }))
    })

    test('renders wrong-tenant and missing Client as not found', () => {
        useClientDetailQuery.mockReturnValue({
            data: undefined,
            error: {
                kind: 'notFound',
                code: 'CLIENT_NOT_FOUND',
            },
            isPending: false,
            refetch: jest.fn(),
        })
        const screen = render(
            <ClientDetail route={{ params: { clientId: 'missing-client' } }} />
        )

        expect(screen.getByText(
            'Cliente não encontrado nesta organização.'
        )).toBeTruthy()
    })
})
