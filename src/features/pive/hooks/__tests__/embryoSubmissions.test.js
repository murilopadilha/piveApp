import { act, renderHook } from '@testing-library/react-native'

import { discardEmbryos, freezeEmbryos } from '../../../../api/embryoService'
import { createOocyteCollection } from '../../../../api/oocyteCollectionService'
import useDiscardedEmbryoSubmission from '../useDiscardedEmbryoSubmission'
import useFrozenEmbryoSubmission from '../useFrozenEmbryoSubmission'
import useOocyteCollectionSubmission from '../useOocyteCollectionSubmission'

jest.mock('@react-navigation/native', () => {
    const React = require('react')

    return {
        useFocusEffect: callback => React.useEffect(callback, [callback]),
    }
})

jest.mock('../../../../api/embryoService', () => ({
    discardEmbryos: jest.fn(),
    freezeEmbryos: jest.fn(),
}))

jest.mock('../../../../api/oocyteCollectionService', () => ({
    createOocyteCollection: jest.fn(),
}))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise
    })

    return { promise, resolve }
}

const submissionProps = {
    collectionId: 10,
    productionId: 20,
    loadedCollectionId: 10,
}

describe('useFrozenEmbryoSubmission', () => {
    const payload = { productionId: 20, embryosQuantity: 4 }

    test('submits the frozen command and calls success in the current context', async () => {
        freezeEmbryos.mockResolvedValue({ id: 1 })
        const onSuccess = jest.fn()
        const { result } = renderHook(() => useFrozenEmbryoSubmission(submissionProps))

        await act(async () => {
            await result.current.submitFrozenEmbryos({
                payload,
                submittedCollectionId: 10,
                onSuccess,
            })
        })

        expect(freezeEmbryos).toHaveBeenCalledWith(payload, {
            signal: expect.anything(),
        })
        expect(onSuccess).toHaveBeenCalledTimes(1)
        expect(result.current.isSubmitting).toBe(false)
    })

    test('blocks a concurrent duplicate submission and unlocks afterwards', async () => {
        const request = deferred()
        freezeEmbryos.mockReturnValue(request.promise)
        const { result } = renderHook(() => useFrozenEmbryoSubmission(submissionProps))
        const command = {
            payload,
            submittedCollectionId: 10,
            onSuccess: jest.fn(),
        }
        let firstSubmission

        act(() => {
            firstSubmission = result.current.submitFrozenEmbryos(command)
            result.current.submitFrozenEmbryos(command)
        })

        expect(freezeEmbryos).toHaveBeenCalledTimes(1)
        expect(result.current.isSubmitting).toBe(true)

        await act(async () => {
            request.resolve({ id: 1 })
            await firstSubmission
        })

        expect(result.current.isSubmitting).toBe(false)
    })

    test('aborts and suppresses stale success when collection context changes', async () => {
        const request = deferred()
        let signal
        freezeEmbryos.mockImplementation((_, options) => {
            signal = options.signal
            return request.promise
        })
        const onSuccess = jest.fn()
        const { result, rerender } = renderHook(
            props => useFrozenEmbryoSubmission(props),
            { initialProps: submissionProps }
        )
        let submission

        act(() => {
            submission = result.current.submitFrozenEmbryos({
                payload,
                submittedCollectionId: 10,
                onSuccess,
            })
        })
        rerender({
            collectionId: 11,
            productionId: 21,
            loadedCollectionId: 11,
        })

        expect(signal.aborted).toBe(true)

        await act(async () => {
            request.resolve({ id: 1 })
            await submission
        })

        expect(onSuccess).not.toHaveBeenCalled()
        expect(result.current.isSubmitting).toBe(false)
    })

    test('emits the normalized error only for the current context', async () => {
        freezeEmbryos.mockRejectedValue(new Error('Falha no congelamento'))
        const onError = jest.fn()
        const { result } = renderHook(() => useFrozenEmbryoSubmission(submissionProps))

        await act(async () => {
            await result.current.submitFrozenEmbryos({
                payload,
                submittedCollectionId: 10,
                onError,
            })
        })

        expect(onError).toHaveBeenCalledWith('Falha no congelamento')
        expect(result.current.isSubmitting).toBe(false)
    })
})

describe('useDiscardedEmbryoSubmission', () => {
    test('uses the distinct discarded command and payload', async () => {
        discardEmbryos.mockResolvedValue({ id: 2 })
        const payload = { productionId: 20, embryosQuantity: 3 }
        const onSuccess = jest.fn()
        const { result } = renderHook(() => useDiscardedEmbryoSubmission(submissionProps))

        await act(async () => {
            await result.current.submitDiscardedEmbryos({
                payload,
                submittedCollectionId: 10,
                onSuccess,
            })
        })

        expect(discardEmbryos).toHaveBeenCalledWith(payload, {
            signal: expect.anything(),
        })
        expect(freezeEmbryos).not.toHaveBeenCalled()
        expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('keeps a canceled discarded request silent and unlocks', async () => {
        discardEmbryos.mockRejectedValue({
            code: 'ERR_CANCELED',
            message: 'canceled',
        })
        const onSuccess = jest.fn()
        const onError = jest.fn()
        const { result } = renderHook(() => useDiscardedEmbryoSubmission(submissionProps))

        await act(async () => {
            await result.current.submitDiscardedEmbryos({
                payload: { productionId: 20, embryosQuantity: 2 },
                submittedCollectionId: 10,
                onSuccess,
                onError,
            })
        })

        expect(onSuccess).not.toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
        expect(result.current.isSubmitting).toBe(false)
    })
})

describe('useOocyteCollectionSubmission', () => {
    test('preserves the payload and blocks concurrent duplicate submit', async () => {
        const request = deferred()
        createOocyteCollection.mockReturnValue(request.promise)
        const payload = {
            fivId: 5,
            donorCattleId: '11',
            bullId: '12',
            totalOocytes: 7,
            viableOocytes: 6,
        }
        const onSuccess = jest.fn()
        const { result } = renderHook(() => useOocyteCollectionSubmission({ fivId: 5 }))
        let firstSubmission

        act(() => {
            firstSubmission = result.current.submitOocyteCollection({
                payload,
                errorFallbackMessage: 'Falha',
                onSuccess,
            })
            result.current.submitOocyteCollection({
                payload,
                errorFallbackMessage: 'Falha',
                onSuccess,
            })
        })

        expect(createOocyteCollection).toHaveBeenCalledTimes(1)
        expect(createOocyteCollection).toHaveBeenCalledWith(payload, {
            signal: expect.anything(),
        })

        await act(async () => {
            request.resolve({ id: 1 })
            await firstSubmission
        })

        expect(onSuccess).toHaveBeenCalledTimes(1)
        expect(result.current.isSubmitting).toBe(false)
    })

    test('restores the fivId-dependent cleanup and suppresses stale callbacks', async () => {
        const request = deferred()
        let signal
        createOocyteCollection.mockImplementation((_, options) => {
            signal = options.signal
            return request.promise
        })
        const onSuccess = jest.fn()
        const onError = jest.fn()
        const { result, rerender } = renderHook(
            ({ fivId }) => useOocyteCollectionSubmission({ fivId }),
            { initialProps: { fivId: 5 } }
        )
        let submission

        act(() => {
            submission = result.current.submitOocyteCollection({
                payload: { fivId: 5 },
                errorFallbackMessage: 'Falha',
                onSuccess,
                onError,
            })
        })
        rerender({ fivId: 6 })

        expect(signal.aborted).toBe(true)

        await act(async () => {
            request.resolve({ id: 1 })
            await submission
        })

        expect(onSuccess).not.toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
        expect(result.current.isSubmitting).toBe(false)
    })
})
