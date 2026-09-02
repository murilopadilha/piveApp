import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from 'react-native-dropdown-select-list';
import { IPAdress } from "../../components/APIip";
import { listInProgressPregnancyReceivers } from "../../api/pregnancyService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const [recipients, setRecipients] = useState([])
    const [selectedReceiver, setSelectedReceiver] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fiv.id)
    const loadedFivIdRef = React.useRef(null)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    activeFivIdRef.current = fiv.id

    useFocusEffect(
        React.useCallback(() => {
            const currentFivId = fiv.id
            isScreenFocusedRef.current = true

            if (loadedFivIdRef.current !== currentFivId) {
                loadedFivIdRef.current = null
                setRecipients([])
                setSelectedReceiver(null)
                setError(null)
                setHasLoaded(false)
                setLoading(true)
            }

            const fetchRecipients = async () => {
                abortControllerRef.current?.abort()
                const abortController = new AbortController()
                abortControllerRef.current = abortController
                const requestId = ++requestIdRef.current

                setLoading(true)

                try {
                    console.log(fiv)
                    const recipientData = await listInProgressPregnancyReceivers(
                        currentFivId,
                        { signal: abortController.signal }
                    )
                    const formattedRecipients = recipientData.map(recipient => ({
                        key: recipient.id.toString(),
                        value: `${recipient.name} (${recipient.registrationNumber})`
                    }));

                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeFivIdRef.current !== currentFivId
                    ) return

                    setRecipients(formattedRecipients);
                    loadedFivIdRef.current = currentFivId
                    setHasLoaded(true)
                    setError(null)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível buscar as receptoras'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeFivIdRef.current !== currentFivId
                    ) return
                    setError(apiError.message)
                    Alert.alert("Erro", "Não foi possível buscar as receptoras")
                    console.error(apiError.message);
                } finally {
                    if (requestId === requestIdRef.current) {
                        abortControllerRef.current = null
                        if (
                            isScreenFocusedRef.current &&
                            activeFivIdRef.current === currentFivId
                        ) {
                            setLoading(false)
                        }
                    }
                }
            };

            fetchRecipients();

            return () => {
                isScreenFocusedRef.current = false
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [fiv.id])
    )

    if (loading && !hasLoaded) {
        return <ActivityIndicator size="small" color="#092955" />
    }

    const postPregnancy = async () => {
        if (!selectedReceiver) {
            Alert.alert("Erro", "Por favor, selecione uma receptora.")
            return
        }

        const pregnancyData = {
            receiverCattleId: selectedReceiver,
            is_pregnant: true
        }

        try {
            await axios.post(`http://${IPAdress}/pregnancy`, pregnancyData)
            Alert.alert("Sucesso", "Receptora marcada como prenha com sucesso.")
        } catch (error) {
            Alert.alert("Erro", error.response?.data || "Ocorreu um erro ao salvar a prenhez")
            console.error(error)
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Registrar prenhez</Text>
            </View>
            {loading && hasLoaded && (
                <ActivityIndicator size="small" color="#092955" />
            )}
            {error && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {error}
                </Text>
            )}
            <View style={style.content}>
                <Text style={{ marginBottom: 10 }}>Selecionar Receptora:</Text>
                <SelectList 
                    setSelected={setSelectedReceiver}
                    data={recipients}
                    placeholder="Selecione uma receptora"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                />
                {!loading && hasLoaded && !error && recipients.length === 0 && (
                    <Text style={{ textAlign: 'center', marginTop: 10 }}>
                        Nenhuma receptora encontrada.
                    </Text>
                )}
            </View>
            <View style={{display:"flex", flexDirection:"row"}}>
            <TouchableOpacity
                    onPress={() => navigation.navigate('ReceptorasPrenhaz', { fiv: fiv })}
                    style={[style.listButtonSearch, { width: '30%', height: 33, display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '10%' }]}>
                    <FontAwesome6 name="cow" size={20} color="#E0E0E0" />
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Prenhezes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={postPregnancy}
                    style={[style.listButtonSearch, { width: '25%', height: 33, display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '25%' }]}>
                    <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
