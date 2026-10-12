import {
    act,
    fireEvent,
    render,
    waitFor,
} from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import {
    useProfessionalDetailQuery,
    useProfessionalsLookup,
} from '../../../opu/hooks/useOpuLookupQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import { useRecordPregnancyCheckMutation } from '../../hooks/usePregnancyCheckMutations'
import {
    usePregnancyChecksQuery,
    useTransferDetailQuery,
} from '../../hooks/useTransferQueries'
import PregnancyCheckCapture from '../PregnancyCheckCapture'

jest.mock('react-native-modal-datetime-picker', () => function MockDatePicker({
    isVisible,
    onConfirm,
}) {
    if (!isVisible) return null
    const { Pressable, Text } = require('react-native')

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirmar data mock"
            onPress={() => onConfirm(new Date('2026-11-10T12:00:00Z'))}
        >
            <Text>Confirmar data</Text>
        </Pressable>
    )
})

jest.mock('../../../opu/components/OpuLookupModal', () => function MockLookup({
    visible,
    query,
    itemLabel,
    isItemDisabled,
    onSelect,
}) {
    if (!visible) return null
    const { Pressable, Text, View } = require('react-native')
    const items = query.data?.pages.flatMap(page => page.items) ?? []

    return (
        <View>
            {items.map(item => (
                <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar mock ${itemLabel(item)}`}
                    accessibilityState={{ disabled: isItemDisabled(item) }}
                    disabled={isItemDisabled(item)}
                    onPress={() => onSelect(item)}
                >
                    <Text>{itemLabel(item)}</Text>
                </Pressable>
            ))}
        </View>
    )
})

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../opu/hooks/useOpuLookupQueries', () => ({
    useProfessionalDetailQuery: jest.fn(),
    useProfessionalsLookup: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/usePregnancyCheckMutations', () => ({
    isAmbiguousPregnancyCheckError: error => ['network', 'timeout'].includes(error?.kind),
    isPregnancyCheckConflict: error => [
        'DUPLICATE_SUPERSEDED_CHECK',
        'PREGNANCY_CHECK_ALREADY_INVALIDATED',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ].includes(error?.code),
    useRecordPregnancyCheckMutation: jest.fn(),
}))
jest.mock('../../hooks/useTransferQueries', () => ({
    usePregnancyChecksQuery: jest.fn(),
    useTransferDetailQuery: jest.fn(),
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
const transferDetail = {
    transfer: {
        id: 'transfer-a', performedAt: '2026-10-11T12:00:00Z',
    },
}
const activeProfessional = {
    id: 'professional-a', name: 'Dra. Ana',
    professionalType: 'EMBRYOLOGIST', status: 'ACTIVE', version: 0,
}
const inactiveProfessional = {
    id: 'professional-b', name: 'Técnico inativo',
    professionalType: 'TECHNICIAN', status: 'INACTIVE', version: 1,
}
const previousCheck = {
    check: {
        id: 'check-old', transferId: 'transfer-a',
        checkedAt: '2026-11-10T12:00:00Z', timezone: 'America/Sao_Paulo',
        result: 'PREGNANT', methodCode: 'ORG_METHOD', observations: 'Observed',
        professionalId: 'professional-a', supersedesCheckId: null,
        correctionReason: null,
    },
    invalidationId: null,
    invalidationReason: null,
    invalidatedAt: null,
}

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['transfer:read', 'transfer:write', 'master-data:read'],
    }))
    useTransferDetailQuery.mockReturnValue(query(transferDetail))
    usePregnancyChecksQuery.mockReturnValue(query({
        pages: [{ items: [], page: 0, size: 20 }],
    }))
    useProfessionalDetailQuery.mockReturnValue(query(activeProfessional))
    useProfessionalsLookup.mockReturnValue(query({
        pages: [{
            items: [activeProfessional, inactiveProfessional], page: 0, size: 20,
        }],
    }))
    useRecordPregnancyCheckMutation.mockReturnValue(mutation())
})

afterEach(() => jest.clearAllMocks())

const fillNewCheck = (screen) => {
    fireEvent.press(screen.getByLabelText('Profissional: não selecionado'))
    fireEvent.press(screen.getByLabelText('Selecionar mock Dra. Ana — Ativo'))
    fireEvent.press(screen.getByLabelText('Data e hora da checagem: não selecionado'))
    fireEvent.press(screen.getByLabelText('Confirmar data mock'))
    fireEvent.press(screen.getByLabelText('Prenhe'))
    fireEvent.changeText(screen.getByLabelText('Código do método'), ' org_method ')
}

describe('PregnancyCheck capture screen', () => {
    test('sends one bulk item and preserves the same intention on ambiguous retry', () => {
        const record = mutation({ error: { kind: 'timeout' }, isError: true })
        useRecordPregnancyCheckMutation.mockReturnValue(record)
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )

        fillNewCheck(screen)
        fireEvent.press(screen.getByLabelText('Registrar checagem gestacional'))
        fireEvent.press(screen.getByLabelText('Tentar registrar novamente com a mesma intenção'))

        expect(record.mutate).toHaveBeenCalledTimes(2)
        expect(record.mutate.mock.calls[1][0]).toBe(record.mutate.mock.calls[0][0])
        const intent = record.mutate.mock.calls[0][0]
        expect(intent.payload.items).toHaveLength(1)
        expect(intent.idempotencyKey).toBe(intent.payload.batchId)
        expect(intent.payload.items[0]).toMatchObject({
            transferId: 'transfer-a', result: 'PREGNANT',
            methodCode: 'ORG_METHOD', professionalId: 'professional-a',
        })
    })

    test('shows inactive Professionals but does not allow selecting them', () => {
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )

        fireEvent.press(screen.getByLabelText('Profissional: não selecionado'))
        expect(screen.getByLabelText('Selecionar mock Técnico inativo — Inativo').props)
            .toMatchObject({ accessibilityState: { disabled: true } })
        expect(useProfessionalsLookup).toHaveBeenCalledWith(expect.objectContaining({
            organizationId: 'organization-a',
        }))
    })

    test('turns editing after a sent business rejection into a new intention', () => {
        const record = mutation({
            error: { code: 'INVALID_CHECK_METHOD', kind: 'validation' },
            isError: true,
        })
        useRecordPregnancyCheckMutation.mockReturnValue(record)
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )

        fillNewCheck(screen)
        fireEvent.press(screen.getByLabelText('Registrar checagem gestacional'))
        const first = record.mutate.mock.calls[0][0]
        fireEvent.press(screen.getByLabelText('Editar checagem como nova intenção'))
        fireEvent.changeText(screen.getByLabelText('Código do método'), 'NEW_CODE')
        fireEvent.press(screen.getByLabelText('Registrar checagem gestacional'))
        const second = record.mutate.mock.calls[1][0]

        expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
        expect(second.payload.items[0].itemId).not.toBe(first.payload.items[0].itemId)
        expect(second.payload.items[0].id).not.toBe(first.payload.items[0].id)
        expect(second.payload.items[0].methodCode).toBe('NEW_CODE')
    })

    test('creates an append-only correction from IDs and persisted history', async () => {
        const record = mutation()
        useRecordPregnancyCheckMutation.mockReturnValue(record)
        usePregnancyChecksQuery.mockReturnValue(query({
            pages: [{ items: [previousCheck], page: 0, size: 20 }],
        }))
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a', checkId: 'check-old' } }}
            />
        )

        await waitFor(() => expect(
            screen.getByLabelText('Código do método').props.value
        ).toBe('ORG_METHOD'))
        fireEvent.changeText(
            screen.getByLabelText('Motivo da correção'),
            'Corrected evidence'
        )
        fireEvent.press(screen.getByLabelText('Registrar correção append-only'))

        expect(record.mutate.mock.calls[0][0].payload.items[0]).toMatchObject({
            supersedesCheckId: 'check-old',
            correctionReason: 'Corrected evidence',
            professionalId: 'professional-a',
        })
        expect(screen.getByText(/registro original permanecerá no histórico/i)).toBeTruthy()
    })

    test('clears local fields and command state on Organization change', async () => {
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )
        fireEvent.changeText(screen.getByLabelText('Código do método'), 'TENANT_A')

        useOrganization.mockReturnValue({ activeOrganizationId: 'organization-b' })
        screen.rerender(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )
        await waitFor(() => expect(
            screen.getByLabelText('Código do método').props.value
        ).toBe(''))
    })

    test('requires read, write and master-data permissions without affecting M5A reads', () => {
        useEffectiveContextQuery.mockReturnValue(query({ permissions: ['transfer:read'] }))
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )

        expect(screen.getByText(/não tem as permissões necessárias/i)).toBeTruthy()
    })

    test('refetches and unlocks a new intention after a concurrent conflict', async () => {
        const record = mutation({
            error: { code: 'CONCURRENT_WRITE_CONFLICT', kind: 'conflict' },
            isError: true,
        })
        useRecordPregnancyCheckMutation.mockReturnValue(record)
        const detail = query(transferDetail)
        useTransferDetailQuery.mockReturnValue(detail)
        const screen = render(
            <PregnancyCheckCapture
                navigation={{ goBack: jest.fn() }}
                route={{ params: { transferId: 'transfer-a' } }}
            />
        )

        fillNewCheck(screen)
        fireEvent.press(screen.getByLabelText('Registrar checagem gestacional'))
        await act(async () => {
            fireEvent.press(screen.getByLabelText('Recarregar histórico e revisar correção'))
        })
        expect(detail.refetch).toHaveBeenCalled()
        expect(record.reset).toHaveBeenCalled()
    })
})
