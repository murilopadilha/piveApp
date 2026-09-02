import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { IPAdress } from "../../components/APIip";
import { SelectList } from 'react-native-dropdown-select-list'; 
import { listTransfersByFiv } from "../../api/transferService";
import { getOocyteCollection } from "../../api/oocyteCollectionService";
import { listAvailableReceivers } from "../../api/receiverService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { fiv, id } = route.params
    const [newFarm, setFarm] = useState('')
    const [oocyteCollection, setOocyteCollection] = useState(null)
    const [transfers, setTransfers] = useState([])
    const [recipients, setRecipients] = useState([]) 
    const [selectedTransfer, setSelectedTransfer] = useState(null) 
    const [selectedReceiver, setSelectedReceiver] = useState(null)  
    const [transfersLoading, setTransfersLoading] = useState(true)
    const [transfersError, setTransfersError] = useState(null)
    const [hasLoadedTransfers, setHasLoadedTransfers] = useState(false)
    const [collectionLoading, setCollectionLoading] = useState(true)
    const [collectionError, setCollectionError] = useState(null)
    const [hasLoadedCollection, setHasLoadedCollection] = useState(false)
    const [recipientsLoading, setRecipientsLoading] = useState(true)
    const [recipientsError, setRecipientsError] = useState(null)
    const [hasLoadedRecipients, setHasLoadedRecipients] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fiv.id)
    const activeCollectionIdRef = React.useRef(id)
    const loadedTransfersFivIdRef = React.useRef(null)
    const oocyteCollectionIdRef = React.useRef(null)
    const transfersAbortControllerRef = React.useRef(null)
    const transfersRequestIdRef = React.useRef(0)
    const collectionAbortControllerRef = React.useRef(null)
    const collectionRequestIdRef = React.useRef(0)
    const recipientsAbortControllerRef = React.useRef(null)
    const recipientsRequestIdRef = React.useRef(0)

    activeFivIdRef.current = fiv.id
    activeCollectionIdRef.current = id

    useFocusEffect(
        React.useCallback(() => {
            const currentFivId = fiv.id
            const currentCollectionId = id
            isScreenFocusedRef.current = true

            if (loadedTransfersFivIdRef.current !== currentFivId) {
                loadedTransfersFivIdRef.current = null
                setTransfers([])
                setSelectedTransfer(null)
                setSelectedReceiver(null)
                setFarm('')
                setTransfersError(null)
                setHasLoadedTransfers(false)
                setTransfersLoading(true)
            }

            if (oocyteCollectionIdRef.current !== currentCollectionId) {
                oocyteCollectionIdRef.current = null
                setOocyteCollection(null)
                setCollectionError(null)
                setHasLoadedCollection(false)
                setCollectionLoading(true)
            }

            const fetchTransfers = async () => {
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
                    Alert.alert("Erro", apiError.message)
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
            }

            const fetchOocyteCollection = async () => {
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
                    Alert.alert("Erro", apiError.message)
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
            }

            const fetchRecipients = async () => {
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
                    Alert.alert("Erro", apiError.message)
                } finally {
                    if (requestId === recipientsRequestIdRef.current) {
                        recipientsAbortControllerRef.current = null
                        if (isScreenFocusedRef.current) {
                            setRecipientsLoading(false)
                        }
                    }
                }
            }

            fetchTransfers()
            fetchRecipients()
            fetchOocyteCollection()

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
        }, [fiv.id, id])
    )

    const postTransfer = async () => {
        const productionId = oocyteCollectionIdRef.current === id
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

        try {
            const response = await axios.post(`http://${IPAdress}/embryo/transfer`, transferData)
            Alert.alert("Successo", "Transferência salva com sucesso.")
        } catch (error) {
            Alert.alert("Erro", error.response?.data || "Ocorreu um erro")
            console.error(error)
        }
    }

    const transferOptions = transfers.map(transfer => ({
        key: transfer.id.toString(), 
        value: `${transfer.farm} (${transfer.date})`
    }))
    
    const recipientOptions = recipients.map(recipient => ({
        key: recipient.id.toString(),
        value: `${recipient.name} (${recipient.registrationNumber})`
    }))

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
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, { marginLeft: 5, paddingTop: '1%' }]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
