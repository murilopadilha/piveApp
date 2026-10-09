import { render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../features/auth/hooks/useIdentityQueries'
import { useOrganization } from '../../features/organizations/OrganizationContext'
import PiveStack from '../PiveStack'

jest.mock('@react-navigation/stack', () => ({
    createStackNavigator: () => ({
        Navigator: ({ children }) => children,
        Screen: ({ children, name }) => {
            const { Text, View } = require('react-native')

            return (
                <View>
                    <Text>{name}</Text>
                    {typeof children === 'function'
                        ? children({ navigation: { navigate: jest.fn() } })
                        : null}
                </View>
            )
        },
    }),
}))

jest.mock('../../features/auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))

jest.mock('../../features/organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))

jest.mock('../../screens/Pive', () => function MockPive({ showTargetOpu }) {
    const { Text } = require('react-native')

    return <Text>{showTargetOpu ? 'target-opu-entry' : 'legacy-pive-only'}</Text>
})

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
})

describe('PiveStack target OPU coexistence', () => {
    test('preserves legacy routes and registers stable target OPU routes', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['opu:read'] },
            isSuccess: true,
        })

        const screen = render(<PiveStack />)

        expect(screen.getByText('target-opu-entry')).toBeTruthy()
        expect(screen.getByText('FivInfo')).toBeTruthy()
        expect(screen.getByText('ColetaOocitos')).toBeTruthy()
        expect(screen.getByText('OpuSessionList')).toBeTruthy()
        expect(screen.getByText('OpuSessionDetail')).toBeTruthy()
        expect(screen.getByText('OocyteCollectionDetail')).toBeTruthy()
        expect(screen.getByText('OpuSessionCreate')).toBeTruthy()
        expect(screen.getByText('OpuCollectionBatch')).toBeTruthy()
        expect(screen.getByText('MatingList')).toBeTruthy()
        expect(screen.getByText('MatingBatchCreate')).toBeTruthy()
        expect(screen.getByText('MatingDetail')).toBeTruthy()
        expect(screen.getByText('SemenBatchSearch')).toBeTruthy()
        expect(screen.getByText('SemenBatchDetail')).toBeTruthy()
    })

    test('does not treat opu:write as read access', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['opu:write'] },
            isSuccess: true,
        })

        expect(render(<PiveStack />).getByText('legacy-pive-only')).toBeTruthy()
    })
})
