import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { listBulls } from '../../../api/bullService'
import { listAvailableDonors } from '../../../api/donorService'
import { normalizeApiError } from '../../../api/errors'

export default function useOocyteCollectionOptions({ fivId, onLoadError }) {
    const [donors, setDonors] = React.useState([])
    const [bulls, setBulls] = React.useState([])
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fivId)
    const donorsAbortControllerRef = React.useRef(null)
    const donorsRequestIdRef = React.useRef(0)
    const bullsAbortControllerRef = React.useRef(null)
    const bullsRequestIdRef = React.useRef(0)
    const loadErrorAlertShownRef = React.useRef(false)
    const onLoadErrorRef = React.useRef(onLoadError)

    activeFivIdRef.current = fivId
    onLoadErrorRef.current = onLoadError

    const fetchAvailableDonors = React.useCallback(async (currentFivId) => {
        donorsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        donorsAbortControllerRef.current = abortController
        const requestId = ++donorsRequestIdRef.current

        try {
            const donorData = await listAvailableDonors(currentFivId, {
                signal: abortController.signal,
            })

            if (
                requestId !== donorsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                activeFivIdRef.current !== currentFivId
            ) return

            setDonors(donorData)
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Não foi possível carregar doadoras e touros.'
            )
            if (apiError.isCanceled) return
            if (
                requestId !== donorsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                activeFivIdRef.current !== currentFivId
            ) return

            if (!loadErrorAlertShownRef.current) {
                loadErrorAlertShownRef.current = true
                onLoadErrorRef.current?.(apiError.message)
            }
        } finally {
            if (requestId === donorsRequestIdRef.current) {
                donorsAbortControllerRef.current = null
            }
        }
    }, [])

    const fetchBulls = React.useCallback(async () => {
        bullsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        bullsAbortControllerRef.current = abortController
        const requestId = ++bullsRequestIdRef.current

        try {
            const bullData = await listBulls({
                signal: abortController.signal,
            })

            if (
                requestId !== bullsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setBulls(bullData)
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Não foi possível carregar doadoras e touros.'
            )
            if (apiError.isCanceled) return
            if (
                requestId !== bullsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            if (!loadErrorAlertShownRef.current) {
                loadErrorAlertShownRef.current = true
                onLoadErrorRef.current?.(apiError.message)
            }
        } finally {
            if (requestId === bullsRequestIdRef.current) {
                bullsAbortControllerRef.current = null
            }
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            loadErrorAlertShownRef.current = false

            fetchAvailableDonors(fivId)
            fetchBulls()

            return () => {
                isScreenFocusedRef.current = false

                donorsRequestIdRef.current += 1
                donorsAbortControllerRef.current?.abort()
                donorsAbortControllerRef.current = null

                bullsRequestIdRef.current += 1
                bullsAbortControllerRef.current?.abort()
                bullsAbortControllerRef.current = null
            }
        }, [fetchAvailableDonors, fetchBulls, fivId])
    )

    const donorOptions = donors.map(donor => ({
        key: donor.id,
        value: `${donor.name} (${donor.registrationNumber})`
    }))

    const bullOptions = bulls.map(bull => ({
        key: bull.id,
        value: `${bull.name} (${bull.registrationNumber})`
    }))

    return {
        donorOptions,
        bullOptions,
    }
}
