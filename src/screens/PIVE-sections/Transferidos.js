import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SelectList } from 'react-native-dropdown-select-list'; 
import { createEmbryoTransfer } from "../../api/transferService";
import { normalizeApiError } from "../../api/errors";
import useEmbryoTransferData from '../../features/pive/hooks/useEmbryoTransferData';

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
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Embriões Transferidos</Text>
            </View>
            {(transfersLoading || collectionLoading || recipientsLoading) && (
                <ActivityIndicator size="small" color="#092955" />
            )}
            {transfersError && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {transfersError}
                </Text>
            )}
            {collectionError && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {collectionError}
                </Text>
            )}
            {recipientsError && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {recipientsError}
                </Text>
            )}
            <View style={style.content}>
                <Text style={{ marginBottom: 10 }}>Selecionar Transferência:</Text>
                <SelectList 
                    setSelected={selected => {
                        console.log("Transferência selecionada:", selected);
                        setSelectedTransfer(selected);

                        const selectedData = transfers.find(item => item.id.toString() === selected)
                        console.log("Dados da transferência selecionada:", selectedData)

                        if (selectedData) {
                            setFarm(selectedData.farm);
                        } else {
                            console.log("Transferência não encontrada.");
                        }
                    }}
                    data={transferOptions}
                    placeholder="Selecione uma transferência"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                />
                {!transfersLoading &&
                    hasLoadedTransfers &&
                    !transfersError &&
                    transfers.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma transferência encontrada.
                        </Text>
                    )}
                
                <Text style={{ marginVertical: 10 }}>Selecionar Receptora:</Text>
                <SelectList 
                    setSelected={selected => {
                        console.log("Receptora selecionada:", selected);
                        const selectedData = recipients.find(item => item.id.toString() === selected);
                        if (selectedData) {
                            setSelectedReceiver(selectedData.id);
                        }
                    }}
                    data={recipientOptions}
                    placeholder="Selecione uma receptora"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                />
                {!recipientsLoading &&
                    hasLoadedRecipients &&
                    !recipientsError &&
                    recipients.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma receptora disponível.
                        </Text>
                    )}
            </View>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Transferencia', { fiv: fiv })}
                    style={[style.listButtonEdit, { marginLeft: '10%', marginTop: '5%', height: '60%', width: '35%', paddingTop: '1%' }]}
                >
                    <FontAwesome6 name="clipboard-list" size={20} color="#E0E0E0" />
                    <Text style={{ color: '#E0E0E0', paddingTop: 1, paddingLeft: 5 }}>Transferências</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[style.listButtonEdit, { marginLeft: '20%', marginTop: '5%', height: '60%', width: '23%', paddingTop: '1%' }]}
                    onPress={postTransfer}
                    disabled={isSubmitting}
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, { marginLeft: 5, paddingTop: '1%' }]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
