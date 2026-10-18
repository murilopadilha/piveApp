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
    showTargetDataQuality,
    showTargetShipments,
    showTargetRecalls,
}) {
    const { Text } = require('react-native')

    return (
        <>
            <Text>{showTargetOpu ? 'target-opu-entry' : 'legacy-pive-only'}</Text>
            <Text>{showTargetTransfers ? 'target-transfer-entry' : 'no-target-transfer'}</Text>
            <Text>{showTargetInventory ? 'target-inventory-entry' : 'no-target-inventory'}</Text>
            <Text>{showTargetDocuments ? 'target-documents-entry' : 'no-target-documents'}</Text>
            <Text>{showTargetCorrections ? 'target-corrections-entry' : 'no-target-corrections'}</Text>
            <Text>{showTargetDataQuality ? 'target-data-quality-entry' : 'no-target-data-quality'}</Text>
            <Text>{showTargetShipments ? 'target-shipments-entry' : 'no-target-shipments'}</Text>
            <Text>{showTargetRecalls ? 'target-recalls-entry' : 'no-target-recalls'}</Text>
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
                    'embryology:read',
                    'documents:read',
                    'compliance:read',
                    'shipment:read',
                    'recall:read',
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
        expect(screen.getByText('target-data-quality-entry')).toBeTruthy()
        expect(screen.getByText('DataQualityList')).toBeTruthy()
        expect(screen.getByText('target-shipments-entry')).toBeTruthy()
        expect(screen.getByText('ShipmentList')).toBeTruthy()
        expect(screen.getByText('ShipmentDetail')).toBeTruthy()
        expect(screen.getByText('target-recalls-entry')).toBeTruthy()
        expect(screen.getByText('RecallList')).toBeTruthy()
        expect(screen.getByText('RecallDetail')).toBeTruthy()
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
        expect(render(<PiveStack />).getByText('no-target-data-quality')).toBeTruthy()
        expect(render(<PiveStack />).getByText('no-target-shipments')).toBeTruthy()
        expect(render(<PiveStack />).getByText('no-target-recalls')).toBeTruthy()
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

    test('gates Shipment and Recall entry points independently', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['shipment:read'] },
            isSuccess: true,
        })
        let screen = render(<PiveStack />)
        expect(screen.getByText('target-shipments-entry')).toBeTruthy()
        expect(screen.getByText('no-target-recalls')).toBeTruthy()

        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['recall:read'] },
            isSuccess: true,
        })
        screen = render(<PiveStack />)
        expect(screen.getByText('no-target-shipments')).toBeTruthy()
        expect(screen.getByText('target-recalls-entry')).toBeTruthy()
    })

    test('gates Data Quality cumulatively without changing Inventory access', () => {
        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['inventory:read'] },
            isSuccess: true,
        })
        let screen = render(<PiveStack />)
        expect(screen.getByText('target-inventory-entry')).toBeTruthy()
        expect(screen.getByText('no-target-data-quality')).toBeTruthy()

        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['embryology:read'] },
            isSuccess: true,
        })
        screen = render(<PiveStack />)
        expect(screen.getByText('no-target-inventory')).toBeTruthy()
        expect(screen.getByText('no-target-data-quality')).toBeTruthy()

        useEffectiveContextQuery.mockReturnValue({
            data: { permissions: ['embryology:read', 'inventory:read'] },
            isSuccess: true,
        })
        screen = render(<PiveStack />)
        expect(screen.getByText('target-data-quality-entry')).toBeTruthy()
    })
})
