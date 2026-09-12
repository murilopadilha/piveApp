import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { normalizeApiError } from '../../../api/errors'
import { getOocyteCollection } from '../../../api/oocyteCollectionService'

export default function useFrozenEmbryoData({ collectionId, onLoadError }) {
    const [productionId, setProductionId] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [hasLoaded, setHasLoaded] = React.useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const activeCollectionIdRef = React.useRef(collectionId)
    const loadedCollectionIdRef = React.useRef(null)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)
    const onLoadErrorRef = React.useRef(onLoadError)

    activeCollectionIdRef.current = collectionId
    onLoadErrorRef.current = onLoadError

    useFocusEffect(
        React.useCallback(() => {
            const currentCollectionId = collectionId
            isScreenFocusedRef.current = true

            if (loadedCollectionIdRef.current !== currentCollectionId) {
                loadedCollectionIdRef.current = null
                setProductionId(null)
                setError(null)
                setHasLoaded(false)
                setLoading(true)
            }

            const fetchData = async () => {
                abortControllerRef.current?.abort()
                const abortController = new AbortController()
                abortControllerRef.current = abortController
                const requestId = ++requestIdRef.current

                setLoading(true)

                try {
                    const responseData = await getOocyteCollection(currentCollectionId, {
                        signal: abortController.signal,
                    })
                    const fetchedProductionId = responseData?.embryoProduction?.id

                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeCollectionIdRef.current !== currentCollectionId
                    ) return

                    setProductionId(fetchedProductionId ?? null)
                    loadedCollectionIdRef.current = currentCollectionId
                    setHasLoaded(true)
                    setError(null)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar os dados da coleta.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeCollectionIdRef.current !== currentCollectionId
                    ) return
                    setError(apiError.message)
                    onLoadErrorRef.current?.(apiError.message)
                } finally {
                    if (requestId === requestIdRef.current) {
                        abortControllerRef.current = null
                        if (
                            isScreenFocusedRef.current &&
                            activeCollectionIdRef.current === currentCollectionId
                        ) {
                            setLoading(false)
                        }
                    }
                }
            }

            fetchData()

            return () => {
                isScreenFocusedRef.current = false
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [collectionId])
    )

    return {
        productionId,
        loadedCollectionId: loadedCollectionIdRef.current,
        loading,
        error,
        hasLoaded,
    }
}
