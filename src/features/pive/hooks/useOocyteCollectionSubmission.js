import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { normalizeApiError } from '../../../api/errors'
import { createOocyteCollection } from '../../../api/oocyteCollectionService'

export default function useOocyteCollectionSubmission({ fivId }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fivId)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)

    activeFivIdRef.current = fivId

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
        }, [fivId])
    )

    const submitOocyteCollection = React.useCallback(async ({
        payload,
        errorFallbackMessage,
        onSuccess,
        onError,
    }) => {
        if (isSubmittingRef.current || !isScreenFocusedRef.current) return

        const submittedFivId = payload.fivId
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await createOocyteCollection(payload, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
            ) return

            onSuccess?.()
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                errorFallbackMessage
            )
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
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
        submitOocyteCollection,
    }
}
