import { render } from '@testing-library/react-native'

import {
    SESSION_STATUS,
    useSession,
} from '../../features/auth/SessionContext'
import useAuthenticatedOrganization from '../../features/organizations/hooks/useAuthenticatedOrganization'
import RootNavigator from '../RootNavigator'

jest.mock('../../features/auth/SessionContext', () => ({
    ...jest.requireActual('../../features/auth/SessionContext'),
    useSession: jest.fn(),
}))

jest.mock('../../features/organizations/hooks/useAuthenticatedOrganization', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('../RootTabs', () => function MockRootTabs({ showClients }) {
    const { Text } = require('react-native')

    return <Text>{showClients ? 'clients-enabled' : 'legacy-only'}</Text>
})

describe('RootNavigator target gate', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useSession.mockReturnValue({
            status: SESSION_STATUS.AUTHENTICATED_READY,
            logout: jest.fn(),
        })
    })

    test('shows real sign in when there is no authenticated session', () => {
        useSession.mockReturnValue({
            status: SESSION_STATUS.EXPIRED,
            authError: null,
            isAuthenticating: false,
            signIn: jest.fn(),
        })
        useAuthenticatedOrganization.mockReturnValue({
            activeOrganizationId: null,
            effectiveContext: null,
            isReady: false,
        })

        expect(render(<RootNavigator />).getByText('Entrar')).toBeTruthy()
        expect(useAuthenticatedOrganization).not.toHaveBeenCalled()
    })

    test('keeps all navigation hidden while a secure session is restored', () => {
        useSession.mockReturnValue({
            status: SESSION_STATUS.RESTORING,
        })
        useAuthenticatedOrganization.mockReturnValue({ isReady: false })

        expect(render(<RootNavigator />).getByText(
            'Restaurando sessão…'
        )).toBeTruthy()
        expect(useAuthenticatedOrganization).not.toHaveBeenCalled()
    })

    test('enables Client navigation only with effective list permission', () => {
        useAuthenticatedOrganization.mockReturnValue({
            activeOrganizationId: 'organization-a',
            effectiveContext: {
                permissions: ['master-data:read'],
            },
            isReady: true,
        })

        expect(render(<RootNavigator />).getByText('clients-enabled')).toBeTruthy()
    })

    test('does not treat detail permission as list permission', () => {
        useAuthenticatedOrganization.mockReturnValue({
            activeOrganizationId: 'organization-a',
            effectiveContext: {
                permissions: ['client:read'],
            },
            isReady: true,
        })

        expect(render(<RootNavigator />).getByText('legacy-only')).toBeTruthy()
    })
})
