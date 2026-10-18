import { fireEvent, render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useCorrectionDetailQuery,
    useCorrectionImpactQuery,
    useCorrectionsQuery,
} from '../../hooks/useCorrectionQueries'
import CorrectionDetail from '../CorrectionDetail'
import CorrectionList from '../CorrectionList'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useCorrectionQueries', () => ({
    useCorrectionDetailQuery: jest.fn(),
    useCorrectionImpactQuery: jest.fn(),
    useCorrectionsQuery: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(() => Promise.resolve({ data })),
})

const correction = {
    id: 'correction-a',
    subjectType: 'MATING',
    subjectId: 'mating-a',
    reason: 'Revisar origem histórica',
    previousSemantics: '{"semenBatchId":"batch-a"}',
    proposedSemantics: 'semântica histórica sem JSON',
    subjectVersion: 3,
    status: 'REQUESTED',
    requestedAt: '2026-10-15T10:00:00Z',
}

const rejectedWithoutVersion = {
    ...correction,
    id: 'correction-b',
    subjectType: 'PREGNANCY_CHECK',
    subjectId: 'check-b',
    subjectVersion: null,
    status: 'REJECTED',
}

const impact = {
    affectedEmbryos: 4,
    activePackages: 2,
    performedTransfers: 1,
    applicationBlocker: 'BLOCKED_BY_DOMAIN_VALIDATION_APPROVAL_AND_REMEDIATION_POLICY',
}

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['compliance:read'],
    }))
    useCorrectionsQuery.mockReturnValue(query({
        pages: [{ items: [correction, rejectedWithoutVersion], page: 0, size: 20 }],
    }))
    useCorrectionDetailQuery.mockReturnValue(query(correction))
    useCorrectionImpactQuery.mockReturnValue(query(impact))
})

afterEach(() => jest.clearAllMocks())

describe('M7C1 Correction screens', () => {
    test('preserves backend list order and navigates with correctionId only', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<CorrectionList navigation={navigation} />)
        const rows = screen.getAllByRole('button')

        expect(rows[0].props.accessibilityLabel).toContain('correction-a')
        expect(rows[1].props.accessibilityLabel).toContain('correction-b')
        fireEvent.press(screen.getByLabelText(
            'Solicitação correction-a, tipo MATING, status Solicitação registrada'
        ))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'CorrectionDetail',
            { correctionId: 'correction-a' }
        )
        expect(useCorrectionsQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a', enabled: true,
        })
    })

    test('requires only compliance:read and does not require correction or master-data writes', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['compliance:read'],
        }))
        const screen = render(
            <CorrectionList navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.getByText('MATING')).toBeTruthy()
        expect(screen.queryByText('Rejeitar solicitação')).toBeNull()
        expect(screen.queryByText('Aplicar')).toBeNull()
    })

    test('does not call Correction endpoints without compliance:read', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['lineage:correct', 'master-data:read'],
        }))
        render(<CorrectionList navigation={{ navigate: jest.fn() }} />)

        expect(useCorrectionsQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a', enabled: false,
        })
    })

    test('shows only public detail fields and read-only historical semantics', () => {
        const screen = render(
            <CorrectionDetail route={{ params: { correctionId: 'correction-a' } }} />
        )

        expect(screen.getByText('Revisar origem histórica')).toBeTruthy()
        expect(screen.getByText(/"semenBatchId": "batch-a"/)).toBeTruthy()
        expect(screen.getByText('semântica histórica sem JSON')).toBeTruthy()
        expect(screen.getAllByText('Solicitação registrada')).toHaveLength(2)
        expect(screen.getByText('Código retornado: REQUESTED')).toBeTruthy()
        expect(screen.queryByText(/requestedBy/i)).toBeNull()
        expect(screen.queryByText(/sourceDocumentId/i)).toBeNull()
        expect(screen.queryByText(/reviewer/i)).toBeNull()
        expect(screen.queryByText(/reviewedAt/i)).toBeNull()
    })

    test('accepts nullable subject version without rendering zero or an error', () => {
        useCorrectionDetailQuery.mockReturnValue(query(rejectedWithoutVersion))
        const screen = render(
            <CorrectionDetail route={{ params: { correctionId: 'correction-b' } }} />
        )

        expect(screen.queryByText('Versão do subject')).toBeNull()
        expect(screen.getByText('Rejeitada')).toBeTruthy()
    })

    test('labels impact as current and never infers application or rejection', () => {
        const screen = render(
            <CorrectionDetail route={{ params: { correctionId: 'correction-a' } }} />
        )

        expect(screen.getByText('Impacto atual')).toBeTruthy()
        expect(screen.getByText('4')).toBeTruthy()
        expect(screen.getByText('2')).toBeTruthy()
        expect(screen.getByText('1')).toBeTruthy()
        expect(screen.getByText(impact.applicationBlocker)).toBeTruthy()
        expect(screen.getByText(
            'Este código não significa que a solicitação foi rejeitada ou falhou.'
        )).toBeTruthy()
        expect(screen.queryByText('Falhou')).toBeNull()
        expect(screen.queryByText('Aplicada')).toBeNull()
    })

    test('presents structured wrong-tenant not found and accessible retry', () => {
        useCorrectionDetailQuery.mockReturnValue({
            ...query(undefined),
            error: {
                kind: 'not_found', code: 'CORRECTION_SUBJECT_NOT_FOUND',
            },
            isSuccess: false,
        })
        const screen = render(
            <CorrectionDetail route={{ params: { correctionId: 'correction-a' } }} />
        )

        expect(screen.getByText(
            'Solicitação de correção não encontrada nesta organização.'
        )).toBeTruthy()
        expect(screen.getByLabelText('Tentar novamente')).toBeTruthy()
    })

    test('keeps impact failure independent and offers an accessible retry', () => {
        const impactRefetch = jest.fn()
        useCorrectionImpactQuery.mockReturnValue({
            ...query(undefined),
            error: { kind: 'network' },
            isSuccess: false,
            refetch: impactRefetch,
        })
        const screen = render(
            <CorrectionDetail route={{ params: { correctionId: 'correction-a' } }} />
        )

        fireEvent.press(screen.getByLabelText(
            'Tentar carregar impacto atual novamente'
        ))
        expect(impactRefetch).toHaveBeenCalledTimes(1)
    })
})
