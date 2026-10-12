import { act, fireEvent, render } from '@testing-library/react-native'

import { useInvalidatePregnancyCheckMutation } from '../../hooks/usePregnancyCheckMutations'
import PregnancyInvalidationModal from '../PregnancyInvalidationModal'

jest.mock('../../hooks/usePregnancyCheckMutations', () => ({
    isAmbiguousPregnancyCheckError: error => ['network', 'timeout'].includes(error?.kind),
    isPregnancyCheckConflict: error => [
        'PREGNANCY_CHECK_ALREADY_INVALIDATED',
        'CONCURRENT_WRITE_CONFLICT',
        'CONSTRAINT_CONFLICT',
    ].includes(error?.code),
    useInvalidatePregnancyCheckMutation: jest.fn(),
}))

const mutation = overrides => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: jest.fn(),
    reset: jest.fn(),
    ...overrides,
})
const entry = {
    check: { id: 'check-a' },
    invalidationId: null,
}

afterEach(() => jest.clearAllMocks())

describe('Pregnancy invalidation confirmation', () => {
    test('requires a reason and reuses the exact intention after timeout', () => {
        const invalidate = mutation({ error: { kind: 'timeout' }, isError: true })
        useInvalidatePregnancyCheckMutation.mockReturnValue(invalidate)
        const screen = render(
            <PregnancyInvalidationModal
                entry={entry}
                onClose={jest.fn()}
                onReconcile={jest.fn()}
                organizationId="organization-a"
                transferId="transfer-a"
            />
        )

        fireEvent.press(screen.getByLabelText('Confirmar invalidação da checagem'))
        expect(screen.getByText(/Informe um motivo/i)).toBeTruthy()
        fireEvent.changeText(screen.getByLabelText('Motivo da invalidação'), 'Evidence withdrawn')
        fireEvent.press(screen.getByLabelText('Confirmar invalidação da checagem'))
        fireEvent.press(screen.getByLabelText('Tentar invalidar novamente com a mesma intenção'))

        expect(invalidate.mutate).toHaveBeenCalledTimes(2)
        expect(invalidate.mutate.mock.calls[1][0]).toBe(invalidate.mutate.mock.calls[0][0])
        expect(invalidate.mutate.mock.calls[0][0]).toMatchObject({
            checkId: 'check-a', payload: { reason: 'Evidence withdrawn' },
        })
    })

    test('reconciles an already-invalidated conflict without deleting history', async () => {
        const reconcile = jest.fn(() => Promise.resolve())
        const invalidate = mutation({
            error: { code: 'PREGNANCY_CHECK_ALREADY_INVALIDATED', kind: 'conflict' },
            isError: true,
        })
        useInvalidatePregnancyCheckMutation.mockReturnValue(invalidate)
        const screen = render(
            <PregnancyInvalidationModal
                entry={entry}
                onClose={jest.fn()}
                onReconcile={reconcile}
                organizationId="organization-a"
                transferId="transfer-a"
            />
        )

        await act(async () => {
            fireEvent.press(screen.getByLabelText('Recarregar histórico e revisar invalidação'))
        })
        expect(reconcile).toHaveBeenCalled()
        expect(invalidate.reset).toHaveBeenCalled()
        expect(screen.getByText(/fato original não será apagado/i)).toBeTruthy()
    })

    test('does not offer a second invalidation for an invalidated fact', () => {
        useInvalidatePregnancyCheckMutation.mockReturnValue(mutation())
        const screen = render(
            <PregnancyInvalidationModal
                entry={{ ...entry, invalidationId: 'invalidation-a' }}
                onClose={jest.fn()}
                onReconcile={jest.fn()}
                organizationId="organization-a"
                transferId="transfer-a"
            />
        )

        expect(screen.getByText(/já está invalidada/i)).toBeTruthy()
        expect(screen.queryByLabelText('Confirmar invalidação da checagem')).toBeNull()
    })
})
