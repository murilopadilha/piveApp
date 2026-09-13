import { fireEvent, render } from '@testing-library/react-native'

import EmbryoDispositionForm from '../EmbryoDispositionForm'

jest.mock('@expo/vector-icons/MaterialIcons', () => () => null)

describe('EmbryoDispositionForm', () => {
    test('presents the controlled value and forwards input changes', () => {
        const onChange = jest.fn()
        const { getByDisplayValue, getByPlaceholderText } = render(
            <EmbryoDispositionForm
                label="Embriões congelados:"
                placeholder="Quantidade de embriões congelados"
                value="4"
                isSubmitting={false}
                onChange={onChange}
                onSave={jest.fn()}
            />
        )

        expect(getByDisplayValue('4')).toBeTruthy()
        fireEvent.changeText(
            getByPlaceholderText('Quantidade de embriões congelados'),
            '5'
        )
        expect(onChange).toHaveBeenCalledWith('5')
    })

    test('emits save when enabled', () => {
        const onSave = jest.fn()
        const { getByText } = render(
            <EmbryoDispositionForm
                label="Embriões descartados:"
                placeholder="Quantidade de embriões descartados"
                value="2"
                isSubmitting={false}
                onChange={jest.fn()}
                onSave={onSave}
            />
        )

        fireEvent.press(getByText('Salvar'))
        expect(onSave).toHaveBeenCalledTimes(1)
    })

    test('does not emit save while submitting', () => {
        const onSave = jest.fn()
        const { getByText } = render(
            <EmbryoDispositionForm
                label="Embriões congelados:"
                placeholder="Quantidade de embriões congelados"
                value="2"
                isSubmitting
                onChange={jest.fn()}
                onSave={onSave}
            />
        )

        fireEvent.press(getByText('Salvar'))
        expect(onSave).not.toHaveBeenCalled()
    })
})
