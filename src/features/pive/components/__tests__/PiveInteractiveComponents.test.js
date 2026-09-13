import { fireEvent, render } from '@testing-library/react-native'

import CultivationDraftForm from '../CultivationDraftForm'
import EmbryoTransferActions from '../EmbryoTransferActions'
import EmbryoTransferSelectors from '../EmbryoTransferSelectors'
import PiveFilterControls from '../PiveFilterControls'

jest.mock('@expo/vector-icons/FontAwesome6', () => () => null)
jest.mock('@expo/vector-icons/MaterialIcons', () => () => null)
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
    const React = require('react')
    const { Text } = require('react-native')
    return props => React.createElement(Text, { testID: `icon-${props.name}` }, props.name)
})
jest.mock('react-native-dropdown-select-list', () => {
    const React = require('react')
    const { Text, TouchableOpacity } = require('react-native')

    return {
        SelectList: ({ data, placeholder, setSelected }) => React.createElement(
            TouchableOpacity,
            {
                testID: `select-${placeholder}`,
                onPress: () => setSelected(data[0]?.key),
            },
            React.createElement(Text, null, placeholder)
        ),
    }
})

describe('CultivationDraftForm', () => {
    test('normalizes an absent value and forwards edits', () => {
        const onChange = jest.fn()
        const { getByPlaceholderText } = render(
            <CultivationDraftForm
                value={undefined}
                isSubmitting={false}
                onChange={onChange}
                onSave={jest.fn()}
            />
        )
        const input = getByPlaceholderText('Digite o total de embriões')

        expect(input.props.value).toBe('')
        fireEvent.changeText(input, '12')
        expect(onChange).toHaveBeenCalledWith('12')
    })

    test('preserves zero and disables save during submission', () => {
        const onSave = jest.fn()
        const { getByDisplayValue, getByText } = render(
            <CultivationDraftForm
                value={0}
                isSubmitting
                onChange={jest.fn()}
                onSave={onSave}
            />
        )

        expect(getByDisplayValue('0')).toBeTruthy()
        fireEvent.press(getByText('Salvar'))
        expect(onSave).not.toHaveBeenCalled()
    })
})

describe('EmbryoTransferSelectors', () => {
    test('forwards the selected transfer and recipient keys', () => {
        const onTransferSelect = jest.fn()
        const onRecipientSelect = jest.fn()
        const { getByTestId } = render(
            <EmbryoTransferSelectors
                transferOptions={[{ key: '7', value: 'Transferência' }]}
                recipientOptions={[{ key: '8', value: 'Receptora' }]}
                showNoTransfers={false}
                showNoRecipients={false}
                onTransferSelect={onTransferSelect}
                onRecipientSelect={onRecipientSelect}
            />
        )

        fireEvent.press(getByTestId('select-Selecione uma transferência'))
        fireEvent.press(getByTestId('select-Selecione uma receptora'))
        expect(onTransferSelect).toHaveBeenCalledWith('7')
        expect(onRecipientSelect).toHaveBeenCalledWith('8')
    })

    test('renders independently decided empty messages', () => {
        const { getByText, queryByText } = render(
            <EmbryoTransferSelectors
                transferOptions={[]}
                recipientOptions={[]}
                showNoTransfers
                showNoRecipients={false}
                onTransferSelect={jest.fn()}
                onRecipientSelect={jest.fn()}
            />
        )

        expect(getByText('Nenhuma transferência encontrada.')).toBeTruthy()
        expect(queryByText('Nenhuma receptora disponível.')).toBeNull()
    })
})

describe('EmbryoTransferActions', () => {
    test('emits both enabled actions', () => {
        const onViewTransfers = jest.fn()
        const onSubmit = jest.fn()
        const { getByText } = render(
            <EmbryoTransferActions
                isSubmitting={false}
                onViewTransfers={onViewTransfers}
                onSubmit={onSubmit}
            />
        )

        fireEvent.press(getByText('Transferências'))
        fireEvent.press(getByText('Salvar'))
        expect(onViewTransfers).toHaveBeenCalledTimes(1)
        expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    test('keeps navigation available while only submit is disabled', () => {
        const onViewTransfers = jest.fn()
        const onSubmit = jest.fn()
        const { getByText } = render(
            <EmbryoTransferActions
                isSubmitting
                onViewTransfers={onViewTransfers}
                onSubmit={onSubmit}
            />
        )

        fireEvent.press(getByText('Transferências'))
        fireEvent.press(getByText('Salvar'))
        expect(onViewTransfers).toHaveBeenCalledTimes(1)
        expect(onSubmit).not.toHaveBeenCalled()
    })
})

describe('PiveFilterControls', () => {
    const requiredProps = {
        primaryOptions: [{ key: 'ALL', value: 'Todas' }],
        icon: 'cow',
        onPrimarySelect: jest.fn(),
        onToggleCatalog: jest.fn(),
        secondaryCategory: null,
        secondaryOptions: [],
        secondaryPlaceholder: 'Selecione uma opção',
        onSecondarySelect: jest.fn(),
        secondaryOptionsLoading: false,
        secondaryOptionsError: null,
        hasLoadedSecondaryOptions: false,
    }

    test('emits primary selection and catalog toggle without deciding filter rules', () => {
        const onPrimarySelect = jest.fn()
        const onToggleCatalog = jest.fn()
        const { getByTestId } = render(
            <PiveFilterControls
                {...requiredProps}
                onPrimarySelect={onPrimarySelect}
                onToggleCatalog={onToggleCatalog}
            />
        )

        fireEvent.press(getByTestId('select-Selecione a opção para filtrar'))
        fireEvent.press(getByTestId('icon-cow'))
        expect(onPrimarySelect).toHaveBeenCalledWith('ALL')
        expect(onToggleCatalog).toHaveBeenCalledTimes(1)
    })

    test('shows and forwards the secondary selector only for an active category', () => {
        const onSecondarySelect = jest.fn()
        const { getByTestId } = render(
            <PiveFilterControls
                {...requiredProps}
                secondaryCategory="donor"
                secondaryOptions={[{ key: '9', value: 'Doadora' }]}
                secondaryPlaceholder="Selecione uma doadora"
                onSecondarySelect={onSecondarySelect}
            />
        )

        fireEvent.press(getByTestId('select-Selecione uma doadora'))
        expect(onSecondarySelect).toHaveBeenCalledWith('9')
    })

    test('keeps secondary error and empty states mutually controlled by props', () => {
        const { getByText, queryByText } = render(
            <PiveFilterControls
                {...requiredProps}
                secondaryCategory="bull"
                secondaryOptionsError="Falha nas opções"
                hasLoadedSecondaryOptions
            />
        )

        expect(getByText('Falha nas opções')).toBeTruthy()
        expect(queryByText('Nenhuma opção encontrada.')).toBeNull()
    })
})
