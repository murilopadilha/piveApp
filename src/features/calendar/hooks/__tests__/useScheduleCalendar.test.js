import { act, renderHook, waitFor } from '@testing-library/react-native'

import {
    getScheduleDetailsByDate,
    listSchedules,
} from '../../../../api/scheduleService'
import useScheduleCalendar from '../useScheduleCalendar'

jest.mock('@react-navigation/native', () => {
    const React = require('react')
    return { useFocusEffect: callback => React.useEffect(callback, [callback]) }
})

jest.mock('../../../../api/scheduleService', () => ({
    getScheduleDetailsByDate: jest.fn(),
    listSchedules: jest.fn(),
}))

const deferred = () => {
    let resolve
    const promise = new Promise(resolvePromise => { resolve = resolvePromise })
    return { promise, resolve }
}

beforeEach(() => {
    listSchedules.mockResolvedValue([])
    getScheduleDetailsByDate.mockResolvedValue([])
})

describe('useScheduleCalendar', () => {
    test('loads markings and day details independently on focus', async () => {
        listSchedules.mockResolvedValue([
            { id: 1, date: '2025-01-02' },
            { id: 2, date: '2025-01-03' },
        ])
        getScheduleDetailsByDate.mockResolvedValue([
            { id: 3, procedureType: 'EMBRYO_TRANSFER', date: '2025-01-02' },
            { id: 4, procedureType: 'CUSTOM', date: '2025-01-02' },
        ])

        const { result } = renderHook(() => useScheduleCalendar({
            selectedCalendarDate: '2025-01-02',
        }))

        await waitFor(() => expect(Object.keys(result.current.markedDates)).toHaveLength(2))
        await waitFor(() => expect(result.current.selectedDateDetails).toHaveLength(2))

        expect(result.current.markedDates['2025-01-02']).toEqual({
            selected: true,
            marked: true,
            selectedColor: '#092955',
        })
        expect(result.current.selectedDateDetails).toEqual([
            {
                id: 3,
                procedureType: 'EMBRYO_TRANSFER',
                procedureTypeLabel: 'Transferência de Embrião',
                date: '2025-01-02',
            },
            {
                id: 4,
                procedureType: 'CUSTOM',
                procedureTypeLabel: 'CUSTOM',
                date: '2025-01-02',
            },
        ])
    })

    test('keeps details available when the independent markings request fails', async () => {
        const onLoadError = jest.fn()
        listSchedules.mockRejectedValue(new Error('Falha nas marcações'))
        getScheduleDetailsByDate.mockResolvedValue([
            { id: 3, procedureType: 'EMBRYO_TRANSFER', date: '2025-01-02' },
        ])

        const { result } = renderHook(() => useScheduleCalendar({
            selectedCalendarDate: '2025-01-02',
            onLoadError,
        }))

        await waitFor(() => expect(onLoadError).toHaveBeenCalledWith('Falha nas marcações'))
        await waitFor(() => expect(result.current.selectedDateDetails).toHaveLength(1))
        expect(result.current.markedDates).toEqual({})
    })

    test('rejects stale details when the selected date changes', async () => {
        const oldRequest = deferred()
        const signals = {}
        getScheduleDetailsByDate.mockImplementation((date, options) => {
            signals[date] = options.signal
            return date === '2025-01-01'
                ? oldRequest.promise
                : Promise.resolve([{ id: 2, procedureType: 'CUSTOM', date }])
        })
        const { result, rerender } = renderHook(
            ({ date }) => useScheduleCalendar({ selectedCalendarDate: date }),
            { initialProps: { date: '2025-01-01' } }
        )

        rerender({ date: '2025-01-02' })
        expect(signals['2025-01-01'].aborted).toBe(true)
        await waitFor(() => expect(result.current.selectedDateDetails[0]?.id).toBe(2))

        await act(async () => {
            oldRequest.resolve([{ id: 1, procedureType: 'CUSTOM', date: '2025-01-01' }])
            await oldRequest.promise
        })
        expect(result.current.selectedDateDetails[0].id).toBe(2)
    })

    test('clearDateDetails aborts an active reload and clears existing details', async () => {
        getScheduleDetailsByDate.mockResolvedValue([
            { id: 1, procedureType: 'CUSTOM', date: '2025-01-01' },
        ])
        const { result } = renderHook(() => useScheduleCalendar({
            selectedCalendarDate: '2025-01-01',
        }))
        await waitFor(() => expect(result.current.selectedDateDetails).toHaveLength(1))

        const request = deferred()
        let signal
        getScheduleDetailsByDate.mockImplementation((_, options) => {
            signal = options.signal
            return request.promise
        })
        act(() => {
            result.current.reloadDateDetails('2025-01-02')
        })
        act(() => result.current.clearDateDetails())

        expect(signal.aborted).toBe(true)
        expect(result.current.selectedDateDetails).toEqual([])

        await act(async () => {
            request.resolve([{ id: 2, procedureType: 'CUSTOM', date: '2025-01-02' }])
            await request.promise
        })
        expect(result.current.selectedDateDetails).toEqual([])
    })

    test('aborts both active pipelines on unmount', () => {
        const scheduleRequest = deferred()
        const detailsRequest = deferred()
        let scheduleSignal
        let detailsSignal
        listSchedules.mockImplementation(options => {
            scheduleSignal = options.signal
            return scheduleRequest.promise
        })
        getScheduleDetailsByDate.mockImplementation((_, options) => {
            detailsSignal = options.signal
            return detailsRequest.promise
        })

        const { unmount } = renderHook(() => useScheduleCalendar({
            selectedCalendarDate: '2025-01-01',
        }))
        unmount()

        expect(scheduleSignal.aborted).toBe(true)
        expect(detailsSignal.aborted).toBe(true)
    })
})
