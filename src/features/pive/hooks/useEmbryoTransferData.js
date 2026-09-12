import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { normalizeApiError } from '../../../api/errors'
import { getOocyteCollection } from '../../../api/oocyteCollectionService'
import { listAvailableReceivers } from '../../../api/receiverService'
import { listTransfersByFiv } from '../../../api/transferService'

export default function useEmbryoTransferData({
    fivId,
    collectionId,
    onLoadError,
    onTransfersContextReset,
}) {
    const [oocyteCollection, setOocyteCollection] = React.useState(null)
    const [transfers, setTransfers] = React.useState([])
    const [recipients, setRecipients] = React.useState([])
    const [transfersLoading, setTransfersLoading] = React.useState(true)
    const [transfersError, setTransfersError] = React.useState(null)
    const [hasLoadedTransfers, setHasLoadedTransfers] = React.useState(false)
    const [collectionLoading, setCollectionLoading] = React.useState(true)
    const [collectionError, setCollectionError] = React.useState(null)
    const [hasLoadedCollection, setHasLoadedCollection] = React.useState(false)
    const [recipientsLoading, setRecipientsLoading] = React.useState(true)
    const [recipientsError, setRecipientsError] = React.useState(null)
    const [hasLoadedRecipients, setHasLoadedRecipients] = React.useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fivId)
    const activeCollectionIdRef = React.useRef(collectionId)
    const loadedTransfersFivIdRef = React.useRef(null)
    const oocyteCollectionIdRef = React.useRef(null)
    const transfersAbortControllerRef = React.useRef(null)
    const transfersRequestIdRef = React.useRef(0)
    const collectionAbortControllerRef = React.useRef(null)
    const collectionRequestIdRef = React.useRef(0)
    const recipientsAbortControllerRef = React.useRef(null)
    const recipientsRequestIdRef = React.useRef(0)
    const onLoadErrorRef = React.useRef(onLoadError)
    const onTransfersContextResetRef = React.useRef(onTransfersContextReset)

    activeFivIdRef.current = fivId
    activeCollectionIdRef.current = collectionId
    onLoadErrorRef.current = onLoadError
    onTransfersContextResetRef.current = onTransfersContextReset

    const fetchOocyteCollection = React.useCallback(async (currentCollectionId) => {
        collectionAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        collectionAbortControllerRef.current = abortController
        const requestId = ++collectionRequestIdRef.current

        setCollectionLoading(true)

        try {
            const collectionData = await getOocyteCollection(currentCollectionId, {
                signal: abortController.signal,
            })

            if (
                requestId !== collectionRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                activeCollectionIdRef.current !== currentCollectionId
            ) return

            setOocyteCollection(collectionData)
            oocyteCollectionIdRef.current = currentCollectionId
            setHasLoadedCollection(true)
            setCollectionError(null)
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Erro ao buscar coleta de oócitos'
            )
            if (apiError.isCanceled) return
            if (
                requestId !== collectionRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                activeCollectionIdRef.current !== currentCollectionId
            ) return
            setCollectionError(apiError.message)
            onLoadErrorRef.current?.(apiError.message)
            console.error(apiError.message)
        } finally {
            if (requestId === collectionRequestIdRef.current) {
                collectionAbortControllerRef.current = null
                if (
                    isScreenFocusedRef.current &&
                    activeCollectionIdRef.current === currentCollectionId
                ) {
                    setCollectionLoading(false)
                }
            }
        }
    }, [])

    const fetchRecipients = React.useCallback(async () => {
        recipientsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        recipientsAbortControllerRef.current = abortController
        const requestId = ++recipientsRequestIdRef.current

        setRecipientsLoading(true)

        try {
            const recipientData = await listAvailableReceivers({
                signal: abortController.signal,
            })

            if (
                requestId !== recipientsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setRecipients(recipientData)
            setHasLoadedRecipients(true)
            setRecipientsError(null)
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Não foi possível buscar as receptoras'
            )
            if (apiError.isCanceled) return
            if (
                requestId !== recipientsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            setRecipientsError(apiError.message)
            onLoadErrorRef.current?.(apiError.message)
        } finally {
            if (requestId === recipientsRequestIdRef.current) {
                recipientsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setRecipientsLoading(false)
                }
            }
        }
    }, [])

    const fetchTransfers = React.useCallback(async (currentFivId) => {
        transfersAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        transfersAbortControllerRef.current = abortController
        const requestId = ++transfersRequestIdRef.current

        setTransfersLoading(true)

        try {
            const transferData = await listTransfersByFiv(currentFivId, {
                signal: abortController.signal,
            })

            if (
                requestId !== transfersRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                activeFivIdRef.current !== currentFivId
            ) return

            console.log("Transferências recebidas:", transferData)
            setTransfers(transferData)
            loadedTransfersFivIdRef.current = currentFivId
            setHasLoadedTransfers(true)
            setTransfersError(null)
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Erro ao buscar transferências'
            )
            if (apiError.isCanceled) return
            if (
                requestId !== transfersRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                activeFivIdRef.current !== currentFivId
            ) return
            setTransfersError(apiError.message)
            onLoadErrorRef.current?.(apiError.message)
            console.error(apiError.message)
        } finally {
            if (requestId === transfersRequestIdRef.current) {
                transfersAbortControllerRef.current = null
                if (
                    isScreenFocusedRef.current &&
                    activeFivIdRef.current === currentFivId
                ) {
                    setTransfersLoading(false)
                }
            }
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true

            if (loadedTransfersFivIdRef.current !== fivId) {
                loadedTransfersFivIdRef.current = null
                setTransfers([])
                onTransfersContextResetRef.current?.()
                setTransfersError(null)
                setHasLoadedTransfers(false)
                setTransfersLoading(true)
            }

            if (oocyteCollectionIdRef.current !== collectionId) {
                oocyteCollectionIdRef.current = null
                setOocyteCollection(null)
                setCollectionError(null)
                setHasLoadedCollection(false)
                setCollectionLoading(true)
            }

            fetchTransfers(fivId)
            fetchRecipients()
            fetchOocyteCollection(collectionId)

            return () => {
                isScreenFocusedRef.current = false

                transfersRequestIdRef.current += 1
                transfersAbortControllerRef.current?.abort()
                transfersAbortControllerRef.current = null

                collectionRequestIdRef.current += 1
                collectionAbortControllerRef.current?.abort()
                collectionAbortControllerRef.current = null

                recipientsRequestIdRef.current += 1
                recipientsAbortControllerRef.current?.abort()
                recipientsAbortControllerRef.current = null
            }
        }, [collectionId, fetchOocyteCollection, fetchRecipients, fetchTransfers, fivId])
    )

    const transferOptions = transfers.map(transfer => ({
        key: transfer.id.toString(),
        value: `${transfer.farm} (${transfer.date})`
    }))

    const recipientOptions = recipients.map(recipient => ({
        key: recipient.id.toString(),
        value: `${recipient.name} (${recipient.registrationNumber})`
    }))

    return {
        oocyteCollection,
        loadedOocyteCollectionId: oocyteCollectionIdRef.current,
        transfers,
        recipients,
        transferOptions,
        recipientOptions,
        transfersLoading,
        transfersError,
        hasLoadedTransfers,
        collectionLoading,
        collectionError,
        hasLoadedCollection,
        recipientsLoading,
        recipientsError,
        hasLoadedRecipients,
        reloadOocyteCollection: fetchOocyteCollection,
        reloadRecipients: fetchRecipients,
    }
}
