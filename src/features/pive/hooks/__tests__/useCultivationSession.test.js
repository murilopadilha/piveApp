import { AppState } from 'react-native'
import { act, renderHook } from '@testing-library/react-native'

import { listFivs } from '../../../../api/fivService'
import { getOocyteCollection } from '../../../../api/oocyteCollectionService'
import useCultivationSession from '../useCultivationSession'

jest.mock('@react-navigation/native', () => {
    const React = require('react')

    return {
        useFocusEffect: callback => React.useEffect(callback, [callback]),
    }
})

jest.mock('../../../../api/fivService', () => ({
    listFivs: jest.fn(),
}))

jest.mock('../../../../api/oocyteCollectionService', () => ({
    getOocyteCollection: jest.fn(),
}))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise
    })
    return { promise, resolve }
}

const flushPromises = async () => {
    await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
    })
}

describe('useCultivationSession', () => {
    let appStateListener
    let removeAppStateListener

    beforeEach(() => {
        jest.useFakeTimers()
        Object.defineProperty(AppState, 'currentState', {
            configurable: true,
            value: 'active',
        })
        removeAppStateListener = jest.fn()
        jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
            appStateListener = listener
            return { remove: removeAppStateListener }
        })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    test('resolves the FIV and collection session in the immediate focus cycle', async () => {
        const fiv = {
            id: 3,
            oocyteCollections: [{ id: 12 }],
        }
        const collection = {
            id: 12,
            embryoProduction: { totalEmbryos: 0 },
        }
        const onSessionContextReset = jest.fn()
        const onServerTotalEmbryos = jest.fn()
        listFivs.mockResolvedValue([fiv])
        getOocyteCollection.mockResolvedValue(collection)

        const { result, unmount } = renderHook(() => useCultivationSession({
            oocyteCollectionId: 12,
            onSessionContextReset,
            onServerTotalEmbryos,
        }))
        await flushPromises()

        expect(listFivs).toHaveBeenCalledTimes(1)
        expect(getOocyteCollection).toHaveBeenCalledWith(12, {
            signal: expect.anything(),
        })
        expect(result.current).toMatchObject({
            data: collection,
            fivData: fiv,
            loading: false,
            error: null,
        })
        expect(onSessionContextReset).toHaveBeenCalledWith(12)
        expect(onServerTotalEmbryos).toHaveBeenCalledWith(12, 0)
        expect(jest.getTimerCount()).toBe(1)

        unmount()
        expect(removeAppStateListener).toHaveBeenCalledTimes(1)
        expect(jest.getTimerCount()).toBe(0)
    })

    test('does not overlap polling cycles and schedules the next one after completion', async () => {
        const firstRequest = deferred()
        listFivs
            .mockReturnValueOnce(firstRequest.promise)
            .mockResolvedValue([])

        const { unmount } = renderHook(() => useCultivationSession({
            oocyteCollectionId: 14,
        }))

        act(() => {
            jest.advanceTimersByTime(9000)
        })
        expect(listFivs).toHaveBeenCalledTimes(1)
        expect(jest.getTimerCount()).toBe(0)

        firstRequest.resolve([])
        await flushPromises()
        expect(jest.getTimerCount()).toBe(1)

        await act(async () => {
            jest.advanceTimersByTime(2999)
            await Promise.resolve()
        })
        expect(listFivs).toHaveBeenCalledTimes(1)

        await act(async () => {
            jest.advanceTimersByTime(1)
            await Promise.resolve()
            await Promise.resolve()
        })
        expect(listFivs).toHaveBeenCalledTimes(2)

        unmount()
    })

    test('pauses in background and starts an immediate cycle on foreground', async () => {
        listFivs.mockResolvedValue([])
        const { unmount } = renderHook(() => useCultivationSession({
            oocyteCollectionId: 16,
        }))
        await flushPromises()
        expect(listFivs).toHaveBeenCalledTimes(1)
        expect(jest.getTimerCount()).toBe(1)

        act(() => appStateListener('background'))
        expect(jest.getTimerCount()).toBe(0)

        await act(async () => {
            appStateListener('active')
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(listFivs).toHaveBeenCalledTimes(2)
        expect(jest.getTimerCount()).toBe(1)

        unmount()
    })
})
