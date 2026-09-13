import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { createEmbryoTransfer } from "../../api/transferService";
import { normalizeApiError } from "../../api/errors";
import EmbryoTransferActions from '../../features/pive/components/EmbryoTransferActions';
import EmbryoTransferSelectors from '../../features/pive/components/EmbryoTransferSelectors';
import useEmbryoTransferData from '../../features/pive/hooks/useEmbryoTransferData';
import piveStyles from '../../features/pive/styles';

export default ({ route, navigation }) => {
    const { fiv, id } = route.params
    const [newFarm, setFarm] = useState('')
    const [selectedTransfer, setSelectedTransfer] = useState(null) 
    const [selectedReceiver, setSelectedReceiver] = useState(null)  
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const isMountedRef = React.useRef(true)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)
    const activeFivIdRef = React.useRef(fiv.id)
    const activeCollectionIdRef = React.useRef(id)
    const handleLoadError = React.useCallback((message) => {
        Alert.alert("Erro", message)
    }, [])
    const handleTransfersContextReset = React.useCallback(() => {
        setSelectedTransfer(null)
        setSelectedReceiver(null)
        setFarm('')
    }, [])
    const {
        oocyteCollection,
        loadedOocyteCollectionId,
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
        reloadOocyteCollection,
        reloadRecipients,
    } = useEmbryoTransferData({
        fivId: fiv.id,
        collectionId: id,
        onLoadError: handleLoadError,
        onTransfersContextReset: handleTransfersContextReset,
    })

    activeFivIdRef.current = fiv.id
    activeCollectionIdRef.current = id

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
        }, [fiv.id, id])
    )

    const handleTransferSelect = selected => {
        console.log("Transferência selecionada:", selected);
        setSelectedTransfer(selected);

        const selectedData = transfers.find(item => item.id.toString() === selected)
        console.log("Dados da transferência selecionada:", selectedData)

        if (selectedData) {
            setFarm(selectedData.farm);
        } else {
            console.log("Transferência não encontrada.");
        }
    }

    const handleRecipientSelect = selected => {
        console.log("Receptora selecionada:", selected);
        const selectedData = recipients.find(item => item.id.toString() === selected);
        if (selectedData) {
            setSelectedReceiver(selectedData.id);
        }
    }

    const postTransfer = async () => {
        if (isSubmittingRef.current) return

        const productionId = loadedOocyteCollectionId === id
            ? oocyteCollection?.embryoProduction?.id
            : null

        if (!productionId) {
            Alert.alert("Erro", "Não foi possível localizar a produção embrionária necessária para esta operação.")
            return;
        }

        if (!selectedTransfer || !selectedReceiver) {
            Alert.alert("Erro", "Por favor, selecione todos os campos.")
            return;
        }

        const transferData = {
            productionId,
            transferId: selectedTransfer, 
            receiverId: selectedReceiver
        }

        const submittedFivId = fiv.id
        const submittedCollectionId = id
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await createEmbryoTransfer(transferData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId ||
                activeCollectionIdRef.current !== submittedCollectionId
            ) return

            await Promise.all([
                reloadOocyteCollection(submittedCollectionId),
                reloadRecipients(),
            ])

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId ||
                activeCollectionIdRef.current !== submittedCollectionId
            ) return

            Alert.alert("Successo", "Transferência salva com sucesso.")
        } catch (requestError) {
            const apiError = normalizeApiError(requestError, 'Ocorreu um erro')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId ||
                activeCollectionIdRef.current !== submittedCollectionId
            ) return

            Alert.alert("Erro", apiError.message)
            console.error(apiError.message)
        } finally {
            if (mutationAbortControllerRef.current === abortController) {
                mutationAbortControllerRef.current = null
            }
            isSubmittingRef.current = false
            if (isMountedRef.current) {
                setIsSubmitting(false)
            }
        }
    }

    const initialLoading =
        (transfersLoading && !hasLoadedTransfers) ||
        (collectionLoading && !hasLoadedCollection) ||
        (recipientsLoading && !hasLoadedRecipients)

    if (initialLoading) {
        return <ActivityIndicator size="small" color="#092955" />
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, piveStyles.sectionHeader]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={piveStyles.backButton}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, piveStyles.sectionTitle]}>Embriões Transferidos</Text>
            </View>
            {(transfersLoading || collectionLoading || recipientsLoading) && (
                <ActivityIndicator size="small" color="#092955" />
            )}
            {transfersError && (
                <Text style={piveStyles.loadError}>
                    Error: {transfersError}
                </Text>
            )}
            {collectionError && (
                <Text style={piveStyles.loadError}>
                    Error: {collectionError}
                </Text>
            )}
            {recipientsError && (
                <Text style={piveStyles.loadError}>
                    Error: {recipientsError}
                </Text>
            )}
            <EmbryoTransferSelectors
                transferOptions={transferOptions}
                recipientOptions={recipientOptions}
                showNoTransfers={
                    !transfersLoading &&
                    hasLoadedTransfers &&
                    !transfersError &&
                    transfers.length === 0
                }
                showNoRecipients={
                    !recipientsLoading &&
                    hasLoadedRecipients &&
                    !recipientsError &&
                    recipients.length === 0
                }
                onTransferSelect={handleTransferSelect}
                onRecipientSelect={handleRecipientSelect}
            />
            <EmbryoTransferActions
                isSubmitting={isSubmitting}
                onViewTransfers={() => navigation.navigate('Transferencia', { fiv: fiv })}
                onSubmit={postTransfer}
            />
        </SafeAreaView>
    )
}
