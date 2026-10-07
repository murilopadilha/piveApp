import { render } from '@testing-library/react-native'

import useAuthenticatedOrganization from '../../features/organizations/hooks/useAuthenticatedOrganization'
import RootNavigator from '../RootNavigator'

jest.mock('../../features/organizations/hooks/useAuthenticatedOrganization', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('../RootTabs', () => function MockRootTabs({ showClients }) {
    const { Text } = require('react-native')

    return <Text>{showClients ? 'clients-enabled' : 'legacy-only'}</Text>
})

describe('RootNavigator target gate', () => {
    test('keeps legacy navigation available without an authenticated target context', () => {
        useAuthenticatedOrganization.mockReturnValue({
            activeOrganizationId: null,
            effectiveContext: null,
            isReady: false,
        })

        expect(render(<RootNavigator />).getByText('legacy-only')).toBeTruthy()
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
