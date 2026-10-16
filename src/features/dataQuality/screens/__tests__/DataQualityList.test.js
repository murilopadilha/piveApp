import { act, fireEvent, render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import { useDataQualityIssuesQuery } from '../../hooks/useDataQualityQueries'
import DataQualityList from '../DataQualityList'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useDataQualityQueries', () => ({
    useDataQualityIssuesQuery: jest.fn(),
}))

const context = permissions => ({
    data: { permissions },
    error: null,
    isPending: false,
    isSuccess: true,
    refetch: jest.fn(),
})

const issuesQuery = items => ({
    data: { pages: [{ items, page: 0, size: 20 }] },
    error: null,
    isPending: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
})

const embryoIssue = {
    subjectType: 'EMBRYO',
    subjectId: 'embryo-a',
    code: 'ASSESSMENT_NOT_RECORDED',
    severity: 'INFO',
}

const packageIssue = {
    subjectType: 'PACKAGE',
    subjectId: 'package-a',
    code: 'INVENTORY_PROJECTION_MISMATCH',
    severity: 'ERROR',
}

beforeEach(() => {
    jest.useFakeTimers()
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(context([
        'embryology:read',
        'inventory:read',
    ]))
    useDataQualityIssuesQuery.mockReturnValue(
        issuesQuery([embryoIssue, packageIssue])
    )
})

afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
})

describe('M9A DataQualityList', () => {
    test('renders backend order and factual issue semantics accessibly', () => {
        const screen = render(<DataQualityList />)
        const codes = screen.getAllByText(
            /ASSESSMENT_NOT_RECORDED|INVENTORY_PROJECTION_MISMATCH/
        )

        expect(codes[0].props.children).toBe('ASSESSMENT_NOT_RECORDED')
        expect(codes[1].props.children).toBe('INVENTORY_PROJECTION_MISMATCH')
        expect(screen.getByText('INFO')).toBeTruthy()
        expect(screen.getByText('ERROR')).toBeTruthy()
        expect(screen.getByLabelText(
            /Issue de qualidade.*EMBRYO.*embryo-a.*ASSESSMENT_NOT_RECORDED.*INFO/
        )).toBeTruthy()
        expect(screen.queryByText('Prioridade')).toBeNull()
        expect(screen.queryByText('Compliance')).toBeNull()
        expect(screen.queryByText('Resolver')).toBeNull()
    })

    test('debounces trimmed backend search and offers accessible clear', () => {
        const screen = render(<DataQualityList />)
        const input = screen.getByLabelText('Buscar issues de qualidade de dados')

        expect(input.props.maxLength).toBe(200)
        fireEvent.changeText(input, ' ERROR ')
        expect(useDataQualityIssuesQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a', query: '', enabled: true,
        })
        act(() => jest.advanceTimersByTime(500))
        expect(useDataQualityIssuesQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a', query: 'ERROR', enabled: true,
        })

        fireEvent.press(screen.getByLabelText(
            'Limpar busca de qualidade de dados'
        ))
        act(() => jest.advanceTimersByTime(500))
        expect(useDataQualityIssuesQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a', query: '', enabled: true,
        })
    })

    test.each([
        { permissions: ['embryology:read'] },
        { permissions: ['inventory:read'] },
        { permissions: [] },
    ])('disables the API when cumulative permissions are missing: $permissions', ({ permissions }) => {
        useEffectiveContextQuery.mockReturnValue(context(permissions))
        const screen = render(<DataQualityList />)

        expect(useDataQualityIssuesQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a', query: '', enabled: false,
        })
        expect(screen.getByText(
            'Você não tem as permissões necessárias para consultar qualidade de dados.'
        )).toBeTruthy()
    })

    test('degrades safely for future values without creating navigation', () => {
        const navigation = { navigate: jest.fn() }
        useDataQualityIssuesQuery.mockReturnValue(issuesQuery([{
            subjectType: 'FUTURE_SUBJECT',
            subjectId: 'future-a',
            code: 'FUTURE_SIGNAL',
            severity: 'NOTICE',
        }]))
        const screen = render(<DataQualityList navigation={navigation} />)

        expect(screen.getByText('FUTURE_SUBJECT')).toBeTruthy()
        expect(screen.getByText('FUTURE_SIGNAL')).toBeTruthy()
        expect(screen.getByText('NOTICE')).toBeTruthy()
        expect(navigation.navigate).not.toHaveBeenCalled()
    })

    test('uses a projection-scoped empty message without global claims', () => {
        useDataQualityIssuesQuery.mockReturnValue(issuesQuery([]))
        const screen = render(<DataQualityList />)

        expect(screen.getByText(
            'Nenhum issue foi retornado pela projeção atual de qualidade de dados.'
        )).toBeTruthy()
        expect(screen.queryByText(/todos os dados são perfeitos/i)).toBeNull()
        expect(screen.queryByText(/sistema compliant/i)).toBeNull()
    })

    test('clears search state when the active Organization changes', () => {
        const screen = render(<DataQualityList />)
        const input = screen.getByLabelText('Buscar issues de qualidade de dados')

        fireEvent.changeText(input, 'package-a')
        act(() => jest.advanceTimersByTime(500))
        expect(useDataQualityIssuesQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-a',
            query: 'package-a',
            enabled: true,
        })

        useOrganization.mockReturnValue({ activeOrganizationId: 'organization-b' })
        screen.rerender(<DataQualityList />)
        expect(screen.getByLabelText(
            'Buscar issues de qualidade de dados'
        ).props.value).toBe('')
        expect(useDataQualityIssuesQuery).toHaveBeenLastCalledWith({
            organizationId: 'organization-b',
            query: '',
            enabled: true,
        })
    })
})
