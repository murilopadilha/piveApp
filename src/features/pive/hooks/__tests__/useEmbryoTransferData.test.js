import { act, renderHook, waitFor } from '@testing-library/react-native'

import { getOocyteCollection } from '../../../../api/oocyteCollectionService'
import { listAvailableReceivers } from '../../../../api/receiverService'
import { listTransfersByFiv } from '../../../../api/transferService'
import useEmbryoTransferData from '../useEmbryoTransferData'

jest.mock('@react-navigation/native', () => {
    const React = require('react')
    return { useFocusEffect: callback => React.useEffect(callback, [callback]) }
})

jest.mock('../../../../api/oocyteCollectionService', () => ({
    getOocyteCollection: jest.fn(),
}))
jest.mock('../../../../api/receiverService', () => ({
    listAvailableReceivers: jest.fn(),
}))
jest.mock('../../../../api/transferService', () => ({
    listTransfersByFiv: jest.fn(),
}))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => { resolve = resolvePromise })
    return { promise, resolve }
}

const baseProps = {
    fivId: 1,
    collectionId: 10,
    onLoadError: jest.fn(),
    onTransfersContextReset: jest.fn(),
}

beforeEach(() => {
    listTransfersByFiv.mockResolvedValue([])
    getOocyteCollection.mockResolvedValue(null)
    listAvailableReceivers.mockResolvedValue([])
})

describe('useEmbryoTransferData', () => {
    test('loads all three pipelines independently and derives select options', async () => {
        listTransfersByFiv.mockResolvedValue([
            { id: 2, farm: 'Fazenda A', date: '2025-01-02' },
        ])
        getOocyteCollection.mockResolvedValue({ id: 10, viableOocytes: 4 })
        listAvailableReceivers.mockResolvedValue([
            { id: 3, name: 'Receptora A', registrationNumber: 'REC-3' },
        ])

        const { result } = renderHook(() => useEmbryoTransferData(baseProps))

        expect(result.current).toMatchObject({
            transfersLoading: true,
            collectionLoading: true,
            recipientsLoading: true,
        })
        await waitFor(() => {
            expect(result.current.hasLoadedTransfers).toBe(true)
            expect(result.current.hasLoadedCollection).toBe(true)
            expect(result.current.hasLoadedRecipients).toBe(true)
        })

        expect(result.current.loadedOocyteCollectionId).toBe(10)
        expect(result.current.oocyteCollection).toEqual({ id: 10, viableOocytes: 4 })
        expect(result.current.transferOptions).toEqual([
            { key: '2', value: 'Fazenda A (2025-01-02)' },
        ])
        expect(result.current.recipientOptions).toEqual([
            { key: '3', value: 'Receptora A (REC-3)' },
        ])
        expect(result.current).toMatchObject({
            transfersLoading: false,
            collectionLoading: false,
            recipientsLoading: false,
            transfersError: null,
            collectionError: null,
            recipientsError: null,
        })
    })

    test('keeps successful pipelines when the collection pipeline fails', async () => {
        const onLoadError = jest.fn()
        listTransfersByFiv.mockResolvedValue([{ id: 2, farm: 'A', date: 'D' }])
        listAvailableReceivers.mockResolvedValue([{ id: 3, name: 'R', registrationNumber: 'N' }])
        getOocyteCollection.mockRejectedValue(new Error('Falha da coleta'))

        const { result } = renderHook(() => useEmbryoTransferData({
            ...baseProps,
            onLoadError,
        }))

        await waitFor(() => expect(result.current.collectionLoading).toBe(false))
        await waitFor(() => expect(result.current.hasLoadedTransfers).toBe(true))
        await waitFor(() => expect(result.current.hasLoadedRecipients).toBe(true))

        expect(result.current.collectionError).toBe('Falha da coleta')
        expect(result.current.loadedOocyteCollectionId).toBeNull()
        expect(result.current.transfers).toHaveLength(1)
        expect(result.current.recipients).toHaveLength(1)
        expect(onLoadError).toHaveBeenCalledWith('Falha da coleta')
    })

    test('rejects old FIV and collection responses after context changes', async () => {
        const oldTransfers = deferred()
        const oldCollection = deferred()
        const signals = {}
        listTransfersByFiv.mockImplementation((id, options) => {
            signals[`transfer-${id}`] = options.signal
            return id === 1 ? oldTransfers.promise : Promise.resolve([
                { id: 22, farm: 'Nova', date: '2025-02-02' },
            ])
        })
        getOocyteCollection.mockImplementation((id, options) => {
            signals[`collection-${id}`] = options.signal
            return id === 10 ? oldCollection.promise : Promise.resolve({ id: 20 })
        })
        const onTransfersContextReset = jest.fn()
        const { result, rerender } = renderHook(
            props => useEmbryoTransferData(props),
            { initialProps: { ...baseProps, onTransfersContextReset } }
        )

        rerender({
            ...baseProps,
            fivId: 2,
            collectionId: 20,
            onTransfersContextReset,
        })
        expect(signals['transfer-1'].aborted).toBe(true)
        expect(signals['collection-10'].aborted).toBe(true)

        await waitFor(() => expect(result.current.loadedOocyteCollectionId).toBe(20))
        await waitFor(() => expect(result.current.transfers[0]?.id).toBe(22))

        await act(async () => {
            oldTransfers.resolve([{ id: 11, farm: 'Antiga', date: 'old' }])
            oldCollection.resolve({ id: 10 })
            await Promise.all([oldTransfers.promise, oldCollection.promise])
        })

        expect(result.current.transfers[0].id).toBe(22)
        expect(result.current.oocyteCollection).toEqual({ id: 20 })
        expect(onTransfersContextReset).toHaveBeenCalledTimes(2)
    })

    test('reloads only the explicitly requested collection and recipients pipelines', async () => {
        const { result } = renderHook(() => useEmbryoTransferData(baseProps))
        await waitFor(() => expect(result.current.hasLoadedRecipients).toBe(true))

        getOocyteCollection.mockResolvedValue({ id: 10, refreshed: true })
        listAvailableReceivers.mockResolvedValue([
            { id: 9, name: 'Nova', registrationNumber: 'REC-9' },
        ])

        await act(async () => {
            await Promise.all([
                result.current.reloadOocyteCollection(10),
                result.current.reloadRecipients(),
            ])
        })

        expect(getOocyteCollection).toHaveBeenCalledTimes(2)
        expect(listAvailableReceivers).toHaveBeenCalledTimes(2)
        expect(listTransfersByFiv).toHaveBeenCalledTimes(1)
        expect(result.current.oocyteCollection).toEqual({ id: 10, refreshed: true })
        expect(result.current.recipientOptions[0].key).toBe('9')
    })

    test('aborts all active pipelines on unmount without reporting errors', () => {
        const requests = [deferred(), deferred(), deferred()]
        const signals = []
        listTransfersByFiv.mockImplementation((_, options) => {
            signals.push(options.signal)
            return requests[0].promise
        })
        getOocyteCollection.mockImplementation((_, options) => {
            signals.push(options.signal)
            return requests[1].promise
        })
        listAvailableReceivers.mockImplementation(options => {
            signals.push(options.signal)
            return requests[2].promise
        })
        const onLoadError = jest.fn()

        const { unmount } = renderHook(() => useEmbryoTransferData({
            ...baseProps,
            onLoadError,
        }))
        unmount()

        expect(signals).toHaveLength(3)
        signals.forEach(signal => expect(signal.aborted).toBe(true))
        expect(onLoadError).not.toHaveBeenCalled()
    })
})
