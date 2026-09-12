import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import {
    getScheduleDetailsByDate,
    listSchedules,
} from '../../../api/scheduleService'
import { normalizeApiError } from '../../../api/errors'
import { SCHEDULE_PROCEDURE_TYPES } from '../constants'

export default function useScheduleCalendar({
    selectedCalendarDate,
    onLoadError,
}) {
    const [markedDates, setMarkedDates] = React.useState({})
    const [selectedDateDetails, setSelectedDateDetails] = React.useState([])
    const isScreenFocusedRef = React.useRef(false)
    const onLoadErrorRef = React.useRef(onLoadError)
    const scheduledDatesAbortControllerRef = React.useRef(null)
    const scheduledDatesRequestIdRef = React.useRef(0)
    const dateDetailsAbortControllerRef = React.useRef(null)
    const dateDetailsRequestIdRef = React.useRef(0)

    onLoadErrorRef.current = onLoadError

    const reloadScheduledDates = React.useCallback(async () => {
        if (!isScreenFocusedRef.current) return

        scheduledDatesAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        scheduledDatesAbortControllerRef.current = abortController
        const requestId = ++scheduledDatesRequestIdRef.current

        try {
            const data = await listSchedules({ signal: abortController.signal })

            if (
                requestId !== scheduledDatesRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            const dates = {}
            data.forEach(item => {
                dates[item.date] = {
                    selected: true,
                    marked: true,
                    selectedColor: '#092955',
                }
            })

            setMarkedDates(dates)
        } catch (error) {
            if (
                requestId !== scheduledDatesRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            const apiError = normalizeApiError(error, 'Ocorreu um erro ao buscar datas agendadas.')
            if (apiError.isCanceled) return
            onLoadErrorRef.current?.(apiError.message)
        } finally {
            if (requestId === scheduledDatesRequestIdRef.current) {
                scheduledDatesAbortControllerRef.current = null
            }
        }
    }, [])

    const reloadDateDetails = React.useCallback(async (date) => {
        if (!isScreenFocusedRef.current) return

        dateDetailsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        dateDetailsAbortControllerRef.current = abortController
        const requestId = ++dateDetailsRequestIdRef.current

        try {
            const data = await getScheduleDetailsByDate(date, {
                signal: abortController.signal,
            })

            if (
                requestId !== dateDetailsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            const details = data.map(item => ({
                id: item.id,
                procedureType: item.procedureType,
                procedureTypeLabel: SCHEDULE_PROCEDURE_TYPES.find(cat => cat.key === item.procedureType)?.value || item.procedureType,
                date: item.date,
            }))
            setSelectedDateDetails(details)
        } catch (error) {
            if (
                requestId !== dateDetailsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            const apiError = normalizeApiError(error, 'Ocorreu um erro ao buscar detalhes do agendamento.')
            if (apiError.isCanceled) return
            onLoadErrorRef.current?.(apiError.message)
        } finally {
            if (requestId === dateDetailsRequestIdRef.current) {
                dateDetailsAbortControllerRef.current = null
            }
        }
    }, [])

    const clearDateDetails = React.useCallback(() => {
        dateDetailsRequestIdRef.current += 1
        dateDetailsAbortControllerRef.current?.abort()
        dateDetailsAbortControllerRef.current = null
        setSelectedDateDetails([])
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            reloadScheduledDates()

            return () => {
                isScreenFocusedRef.current = false
                scheduledDatesRequestIdRef.current += 1
                scheduledDatesAbortControllerRef.current?.abort()
                scheduledDatesAbortControllerRef.current = null
            }
        }, [reloadScheduledDates])
    )

    useFocusEffect(
        React.useCallback(() => {
            if (selectedCalendarDate) {
                reloadDateDetails(selectedCalendarDate)
            }

            return () => {
                dateDetailsRequestIdRef.current += 1
                dateDetailsAbortControllerRef.current?.abort()
                dateDetailsAbortControllerRef.current = null
            }
        }, [reloadDateDetails, selectedCalendarDate])
    )

    return {
        markedDates,
        selectedDateDetails,
        reloadScheduledDates,
        reloadDateDetails,
        clearDateDetails,
    }
}
