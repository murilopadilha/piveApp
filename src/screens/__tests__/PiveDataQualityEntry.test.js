import { fireEvent, render } from '@testing-library/react-native'

import usePiveListData from '../../features/pive/hooks/usePiveListData'
import Pive from '../Pive'

jest.mock('../../features/pive/hooks/usePiveListData', () => jest.fn())
jest.mock('../../features/pive/components/PiveFilterControls', () => () => null)
jest.mock('../../features/pive/components/PiveListItem', () => () => null)

beforeEach(() => {
    usePiveListData.mockReturnValue({
        visibleItems: [],
        secondaryOptions: [],
        loading: false,
        loadError: null,
        hasLoaded: true,
        secondaryOptionsLoading: false,
        secondaryOptionsError: null,
        hasLoadedSecondaryOptions: true,
        filteredFivsLoading: false,
        filteredFivsError: null,
        hasLoadedFilteredFivs: true,
        onPrimaryFilterChange: jest.fn(),
        onSelectedAnimalChange: jest.fn(),
        onFilterCatalogModeChange: jest.fn(),
    })
})

afterEach(() => jest.clearAllMocks())

describe('M9A PIVE entry point', () => {
    test('exposes the accessible contextual entry and navigates by route only', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <Pive navigation={navigation} showTargetDataQuality />
        )

        const entry = screen.getByLabelText('Abrir qualidade de dados')
        expect(entry.props.accessibilityHint).toBe(
            'Consulta issues derivados de Embryos e Packages'
        )
        fireEvent.press(entry)
        expect(navigation.navigate).toHaveBeenCalledWith('DataQualityList')
    })

    test('does not expose the entry when the cumulative gate is false', () => {
        const screen = render(
            <Pive navigation={{ navigate: jest.fn() }} />
        )

        expect(screen.queryByLabelText('Abrir qualidade de dados')).toBeNull()
    })
})

describe('M9B PIVE discovery hardening', () => {
    test('groups target capabilities separately from the legacy FIV flow', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <Pive
                navigation={navigation}
                showTargetCorrections
                showTargetDataQuality
                showTargetDocuments
                showTargetInventory
                showTargetOpu
                showTargetRecalls
                showTargetShipments
                showTargetTransfers
            />
        )

        expect(screen.getByText('Operações PIVE').props.accessibilityRole)
            .toBe('header')
        expect(screen.getByText('Produção FIV').props.accessibilityRole)
            .toBe('header')
        expect(screen.getByText('Documentos')).toBeTruthy()
        expect(screen.getByText('Distribuição')).toBeTruthy()
        expect(screen.getByLabelText('Diretórios operacionais PIVE').props.horizontal)
            .toBe(true)
    })

    test('keeps routes stable and exposes accessible legacy controls', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <Pive navigation={navigation} showTargetDocuments showTargetShipments />
        )

        fireEvent.press(screen.getByLabelText('Abrir diretório de documentos'))
        fireEvent.press(screen.getByLabelText('Abrir distribuição'))
        fireEvent.press(screen.getByLabelText('Criar nova FIV'))

        expect(navigation.navigate.mock.calls).toEqual([
            ['DocumentList'],
            ['ShipmentList'],
            ['Cabecalho'],
        ])
    })
})
