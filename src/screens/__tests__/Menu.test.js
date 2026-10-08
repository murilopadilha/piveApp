import { fireEvent, render } from '@testing-library/react-native'

import Menu from '../Menu'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => function MockIcon() {
    return null
})

describe('Animals menu migration entry', () => {
    test('keeps legacy workflows available and hides target access without permission', () => {
        const screen = render(
            <Menu
                navigation={{ navigate: jest.fn() }}
                showCanonicalDirectory={false}
            />
        )

        expect(screen.getByText('Cadastrar Receptora')).toBeTruthy()
        expect(screen.getByText('Doadoras Cadastradas')).toBeTruthy()
        expect(screen.queryByText('Diretório de Animais')).toBeNull()
    })

    test('opens the canonical directory without replacing legacy navigation', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(
            <Menu
                navigation={navigation}
                showCanonicalDirectory
            />
        )

        fireEvent.press(screen.getByLabelText('Abrir diretório de animais'))

        expect(navigation.navigate).toHaveBeenCalledWith('AnimalDirectory')
        expect(screen.getByText('Cadastrar Doadora')).toBeTruthy()
        expect(screen.getByText('Touros Cadastrados')).toBeTruthy()
    })
})
