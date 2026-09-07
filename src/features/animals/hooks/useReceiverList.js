import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { listReceivers, searchReceivers } from '../../../api/receiverService'
import { normalizeApiError } from '../../../api/errors'

export default function useReceiverList() {
    const [data, setData] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [registrationNumber, setRegistrationNumber] = React.useState('')
    const [loadError, setLoadError] = React.useState(null)
    const [hasLoaded, setHasLoaded] = React.useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const registrationNumberRef = React.useRef(registrationNumber)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    registrationNumberRef.current = registrationNumber

    const loadReceivers = React.useCallback(async (query = '') => {
        if (!isScreenFocusedRef.current) return

        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true)

        try {
            let receivers
            if (query) {
                receivers = await searchReceivers(query, {
                    signal: abortController.signal,
                })
            } else {
                receivers = await listReceivers({ signal: abortController.signal })
            }

            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setData(receivers)
            setLoadError(null)
            setHasLoaded(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as receptoras.')
            if (apiError.isCanceled) return
            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            console.error(apiError.message)
            setLoadError(apiError.message)
            setHasLoaded(true)
        } finally {
            if (requestId === requestIdRef.current) {
                abortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setLoading(false)
                }
            }
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            const debounceTimer = setTimeout(() => {
                loadReceivers(registrationNumber)
            }, 500)

            return () => {
                isScreenFocusedRef.current = false
                clearTimeout(debounceTimer)
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [loadReceivers, registrationNumber])
    )

    const reload = React.useCallback(() => (
        loadReceivers(registrationNumberRef.current)
    ), [loadReceivers])

    return {
        data,
        loading,
        loadError,
        hasLoaded,
        registrationNumber,
        setRegistrationNumber,
        reload,
    }
}
