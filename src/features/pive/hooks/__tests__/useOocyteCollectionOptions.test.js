import { act, renderHook, waitFor } from '@testing-library/react-native'

import { listBulls } from '../../../../api/bullService'
import { listAvailableDonors } from '../../../../api/donorService'
import useOocyteCollectionOptions from '../useOocyteCollectionOptions'

jest.mock('@react-navigation/native', () => {
    const React = require('react')
    return { useFocusEffect: callback => React.useEffect(callback, [callback]) }
})

jest.mock('../../../../api/bullService', () => ({ listBulls: jest.fn() }))
jest.mock('../../../../api/donorService', () => ({ listAvailableDonors: jest.fn() }))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => { resolve = resolvePromise })
    return { promise, resolve }
}

beforeEach(() => {
    listAvailableDonors.mockResolvedValue([])
    listBulls.mockResolvedValue([])
})

describe('useOocyteCollectionOptions', () => {
    test('loads donors and bulls in parallel and preserves option contracts', async () => {
        const donorsRequest = deferred()
        const bullsRequest = deferred()
        listAvailableDonors.mockReturnValue(donorsRequest.promise)
        listBulls.mockReturnValue(bullsRequest.promise)

        const { result } = renderHook(() => useOocyteCollectionOptions({ fivId: 4 }))
        expect(listAvailableDonors).toHaveBeenCalledTimes(1)
        expect(listBulls).toHaveBeenCalledTimes(1)

        await act(async () => {
            donorsRequest.resolve([{ id: 1, name: 'Doadora', registrationNumber: 'D-1' }])
            bullsRequest.resolve([{ id: 2, name: 'Touro', registrationNumber: 'T-2' }])
            await Promise.all([donorsRequest.promise, bullsRequest.promise])
        })

        expect(result.current.donorOptions).toEqual([
            { key: 1, value: 'Doadora (D-1)' },
        ])
        expect(result.current.bullOptions).toEqual([
            { key: 2, value: 'Touro (T-2)' },
        ])
    })

    test('emits at most one visual error per focus cycle', async () => {
        const onLoadError = jest.fn()
        listAvailableDonors.mockRejectedValue(new Error('Falha de doadoras'))
        listBulls.mockRejectedValue(new Error('Falha de touros'))

        renderHook(() => useOocyteCollectionOptions({ fivId: 4, onLoadError }))

        await waitFor(() => expect(onLoadError).toHaveBeenCalledTimes(1))
        expect(['Falha de doadoras', 'Falha de touros']).toContain(
            onLoadError.mock.calls[0][0]
        )
    })

    test('aborts and rejects donor results from the previous FIV context', async () => {
        const oldRequest = deferred()
        let oldSignal
        listAvailableDonors.mockImplementation((fivId, options) => {
            if (fivId === 1) {
                oldSignal = options.signal
                return oldRequest.promise
            }
            return Promise.resolve([
                { id: 2, name: 'Nova', registrationNumber: 'NEW' },
            ])
        })
        const { result, rerender } = renderHook(
            ({ fivId }) => useOocyteCollectionOptions({ fivId }),
            { initialProps: { fivId: 1 } }
        )

        rerender({ fivId: 2 })
        expect(oldSignal.aborted).toBe(true)
        await waitFor(() => expect(result.current.donorOptions[0]?.key).toBe(2))

        await act(async () => {
            oldRequest.resolve([{ id: 1, name: 'Antiga', registrationNumber: 'OLD' }])
            await oldRequest.promise
        })
        expect(result.current.donorOptions[0].key).toBe(2)
        expect(listBulls).toHaveBeenCalledTimes(2)
    })

    test('aborts both requests on unmount without visual error', () => {
        const donorRequest = deferred()
        const bullRequest = deferred()
        let donorSignal
        let bullSignal
        listAvailableDonors.mockImplementation((_, options) => {
            donorSignal = options.signal
            return donorRequest.promise
        })
        listBulls.mockImplementation(options => {
            bullSignal = options.signal
            return bullRequest.promise
        })
        const onLoadError = jest.fn()
        const { unmount } = renderHook(() => useOocyteCollectionOptions({
            fivId: 4,
            onLoadError,
        }))

        unmount()
        expect(donorSignal.aborted).toBe(true)
        expect(bullSignal.aborted).toBe(true)
        expect(onLoadError).not.toHaveBeenCalled()
    })
})
