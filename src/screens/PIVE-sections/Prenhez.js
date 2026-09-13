import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import piveStyles from "../../features/pive/styles";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from 'react-native-dropdown-select-list';
import { createPregnancy, listInProgressPregnancyReceivers } from "../../api/pregnancyService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const [recipients, setRecipients] = useState([])
    const [selectedReceiver, setSelectedReceiver] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const isMountedRef = React.useRef(true)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)
    const activeFivIdRef = React.useRef(fiv.id)
    const loadedFivIdRef = React.useRef(null)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    activeFivIdRef.current = fiv.id

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            mutationAbortControllerRef.current?.abort()
            mutationAbortControllerRef.current = null
        }
    }, [])

    const fetchRecipients = React.useCallback(async (currentFivId) => {
        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true)

        try {
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
    }, [])

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

            fetchRecipients(currentFivId);

            return () => {
                isScreenFocusedRef.current = false
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null

                mutationAbortControllerRef.current?.abort()
                mutationAbortControllerRef.current = null
            }
        }, [fiv.id, fetchRecipients])
    )

    if (loading && !hasLoaded) {
        return <ActivityIndicator size="small" color="#092955" />
    }

    const postPregnancy = async () => {
        if (isSubmittingRef.current) return

        if (!selectedReceiver) {
            Alert.alert("Erro", "Por favor, selecione uma receptora.")
            return
        }

        const submittedFivId = fiv.id
        const submittedReceiverId = selectedReceiver
        const submittedPregnancyResult = true
        const pregnancyData = {
            receiverCattleId: submittedReceiverId,
            is_pregnant: submittedPregnancyResult
        }

        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await createPregnancy(pregnancyData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
            ) return

            await fetchRecipients(submittedFivId)

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
            ) return

            Alert.alert("Sucesso", "Receptora marcada como prenha com sucesso.")
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Ocorreu um erro ao salvar a prenhez'
            )
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
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

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, piveStyles.sectionHeader]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={piveStyles.backButton}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, piveStyles.sectionTitle]}>Registrar prenhez</Text>
            </View>
            {loading && hasLoaded && (
                <ActivityIndicator size="small" color="#092955" />
            )}
            {error && (
                <Text style={piveStyles.loadError}>
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
                <TouchableOpacity
                    onPress={postPregnancy}
                    disabled={isSubmitting}
                    style={[style.listButtonSearch, { width: '25%', height: 33, display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '25%' }]}>
                    <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
