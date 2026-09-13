import { act, renderHook, waitFor } from '@testing-library/react-native'

import { listBulls } from '../../../../api/bullService'
import { listDonors } from '../../../../api/donorService'
import {
    listFivs,
    listFivsByBull,
    listFivsByDonor,
} from '../../../../api/fivService'
import usePiveListData from '../usePiveListData'

jest.mock('@react-navigation/native', () => {
    const React = require('react')

    return {
        useFocusEffect: callback => React.useEffect(callback, [callback]),
    }
})

jest.mock('../../../../api/bullService', () => ({
    listBulls: jest.fn(),
}))

jest.mock('../../../../api/donorService', () => ({
    listDonors: jest.fn(),
}))

jest.mock('../../../../api/fivService', () => ({
    listFivs: jest.fn(),
    listFivsByBull: jest.fn(),
    listFivsByDonor: jest.fn(),
}))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise
    })
    return { promise, resolve }
}

const initialProps = {
    activeFilter: 'ALL',
    secondaryCategory: null,
    selectedAnimalId: null,
    onLoadError: jest.fn(),
}

const renderPiveData = (props = initialProps) => renderHook(
    currentProps => usePiveListData(currentProps),
    { initialProps: props }
)

beforeEach(() => {
    listFivs.mockResolvedValue([
        { id: 1, status: 'IN_PROCESS' },
        { id: 2, status: 'COMPLETED' },
        { id: 3, status: 'IN_PROCESS' },
    ])
    listDonors.mockResolvedValue([])
    listBulls.mockResolvedValue([])
    listFivsByDonor.mockResolvedValue([])
    listFivsByBull.mockResolvedValue([])
})

describe('usePiveListData filter results', () => {
    test('shows all FIVs for ALL and exact matches for a status', async () => {
        const { result, rerender } = renderPiveData()

        await waitFor(() => expect(result.current.hasLoaded).toBe(true))
        expect(result.current.visibleItems.map(item => item.id)).toEqual([1, 2, 3])

        rerender({
            ...initialProps,
            activeFilter: 'IN_PROCESS',
        })

        expect(result.current.visibleItems.map(item => item.id)).toEqual([1, 3])
        expect(listFivs).toHaveBeenCalledTimes(1)
    })

    test('keeps a status result when only the animal catalog is opened', async () => {
        const { result, rerender } = renderPiveData({
            ...initialProps,
            activeFilter: 'COMPLETED',
        })

        await waitFor(() => expect(result.current.hasLoaded).toBe(true))
        rerender({
            ...initialProps,
            activeFilter: 'COMPLETED',
            secondaryCategory: null,
        })

        expect(result.current.visibleItems.map(item => item.id)).toEqual([2])
        expect(listDonors).not.toHaveBeenCalled()
        expect(listBulls).not.toHaveBeenCalled()
        expect(listFivsByDonor).not.toHaveBeenCalled()
        expect(listFivsByBull).not.toHaveBeenCalled()
    })

    test('loads donor options, shows no FIV before an id, then shows remote results', async () => {
        listDonors.mockResolvedValue([
            { id: 7, name: 'Doadora A', registrationNumber: 'REG-7' },
        ])
        listFivsByDonor.mockResolvedValue([
            { id: 90, status: 'COMPLETED' },
            { id: 91, status: 'IN_PROCESS' },
        ])
        const { result, rerender } = renderPiveData()
        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        act(() => result.current.onPrimaryFilterChange('donor'))
        rerender({
            ...initialProps,
            activeFilter: 'donor',
            secondaryCategory: 'donor',
        })

        await waitFor(() => expect(result.current.hasLoadedSecondaryOptions).toBe(true))
        expect(result.current.secondaryOptions).toEqual([
            { key: '7', value: 'Doadora A (REG-7)' },
        ])
        expect(result.current.visibleItems).toEqual([])
        expect(listFivsByDonor).not.toHaveBeenCalled()

        act(() => result.current.onSelectedAnimalChange('7'))
        rerender({
            ...initialProps,
            activeFilter: 'donor',
            secondaryCategory: 'donor',
            selectedAnimalId: '7',
        })

        await waitFor(() => expect(result.current.hasLoadedFilteredFivs).toBe(true))
        expect(listFivsByDonor).toHaveBeenCalledWith('7', {
            signal: expect.anything(),
        })
        expect(result.current.visibleItems.map(item => item.id)).toEqual([90, 91])
    })

    test('rejects stale donor options after changing to bull', async () => {
        const donorRequest = deferred()
        listDonors.mockReturnValue(donorRequest.promise)
        listBulls.mockResolvedValue([
            { id: 8, name: 'Touro B', registrationNumber: 'REG-8' },
        ])
        const { result, rerender } = renderPiveData()
        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        act(() => result.current.onPrimaryFilterChange('donor'))
        rerender({
            ...initialProps,
            activeFilter: 'donor',
            secondaryCategory: 'donor',
        })
        act(() => result.current.onPrimaryFilterChange('bull'))
        rerender({
            ...initialProps,
            activeFilter: 'bull',
            secondaryCategory: 'bull',
        })

        await waitFor(() => expect(result.current.secondaryOptions).toEqual([
            { key: '8', value: 'Touro B (REG-8)' },
        ]))

        await act(async () => {
            donorRequest.resolve([
                { id: 7, name: 'Doadora A', registrationNumber: 'REG-7' },
            ])
            await donorRequest.promise
        })

        expect(result.current.secondaryOptions).toEqual([
            { key: '8', value: 'Touro B (REG-8)' },
        ])
    })

    test('does not let the main FIV response replace an active animal result', async () => {
        const mainRequest = deferred()
        listFivs.mockReturnValue(mainRequest.promise)
        listDonors.mockResolvedValue([
            { id: 7, name: 'Doadora A', registrationNumber: 'REG-7' },
        ])
        listFivsByDonor.mockResolvedValue([{ id: 90, status: 'COMPLETED' }])

        const { result } = renderPiveData({
            ...initialProps,
            activeFilter: 'donor',
            secondaryCategory: 'donor',
            selectedAnimalId: '7',
        })

        await waitFor(() => expect(result.current.hasLoadedFilteredFivs).toBe(true))
        expect(result.current.visibleItems.map(item => item.id)).toEqual([90])

        await act(async () => {
            mainRequest.resolve([{ id: 1, status: 'IN_PROCESS' }])
            await mainRequest.promise
        })

        expect(result.current.visibleItems.map(item => item.id)).toEqual([90])
    })
})
