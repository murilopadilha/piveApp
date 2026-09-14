import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native'

import {
    listBulls,
    listBullsByHighestAverageEmbryoPercentage,
    searchBulls,
} from '../../../../api/bullService'
import { listDonorBullCombinations } from '../../../../api/donorBullCombinationService'
import {
    listDonors,
    listDonorsByHighestAverageEmbryoPercentage,
    listDonorsByHighestAverageOocytes,
    searchDonors,
} from '../../../../api/donorService'
import { listReceivers, searchReceivers } from '../../../../api/receiverService'
import useBullList from '../useBullList'
import useDonorList from '../useDonorList'
import useReceiverList from '../useReceiverList'

jest.mock('@react-navigation/native', () => {
    const React = require('react')
    return { useFocusEffect: callback => React.useEffect(callback, [callback]) }
})

jest.mock('../../../../api/bullService', () => ({
    listBulls: jest.fn(),
    listBullsByHighestAverageEmbryoPercentage: jest.fn(),
    searchBulls: jest.fn(),
}))
jest.mock('../../../../api/donorBullCombinationService', () => ({
    listDonorBullCombinations: jest.fn(),
}))
jest.mock('../../../../api/donorService', () => ({
    listDonors: jest.fn(),
    listDonorsByHighestAverageEmbryoPercentage: jest.fn(),
    listDonorsByHighestAverageOocytes: jest.fn(),
    searchDonors: jest.fn(),
}))
jest.mock('../../../../api/receiverService', () => ({
    listReceivers: jest.fn(),
    searchReceivers: jest.fn(),
}))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => { resolve = resolvePromise })
    return { promise, resolve }
}

const advanceDebounce = async () => {
    await act(async () => {
        jest.advanceTimersByTime(500)
        await Promise.resolve()
        await Promise.resolve()
    })
}

beforeEach(() => {
    jest.useFakeTimers()
    listDonors.mockResolvedValue([])
    listDonorsByHighestAverageEmbryoPercentage.mockResolvedValue([])
    listDonorsByHighestAverageOocytes.mockResolvedValue([])
    searchDonors.mockResolvedValue([])
    listBulls.mockResolvedValue([])
    listBullsByHighestAverageEmbryoPercentage.mockResolvedValue([])
    searchBulls.mockResolvedValue([])
    listReceivers.mockResolvedValue([])
    searchReceivers.mockResolvedValue([])
    listDonorBullCombinations.mockResolvedValue([])
})

afterEach(() => {
    cleanup()
    jest.clearAllTimers()
    jest.useRealTimers()
})

describe('useDonorList', () => {
    test('debounces the initial empty-query list by 500 ms', async () => {
        listDonors.mockResolvedValue([{ id: 1 }])
        const { result } = renderHook(() => useDonorList())

        act(() => jest.advanceTimersByTime(499))
        expect(listDonors).not.toHaveBeenCalled()

        await act(async () => {
            jest.advanceTimersByTime(1)
            await Promise.resolve()
            await Promise.resolve()
        })
        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        expect(listDonors).toHaveBeenCalledTimes(1)
        expect(result.current.visibleData).toEqual([{ id: 1 }])
    })

    test('gives remote search precedence over a ranking filter', async () => {
        searchDonors.mockResolvedValue([{ id: 2 }])
        const { result } = renderHook(() => useDonorList())

        act(() => {
            result.current.setFilterOption('highest-average-oocytes')
            result.current.setRegistrationNumber('ABC')
        })
        await advanceDebounce()
        await waitFor(() => expect(result.current.visibleData).toEqual([{ id: 2 }]))

        expect(searchDonors).toHaveBeenCalledWith('ABC', { signal: expect.anything() })
        expect(listDonorsByHighestAverageOocytes).not.toHaveBeenCalled()
    })

    test('gives combination mode precedence and filters its result locally', async () => {
        listDonorBullCombinations.mockResolvedValue([
            { id: 1, donor: { name: 'Doadora Alfa', registrationNumber: 'A-1' } },
            { id: 2, donor: { name: 'Doadora Beta', registrationNumber: 'B-2' } },
            { id: 3, donor: null },
        ])
        const { result } = renderHook(() => useDonorList())

        act(() => {
            result.current.setFilterOption('combination')
            result.current.setRegistrationNumber('beta')
        })
        await advanceDebounce()
        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        expect(listDonorBullCombinations).toHaveBeenCalledWith({
            signal: expect.anything(),
        })
        expect(searchDonors).not.toHaveBeenCalled()
        expect(result.current.visibleData.map(item => item.id)).toEqual([2])
    })
})

describe('useReceiverList', () => {
    test('ignores a superseded search response', async () => {
        listReceivers.mockResolvedValue([])
        const oldSearch = deferred()
        let oldSignal
        searchReceivers.mockImplementation((query, options) => {
            if (query === 'OLD') {
                oldSignal = options.signal
                return oldSearch.promise
            }
            return Promise.resolve([{ id: 2, registrationNumber: query }])
        })
        const { result } = renderHook(() => useReceiverList())
        await advanceDebounce()
        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        act(() => result.current.setRegistrationNumber('OLD'))
        await advanceDebounce()
        act(() => result.current.setRegistrationNumber('NEW'))
        expect(oldSignal.aborted).toBe(true)
        await advanceDebounce()
        await waitFor(() => expect(result.current.data[0]?.registrationNumber).toBe('NEW'))

        await act(async () => {
            oldSearch.resolve([{ id: 1, registrationNumber: 'OLD' }])
            await oldSearch.promise
        })
        expect(result.current.data[0].registrationNumber).toBe('NEW')
    })
})

describe('useBullList', () => {
    test('uses the selected ranking endpoint for an empty query', async () => {
        listBullsByHighestAverageEmbryoPercentage.mockResolvedValue([{ id: 5 }])
        const { result } = renderHook(() => useBullList())

        act(() => result.current.setFilterOption('highest-average-embryo-percentage'))
        await advanceDebounce()
        await waitFor(() => expect(result.current.data).toEqual([{ id: 5 }]))

        expect(listBullsByHighestAverageEmbryoPercentage).toHaveBeenCalledWith({
            signal: expect.anything(),
        })
        expect(listBulls).not.toHaveBeenCalled()
    })

    test('filters combination data without calling the bull search endpoint', async () => {
        listDonorBullCombinations.mockResolvedValue([
            {
                id: 1,
                donor: { name: 'Doadora A', registrationNumber: 'DA' },
                bull: { name: 'Touro A', registrationNumber: 'TA' },
            },
            {
                id: 2,
                donor: { name: 'Doadora B', registrationNumber: 'DB' },
                bull: { name: 'Touro B', registrationNumber: 'TB' },
            },
        ])
        const { result } = renderHook(() => useBullList())

        act(() => {
            result.current.setFilterOption('combination')
            result.current.setRegistrationNumber('TB')
        })
        await advanceDebounce()
        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        expect(result.current.data.map(item => item.id)).toEqual([2])
        expect(searchBulls).not.toHaveBeenCalled()
    })
})
