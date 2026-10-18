import { act, fireEvent, render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import { useInventoryMovementMutation } from '../../hooks/useInventoryMutations'
import {
    useEmbryoPackageDetailQuery,
    useEmbryoPackageItemsQuery,
    useEmbryoPackagesQuery,
    useInventoryMovementsQuery,
    useInventoryProjectionQuery,
    useStorageLocationDetailQuery,
    useStorageLocationsQuery,
} from '../../hooks/useInventoryQueries'
import CryoInventoryList from '../CryoInventoryList'
import EmbryoPackageDetail from '../EmbryoPackageDetail'
import InventoryMovementCreate from '../InventoryMovementCreate'
import InventoryMovementHistory from '../InventoryMovementHistory'
import StorageLocationDetail from '../StorageLocationDetail'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useInventoryQueries', () => ({
    useEmbryoPackageDetailQuery: jest.fn(),
    useEmbryoPackageItemsQuery: jest.fn(),
    useEmbryoPackagesQuery: jest.fn(),
    useInventoryMovementsQuery: jest.fn(),
    useInventoryProjectionQuery: jest.fn(),
    useStorageLocationDetailQuery: jest.fn(),
    useStorageLocationsQuery: jest.fn(),
}))
jest.mock('../../hooks/useInventoryMutations', () => ({
    isAmbiguousInventoryMovementError: error => ['network', 'timeout'].includes(
        error?.kind
    ),
    isInventoryMovementConflict: error => [
        'STALE_PACKAGE_VERSION',
        'PACKAGE_NOT_IN_EXPECTED_LOCATION',
        'PACKAGE_ON_HOLD',
        'PACKAGE_RESERVED_FOR_SHIPMENT',
        'PACKAGE_HAS_NO_ACTIVE_MATERIAL',
        'STORAGE_LOCATION_NOT_ACTIVE',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ].includes(error?.code),
    useInventoryMovementMutation: jest.fn(),
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
    isSuccess: false,
    mutate: jest.fn(),
    reset: jest.fn(),
    ...overrides,
})

const embryoPackage = {
    id: 'package-a',
    establishmentId: 'establishment-a',
    packageCode: 'PKG-001',
    packagingType: 'CONTAINER',
    ownerPartyId: null,
    status: 'SEALED',
    sealedAt: '2026-10-12T10:00:00Z',
    currentLocationId: 'location-a',
    lastMovementSequence: 2,
    version: 3,
}

const locations = [{
    id: 'location-a', establishmentId: 'establishment-a',
    operationalLocationId: null, parentId: null, typeCode: 'RACK',
    code: 'RACK-A', name: 'Rack A', status: 'ACTIVE', version: 0,
}, {
    id: 'location-b', establishmentId: 'establishment-a',
    operationalLocationId: null, parentId: null, typeCode: 'RACK',
    code: 'RACK-B', name: 'Rack B', status: 'ACTIVE', version: 0,
}, {
    id: 'location-c', establishmentId: 'establishment-a',
    operationalLocationId: null, parentId: null, typeCode: 'RACK',
    code: 'RACK-C', name: 'Rack C', status: 'INACTIVE', version: 1,
}]

const packageItems = [{
    id: 'package-item-a',
    cryopreservationItemId: 'cryo-item-a',
    embryoId: 'embryo-a',
    positionCode: null,
}]

const ledger = [{
    id: 'movement-a', sequence: 1, type: 'RECEIVE',
    fromLocationId: null, toLocationId: 'location-a',
    occurredAt: '2026-10-12T10:00:00Z', reason: null,
}, {
    id: 'movement-b', sequence: 2, type: 'MOVE',
    fromLocationId: 'location-a', toLocationId: 'location-b',
    occurredAt: '2026-10-12T11:00:00Z', reason: 'Rotina',
}]

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['inventory:read', 'inventory:write', 'embryology:read'],
    }))
    useEmbryoPackagesQuery.mockReturnValue(query({
        pages: [{ items: [embryoPackage], page: 0, size: 20 }],
    }))
    useEmbryoPackageDetailQuery.mockReturnValue(query(embryoPackage))
    useEmbryoPackageItemsQuery.mockReturnValue(query(packageItems))
    useStorageLocationsQuery.mockReturnValue(query({
        pages: [{ items: locations, page: 0, size: 20 }],
    }))
    useStorageLocationDetailQuery.mockReturnValue(query(locations[0]))
    useInventoryMovementsQuery.mockReturnValue(query({
        pages: [{ items: ledger, page: 0, size: 20 }],
    }))
    useInventoryProjectionQuery.mockReturnValue(query({ matchesLedger: true }))
    useInventoryMovementMutation.mockReturnValue(mutation())
})

afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
})

describe('M6A inventory read screens', () => {
    test('searches packages server-side and navigates with packageId only', () => {
        jest.useFakeTimers()
        const navigation = { navigate: jest.fn() }
        const screen = render(<CryoInventoryList navigation={navigation} />)

        fireEvent.changeText(screen.getByLabelText('Buscar packages'), ' PKG-42 ')
        act(() => jest.advanceTimersByTime(500))
        expect(useEmbryoPackagesQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({ query: 'PKG-42' })
        )

        fireEvent.press(screen.getByLabelText('Package PKG-001, Selado'))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'EmbryoPackageDetail',
            { packageId: 'package-a' }
        )
    })

    test('uses the real location filter without local package filtering', () => {
        const screen = render(
            <CryoInventoryList navigation={{ navigate: jest.fn() }} />
        )

        fireEvent.press(screen.getByLabelText('Local RACK-B, Rack B'))
        expect(useEmbryoPackagesQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({ locationId: 'location-b' })
        )
    })

    test('keeps full inventory read access without write actions', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['inventory:read'],
        }))
        const screen = render(
            <EmbryoPackageDetail
                navigation={{ navigate: jest.fn() }}
                route={{ params: { packageId: 'package-a' } }}
            />
        )

        expect(screen.getByText('PKG-001')).toBeTruthy()
        expect(screen.getByLabelText('Abrir histórico de movimentos')).toBeTruthy()
        expect(screen.queryByLabelText('Registrar novo movimento')).toBeNull()
    })

    test('presents exact package dimensions, active contents and projection', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <EmbryoPackageDetail
                navigation={navigation}
                route={{ params: { packageId: 'package-a' } }}
            />
        )

        expect(screen.getByText('Projeção consistente com o ledger.')).toBeTruthy()
        expect(screen.getByText('Embrião embryo-a')).toBeTruthy()
        expect(screen.queryByText(/capacidade/i)).toBeNull()
        expect(screen.queryByText(/selar package/i)).toBeNull()
        fireEvent.press(screen.getByLabelText('Embrião embryo-a'))
        expect(navigation.navigate).toHaveBeenCalledWith('EmbryoDetail', {
            embryoId: 'embryo-a',
        })
    })

    test('shows flat StorageLocation detail without hierarchy semantics', () => {
        const screen = render(
            <StorageLocationDetail route={{
                params: { storageLocationId: 'location-a' },
            }} />
        )

        expect(screen.getAllByText('Rack A')).toHaveLength(2)
        expect(screen.getByText('A listagem mobile é plana. Parent é apenas uma referência técnica; nenhuma árvore ou capacidade é inferida.')).toBeTruthy()
        expect(screen.queryByText(/posição disponível/i)).toBeNull()
    })

    test('renders append-only ledger order and projection-check', () => {
        const screen = render(
            <InventoryMovementHistory
                navigation={{ navigate: jest.fn() }}
                route={{ params: { packageId: 'package-a' } }}
            />
        )

        expect(screen.getByText('#1 · Receber')).toBeTruthy()
        expect(screen.getByText('#2 · Mover')).toBeTruthy()
        expect(screen.getByText('Projeção consistente com o ledger.')).toBeTruthy()
    })
})

describe('M6A movement creation', () => {
    const renderMovement = (packageOverride = {}) => {
        useEmbryoPackageDetailQuery.mockReturnValue(query({
            ...embryoPackage,
            ...packageOverride,
        }))
        return render(
            <InventoryMovementCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { packageId: 'package-a' } }}
            />
        )
    }

    test('offers only MOVE/WITHDRAW when package has a current location', () => {
        const screen = renderMovement()

        expect(screen.getByLabelText('Mover')).toBeTruthy()
        expect(screen.getByLabelText('Retirar')).toBeTruthy()
        expect(screen.queryByLabelText('Receber')).toBeNull()
        expect(screen.queryByLabelText('Armazenar')).toBeNull()
        fireEvent.press(screen.getByLabelText('Mover'))
        expect(screen.getByLabelText('Local RACK-C, Rack C').props.accessibilityState.disabled)
            .toBe(true)
    })

    test.each([
        ['RECEIVE', 'Receber'],
        ['STORE', 'Armazenar'],
    ])('submits exact %s semantics from an unlocated package', (type, label) => {
        const save = mutation()
        useInventoryMovementMutation.mockReturnValue(save)
        const screen = renderMovement({ currentLocationId: null })

        fireEvent.press(screen.getByLabelText(label))
        fireEvent.press(screen.getByLabelText('Local RACK-B, Rack B'))
        fireEvent.press(screen.getByLabelText('Registrar movimento'))

        const intent = save.mutate.mock.calls[0][0]
        expect(intent.idempotencyKey).toBe(intent.payload.id)
        expect(intent.payload).toMatchObject({
            type,
            expectedLocationId: null,
            destinationId: 'location-b',
            expectedVersion: 3,
        })
    })

    test('submits exact MOVE semantics with expected version and location', () => {
        const save = mutation()
        useInventoryMovementMutation.mockReturnValue(save)
        const screen = render(
            <InventoryMovementCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { packageId: 'package-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Mover'))
        fireEvent.press(screen.getByLabelText('Local RACK-B, Rack B'))
        fireEvent.press(screen.getByLabelText('Registrar movimento'))

        expect(save.mutate.mock.calls[0][0].payload).toMatchObject({
            type: 'MOVE',
            expectedLocationId: 'location-a',
            destinationId: 'location-b',
            expectedVersion: 3,
        })
    })

    test('submits exact WITHDRAW semantics without destination', () => {
        const save = mutation()
        useInventoryMovementMutation.mockReturnValue(save)
        const screen = renderMovement()

        fireEvent.press(screen.getByLabelText('Retirar'))
        fireEvent.press(screen.getByLabelText('Registrar movimento'))

        expect(save.mutate.mock.calls[0][0].payload).toMatchObject({
            type: 'WITHDRAW',
            expectedLocationId: 'location-a',
            destinationId: null,
            expectedVersion: 3,
        })
    })

    test('retries an ambiguous outcome with the identical intention', () => {
        const save = mutation({ error: { kind: 'timeout' }, isError: true })
        useInventoryMovementMutation.mockReturnValue(save)
        const screen = renderMovement()

        fireEvent.press(screen.getByLabelText('Retirar'))
        fireEvent.press(screen.getByLabelText('Reenviar a mesma intenção de movimento'))
        fireEvent.press(screen.getByLabelText('Reenviar a mesma intenção de movimento'))

        expect(save.mutate).toHaveBeenCalledTimes(2)
        expect(save.mutate.mock.calls[1][0]).toBe(save.mutate.mock.calls[0][0])
    })

    test('editing after send creates a new movement intention', () => {
        const save = mutation({
            error: { kind: 'validation', code: 'INVALID_MOVEMENT' },
            isError: true,
        })
        useInventoryMovementMutation.mockReturnValue(save)
        const screen = renderMovement()

        fireEvent.press(screen.getByLabelText('Mover'))
        fireEvent.press(screen.getByLabelText('Local RACK-B, Rack B'))
        fireEvent.press(screen.getByLabelText('Registrar movimento'))
        const first = save.mutate.mock.calls[0][0]
        fireEvent.press(screen.getByLabelText('Editar como nova intenção de movimento'))
        fireEvent.press(screen.getByLabelText('Local RACK-C, Rack C'))
        expect(screen.getByLabelText('Local RACK-C, Rack C').props.accessibilityState.disabled)
            .toBe(true)
        fireEvent.press(screen.getByLabelText('Local RACK-B, Rack B'))
        fireEvent.changeText(screen.getByLabelText('Motivo do movimento'), 'Novo motivo')
        fireEvent.press(screen.getByLabelText('Registrar movimento'))
        const second = save.mutate.mock.calls[1][0]

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.reason).toBe('Novo motivo')
    })

    test('refetches package and locations before reviewing a conflict', async () => {
        const packageState = query(embryoPackage)
        const locationState = query({
            pages: [{ items: locations, page: 0, size: 20 }],
        })
        useEmbryoPackageDetailQuery.mockReturnValue(packageState)
        useStorageLocationsQuery.mockReturnValue(locationState)
        useInventoryMovementMutation.mockReturnValue(mutation({
            error: { kind: 'conflict', code: 'PACKAGE_ON_HOLD' },
            isError: true,
        }))
        const screen = render(
            <InventoryMovementCreate
                navigation={{ replace: jest.fn() }}
                route={{ params: { packageId: 'package-a' } }}
            />
        )

        await act(async () => {
            fireEvent.press(screen.getByLabelText(
                'Recarregar package e revisar movimento'
            ))
        })
        expect(packageState.refetch).toHaveBeenCalledTimes(1)
        expect(locationState.refetch).toHaveBeenCalledTimes(1)
    })

    test('does not expose future inventory or cryo operations', () => {
        const screen = renderMovement()
        for (const label of [
            'SHIP', 'RETURN', 'DISPOSE', 'ADJUST',
            'Criopreservar', 'Descongelar', 'Selar package',
        ]) {
            expect(screen.queryByText(label)).toBeNull()
        }
    })
})
