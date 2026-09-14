import React from 'react'
import { AppState } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { normalizeApiError } from '../../../api/errors'
import { listFivs } from '../../../api/fivService'
import { getOocyteCollection } from '../../../api/oocyteCollectionService'

export default function useCultivationSession({
    oocyteCollectionId,
    onSessionContextReset,
    onServerTotalEmbryos,
}) {
    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [fivData, setFivData] = React.useState(null)
    const isScreenFocusedRef = React.useRef(false)
    const isPollingActiveRef = React.useRef(false)
    const appStateRef = React.useRef(AppState.currentState)
    const pollingTimeoutRef = React.useRef(null)
    const pollingAbortControllerRef = React.useRef(null)
    const pollingRequestIdRef = React.useRef(0)
    const activeOocyteCollectionIdRef = React.useRef(oocyteCollectionId)
    const sessionContextIdRef = React.useRef(null)
    const restartPollingRef = React.useRef(null)
    const onSessionContextResetRef = React.useRef(onSessionContextReset)
    const onServerTotalEmbryosRef = React.useRef(onServerTotalEmbryos)

    activeOocyteCollectionIdRef.current = oocyteCollectionId
    onSessionContextResetRef.current = onSessionContextReset
    onServerTotalEmbryosRef.current = onServerTotalEmbryos

    useFocusEffect(
        React.useCallback(() => {
            const currentOocyteCollectionId = oocyteCollectionId

            isScreenFocusedRef.current = true
            appStateRef.current = AppState.currentState
            isPollingActiveRef.current = AppState.currentState === 'active'

            if (sessionContextIdRef.current !== currentOocyteCollectionId) {
                sessionContextIdRef.current = currentOocyteCollectionId
                onSessionContextResetRef.current?.(currentOocyteCollectionId)
                setData(null)
                setFivData(null)
                setError(null)
                setLoading(true)
            }

            function scheduleNextPoll() {
                if (
                    !isPollingActiveRef.current ||
                    !isScreenFocusedRef.current ||
                    appStateRef.current !== 'active' ||
                    activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                ) return

                pollingTimeoutRef.current = setTimeout(() => {
                    pollingTimeoutRef.current = null
                    runPollingCycle()
                }, 3000)
            }

            async function runPollingCycle() {
                if (
                    !isPollingActiveRef.current ||
                    !isScreenFocusedRef.current ||
                    appStateRef.current !== 'active' ||
                    activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                ) return

                const abortController = new AbortController()
                pollingAbortControllerRef.current = abortController
                const requestId = ++pollingRequestIdRef.current

                try {
                    const fivList = await listFivs({ signal: abortController.signal })

                    if (
                        requestId !== pollingRequestIdRef.current ||
                        !isPollingActiveRef.current ||
                        !isScreenFocusedRef.current ||
                        appStateRef.current !== 'active' ||
                        activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                    ) return

                    const foundFiv = fivList.find(fiv =>
                        Array.isArray(fiv?.oocyteCollections) &&
                        fiv.oocyteCollections.some(oocyteCollection =>
                            oocyteCollection.id === currentOocyteCollectionId
                        )
                    )

                    let oocyteCollectionData = null
                    if (foundFiv) {
                        oocyteCollectionData = await getOocyteCollection(
                            currentOocyteCollectionId,
                            { signal: abortController.signal }
                        )
                    }

                    if (
                        requestId !== pollingRequestIdRef.current ||
                        !isPollingActiveRef.current ||
                        !isScreenFocusedRef.current ||
                        appStateRef.current !== 'active' ||
                        activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                    ) return

                    setFivData(foundFiv ?? null)
                    setData(foundFiv ? (oocyteCollectionData ?? null) : null)

                    if (foundFiv) {
                        const serverTotalEmbryos =
                            oocyteCollectionData?.embryoProduction?.totalEmbryos ?? ''

                        onServerTotalEmbryosRef.current?.(
                            currentOocyteCollectionId,
                            serverTotalEmbryos
                        )
                    }

                    setError(null)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar os dados do cultivo.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== pollingRequestIdRef.current ||
                        !isPollingActiveRef.current ||
                        !isScreenFocusedRef.current ||
                        appStateRef.current !== 'active' ||
                        activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                    ) return
                    setError(apiError.message)
                } finally {
                    if (requestId === pollingRequestIdRef.current) {
                        pollingAbortControllerRef.current = null
                        if (
                            isPollingActiveRef.current &&
                            isScreenFocusedRef.current &&
                            appStateRef.current === 'active' &&
                            activeOocyteCollectionIdRef.current === currentOocyteCollectionId
                        ) {
                            setLoading(false)
                            scheduleNextPoll()
                        }
                    }
                }
            }

            function restartPolling() {
                if (
                    !isPollingActiveRef.current ||
                    !isScreenFocusedRef.current ||
                    appStateRef.current !== 'active' ||
                    activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                ) return

                if (pollingTimeoutRef.current) {
                    clearTimeout(pollingTimeoutRef.current)
                    pollingTimeoutRef.current = null
                }

                pollingRequestIdRef.current += 1
                pollingAbortControllerRef.current?.abort()
                pollingAbortControllerRef.current = null
                runPollingCycle()
            }

            restartPollingRef.current = restartPolling

            const handleAppStateChange = (nextAppState) => {
                const wasActive = appStateRef.current === 'active'
                appStateRef.current = nextAppState

                if (nextAppState !== 'active') {
                    isPollingActiveRef.current = false
                    if (pollingTimeoutRef.current) {
                        clearTimeout(pollingTimeoutRef.current)
                        pollingTimeoutRef.current = null
                    }
                    pollingRequestIdRef.current += 1
                    pollingAbortControllerRef.current?.abort()
                    pollingAbortControllerRef.current = null
                    return
                }

                if (!isScreenFocusedRef.current || wasActive) return

                isPollingActiveRef.current = true
                runPollingCycle()
            }

            const appStateSubscription = AppState.addEventListener(
                'change',
                handleAppStateChange
            )

            if (isPollingActiveRef.current) {
                runPollingCycle()
            }

            return () => {
                isScreenFocusedRef.current = false
                isPollingActiveRef.current = false
                restartPollingRef.current = null

                if (pollingTimeoutRef.current) {
                    clearTimeout(pollingTimeoutRef.current)
                    pollingTimeoutRef.current = null
                }

                pollingRequestIdRef.current += 1
                pollingAbortControllerRef.current?.abort()
                pollingAbortControllerRef.current = null
                appStateSubscription.remove()
            }
        }, [oocyteCollectionId])
    )

    const restartPolling = React.useCallback(() => {
        restartPollingRef.current?.()
    }, [])

    return {
        data,
        loading,
        error,
        fivData,
        restartPolling,
    }
}
