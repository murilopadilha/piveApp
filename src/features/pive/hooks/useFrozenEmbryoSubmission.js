import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { freezeEmbryos } from '../../../api/embryoService'
import { normalizeApiError } from '../../../api/errors'

export default function useFrozenEmbryoSubmission({
    collectionId,
    productionId,
    loadedCollectionId,
}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)
    const activeCollectionIdRef = React.useRef(collectionId)
    const activeProductionIdRef = React.useRef(productionId)
    const loadedCollectionIdRef = React.useRef(loadedCollectionId)

    activeCollectionIdRef.current = collectionId
    activeProductionIdRef.current = productionId
    loadedCollectionIdRef.current = loadedCollectionId

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            mutationAbortControllerRef.current?.abort()
            mutationAbortControllerRef.current = null
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true

            return () => {
                isScreenFocusedRef.current = false
                mutationAbortControllerRef.current?.abort()
                mutationAbortControllerRef.current = null
            }
        }, [collectionId])
    )

    const submitFrozenEmbryos = React.useCallback(async ({
        payload,
        submittedCollectionId,
        onSuccess,
        onError,
    }) => {
        if (isSubmittingRef.current) return

        const submittedProductionId = payload.productionId
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await freezeEmbryos(payload, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeCollectionIdRef.current !== submittedCollectionId ||
                loadedCollectionIdRef.current !== submittedCollectionId ||
                activeProductionIdRef.current !== submittedProductionId
            ) return

            onSuccess?.()
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Não foi possível registrar os embriões congelados.'
            )
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeCollectionIdRef.current !== submittedCollectionId ||
                loadedCollectionIdRef.current !== submittedCollectionId ||
                activeProductionIdRef.current !== submittedProductionId
            ) return

            onError?.(apiError.message)
        } finally {
            if (mutationAbortControllerRef.current === abortController) {
                mutationAbortControllerRef.current = null
            }
            isSubmittingRef.current = false
            if (isMountedRef.current) {
                setIsSubmitting(false)
            }
        }
    }, [])

    return {
        isSubmitting,
        submitFrozenEmbryos,
    }
}
