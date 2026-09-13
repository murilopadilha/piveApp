import { act, renderHook, waitFor } from '@testing-library/react-native'

import { getOocyteCollection } from '../../../../api/oocyteCollectionService'
import useEmbryoProductionContext from '../useEmbryoProductionContext'

jest.mock('@react-navigation/native', () => {
    const React = require('react')

    return {
        useFocusEffect: callback => React.useEffect(callback, [callback]),
    }
})

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

describe('useEmbryoProductionContext', () => {
    test('loads the production and marks the collection context as valid', async () => {
        getOocyteCollection.mockResolvedValue({ embryoProduction: { id: 81 } })

        const { result } = renderHook(() => useEmbryoProductionContext({
            collectionId: 12,
            onLoadError: jest.fn(),
        }))

        expect(result.current.loading).toBe(true)

        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        expect(result.current).toMatchObject({
            productionId: 81,
            loadedCollectionId: 12,
            loading: false,
            error: null,
        })
        expect(getOocyteCollection).toHaveBeenCalledWith(12, {
            signal: expect.anything(),
        })
    })

    test('records a valid loaded context when the collection has no production', async () => {
        getOocyteCollection.mockResolvedValue({})

        const { result } = renderHook(() => useEmbryoProductionContext({
            collectionId: 15,
        }))

        await waitFor(() => expect(result.current.hasLoaded).toBe(true))

        expect(result.current.productionId).toBeNull()
        expect(result.current.loadedCollectionId).toBe(15)
    })

    test('rejects a stale response after the collection changes', async () => {
        const firstRequest = deferred()
        const secondRequest = deferred()
        const signals = new Map()
        getOocyteCollection.mockImplementation((id, options) => {
            signals.set(id, options.signal)
            return id === 1 ? firstRequest.promise : secondRequest.promise
        })

        const { result, rerender } = renderHook(
            ({ collectionId }) => useEmbryoProductionContext({ collectionId }),
            { initialProps: { collectionId: 1 } }
        )

        rerender({ collectionId: 2 })
        expect(signals.get(1).aborted).toBe(true)

        await act(async () => {
            secondRequest.resolve({ embryoProduction: { id: 202 } })
            await secondRequest.promise
        })
        await waitFor(() => expect(result.current.loadedCollectionId).toBe(2))

        await act(async () => {
            firstRequest.resolve({ embryoProduction: { id: 101 } })
            await firstRequest.promise
        })

        expect(result.current.productionId).toBe(202)
        expect(result.current.loadedCollectionId).toBe(2)
    })

    test('reports a current request error through state and callback', async () => {
        const onLoadError = jest.fn()
        getOocyteCollection.mockRejectedValue(new Error('Falha atual'))

        const { result } = renderHook(() => useEmbryoProductionContext({
            collectionId: 20,
            onLoadError,
        }))

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.error).toBe('Falha atual')
        expect(result.current.hasLoaded).toBe(false)
        expect(onLoadError).toHaveBeenCalledWith('Falha atual')
    })

    test('keeps cancellation silent', async () => {
        const onLoadError = jest.fn()
        getOocyteCollection.mockRejectedValue({
            code: 'ERR_CANCELED',
            message: 'canceled',
        })

        const { result } = renderHook(() => useEmbryoProductionContext({
            collectionId: 21,
            onLoadError,
        }))

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.error).toBeNull()
        expect(onLoadError).not.toHaveBeenCalled()
    })

    test('aborts the active request on unmount', () => {
        const request = deferred()
        let signal
        getOocyteCollection.mockImplementation((_, options) => {
            signal = options.signal
            return request.promise
        })

        const { unmount } = renderHook(() => useEmbryoProductionContext({
            collectionId: 30,
        }))

        expect(signal.aborted).toBe(false)
        unmount()
        expect(signal.aborted).toBe(true)
    })
})
