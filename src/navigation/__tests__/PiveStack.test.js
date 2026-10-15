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

jest.mock('../../screens/Pive', () => function MockPive({
    showTargetOpu,
    showTargetTransfers,
    showTargetInventory,
    showTargetDocuments,
    showTargetCorrections,
}) {
    const { Text } = require('react-native')

    return (
        <>
            <Text>{showTargetOpu ? 'target-opu-entry' : 'legacy-pive-only'}</Text>
            <Text>{showTargetTransfers ? 'target-transfer-entry' : 'no-target-transfer'}</Text>
            <Text>{showTargetInventory ? 'target-inventory-entry' : 'no-target-inventory'}</Text>
            <Text>{showTargetDocuments ? 'target-documents-entry' : 'no-target-documents'}</Text>
            <Text>{showTargetCorrections ? 'target-corrections-entry' : 'no-target-corrections'}</Text>
        </>
    )
})

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
})

describe('PiveStack target OPU coexistence', () => {
    test('preserves legacy routes and registers stable target OPU routes', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: {
                permissions: [
                    'opu:read',
                    'transfer:read',
                    'inventory:read',
                    'documents:read',
                    'compliance:read',
                ],
            },
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
        expect(screen.getByText('EmbryoList')).toBeTruthy()
        expect(screen.getByText('EmbryoBatchIdentify')).toBeTruthy()
        expect(screen.getByText('EmbryoDetail')).toBeTruthy()
        expect(screen.getByText('target-transfer-entry')).toBeTruthy()
        expect(screen.getByText('RecipientCycleList')).toBeTruthy()
        expect(screen.getByText('RecipientCycleCreate')).toBeTruthy()
        expect(screen.getByText('RecipientCycleDetail')).toBeTruthy()
        expect(screen.getByText('TransferDetail')).toBeTruthy()
        expect(screen.getByText('PregnancyFollowUps')).toBeTruthy()
        expect(screen.getByText('PregnancyCheckCapture')).toBeTruthy()
        expect(screen.getByText('target-inventory-entry')).toBeTruthy()
        expect(screen.getByText('CryoInventoryList')).toBeTruthy()
        expect(screen.getByText('EmbryoPackageDetail')).toBeTruthy()
        expect(screen.getByText('InventoryMovementHistory')).toBeTruthy()
        expect(screen.getByText('InventoryMovementCreate')).toBeTruthy()
        expect(screen.getByText('StorageLocationDetail')).toBeTruthy()
        expect(screen.getByText('target-documents-entry')).toBeTruthy()
        expect(screen.getByText('DocumentList')).toBeTruthy()
        expect(screen.getByText('DocumentDetail')).toBeTruthy()
        expect(screen.getByText('target-corrections-entry')).toBeTruthy()
        expect(screen.getByText('CorrectionList')).toBeTruthy()
        expect(screen.getByText('CorrectionDetail')).toBeTruthy()
    })

    test('does not treat opu:write as read access', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['opu:write'] },
            isSuccess: true,
        })

        expect(render(<PiveStack />).getByText('legacy-pive-only')).toBeTruthy()
        expect(render(<PiveStack />).getByText('no-target-transfer')).toBeTruthy()
        expect(render(<PiveStack />).getByText('no-target-inventory')).toBeTruthy()
        expect(render(<PiveStack />).getByText('no-target-documents')).toBeTruthy()
        expect(render(<PiveStack />).getByText('no-target-corrections')).toBeTruthy()
    })

    test('does not require write or compliance permissions for Documents', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['documents:read'] },
            isSuccess: true,
        })

        expect(render(<PiveStack />).getByText('target-documents-entry'))
            .toBeTruthy()
    })

    test('does not require lineage or master-data permissions for Corrections', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['compliance:read'] },
            isSuccess: true,
        })

        expect(render(<PiveStack />).getByText('target-corrections-entry'))
            .toBeTruthy()
    })

    test('does not treat lineage:correct as Correction read access', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['lineage:correct'] },
            isSuccess: true,
        })

        expect(render(<PiveStack />).getByText('no-target-corrections'))
            .toBeTruthy()
    })
})
