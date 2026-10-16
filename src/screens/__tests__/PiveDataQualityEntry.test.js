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
