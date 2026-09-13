import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

import useDiscardedEmbryoSubmission from '../../../features/pive/hooks/useDiscardedEmbryoSubmission'
import useEmbryoProductionContext from '../../../features/pive/hooks/useEmbryoProductionContext'
import useFrozenEmbryoSubmission from '../../../features/pive/hooks/useFrozenEmbryoSubmission'
import Congelados from '../Congelados'
import Descartados from '../Descartados'

jest.mock('@expo/vector-icons/AntDesign', () => () => null)
jest.mock('@expo/vector-icons/MaterialIcons', () => () => null)
jest.mock('../../../features/pive/hooks/useEmbryoProductionContext')
jest.mock('../../../features/pive/hooks/useFrozenEmbryoSubmission')
jest.mock('../../../features/pive/hooks/useDiscardedEmbryoSubmission')

const route = { params: { id: 10 } }
const navigation = { goBack: jest.fn() }
const submitFrozenEmbryos = jest.fn()
const submitDiscardedEmbryos = jest.fn()

beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    useEmbryoProductionContext.mockReturnValue({
        productionId: 20,
        loadedCollectionId: 10,
        loading: false,
        error: null,
        hasLoaded: true,
    })
    useFrozenEmbryoSubmission.mockReturnValue({
        isSubmitting: false,
        submitFrozenEmbryos,
    })
    useDiscardedEmbryoSubmission.mockReturnValue({
        isSubmitting: false,
        submitDiscardedEmbryos,
    })
    submitFrozenEmbryos.mockResolvedValue(undefined)
    submitDiscardedEmbryos.mockResolvedValue(undefined)
})

describe('embryo disposition numeric parsing', () => {
    test('Congelados rejects partially numeric input', () => {
        const { getByPlaceholderText, getByText } = render(
            <Congelados route={route} navigation={navigation} />
        )

        fireEvent.changeText(
            getByPlaceholderText('Quantidade de embriões congelados'),
            '12abc'
        )
        fireEvent.press(getByText('Salvar'))

        expect(submitFrozenEmbryos).not.toHaveBeenCalled()
        expect(Alert.alert).toHaveBeenCalledWith(
            'Erro',
            'Por favor, preencha todos os campos.'
        )
    })

    test('Congelados preserves zero as a numeric payload value', async () => {
        const { getByPlaceholderText, getByText } = render(
            <Congelados route={route} navigation={navigation} />
        )

        fireEvent.changeText(
            getByPlaceholderText('Quantidade de embriões congelados'),
            '0'
        )
        fireEvent.press(getByText('Salvar'))

        await waitFor(() => expect(submitFrozenEmbryos).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: {
                    productionId: 20,
                    embryosQuantity: 0,
                },
                submittedCollectionId: 10,
            })
        ))
    })

    test('Descartados rejects partially numeric input', () => {
        const { getByPlaceholderText, getByText } = render(
            <Descartados route={route} navigation={navigation} />
        )

        fireEvent.changeText(
            getByPlaceholderText('Quantidade de embriões descartados'),
            '12abc'
        )
        fireEvent.press(getByText('Salvar'))

        expect(submitDiscardedEmbryos).not.toHaveBeenCalled()
        expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Preencha todos os campos')
    })

    test('Descartados preserves zero as a numeric payload value', async () => {
        const { getByPlaceholderText, getByText } = render(
            <Descartados route={route} navigation={navigation} />
        )

        fireEvent.changeText(
            getByPlaceholderText('Quantidade de embriões descartados'),
            '0'
        )
        fireEvent.press(getByText('Salvar'))

        await waitFor(() => expect(submitDiscardedEmbryos).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: {
                    productionId: 20,
                    embryosQuantity: 0,
                },
                submittedCollectionId: 10,
            })
        ))
    })
})
