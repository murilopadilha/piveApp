import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import piveStyles from "../../features/pive/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createTransfer } from "../../api/transferService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { fiv } = route.params 
    const [newNumber, setNumber] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [newDate, setDate] = useState('')
    const [newFarmName, setFarmName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)
    const activeFivIdRef = React.useRef(fiv.id)
    const responsibleRef = React.useRef(newNumber)
    const dateRef = React.useRef(newDate)
    const farmRef = React.useRef(newFarmName)

    activeFivIdRef.current = fiv.id
    responsibleRef.current = newNumber
    dateRef.current = newDate
    farmRef.current = newFarmName

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
        }, [fiv.id])
    )

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(false)
        if (event.type === 'dismissed' || !selectedDate) return

        const currentDate = selectedDate
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
        dateRef.current = formattedDate
        setDate(formattedDate)
    }

    const postTransfer = async () => {
        if (isSubmittingRef.current) return

        const submittedFivId = fiv.id
        const submittedDate = newDate
        const submittedResponsible = newNumber
        const submittedFarm = newFarmName
        const transferData = {
            fivId: submittedFivId,
            date: submittedDate,
            responsible: submittedResponsible,
            farm: submittedFarm
        }

        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await createTransfer(transferData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
            ) return

            Alert.alert("Sucesso", "Transferência salva com sucesso.")

            if (responsibleRef.current === submittedResponsible) {
                responsibleRef.current = ''
                setNumber('')
            }
            if (dateRef.current === submittedDate) {
                dateRef.current = ''
                setDate('')
            }
            if (farmRef.current === submittedFarm) {
                farmRef.current = ''
                setFarmName('')
            }
        } catch (requestError) {
            const apiError = normalizeApiError(requestError, 'Ocorreu um erro')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeFivIdRef.current !== submittedFivId
            ) return

            Alert.alert("Erro", apiError.message)
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={piveStyles.backButton}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, piveStyles.sectionTitle]}>Transferência</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Data da transferência:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={style.dateInput}>
                    <Text style={style.dateText}>{newDate || "Selecione a data"}</Text>
                    <AntDesign style={{ paddingLeft: '20%' }} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode='date'
                        display={Platform.OS === 'ios' ? 'default' : 'default'}
                        onChange={onChangeDate}
                    />
                )}
                <Text style={style.label}>Responsável:</Text>
                <TextInput
                    placeholder="Nome do responsável"
                    placeholderTextColor="#888"
                    value={newNumber}
                    style={style.input}
                    onChangeText={(text) => {
                        responsibleRef.current = text
                        setNumber(text)
                    }}
                />
                <Text style={style.label}>Fazenda:</Text>
                <TextInput
                    placeholder="Nome da fazenda"
                    placeholderTextColor="#888"
                    value={newFarmName}
                    style={style.input}
                    onChangeText={(text) => {
                        farmRef.current = text
                        setFarmName(text)
                    }}
                />
            </View>
            <View>
                <TouchableOpacity
                    style={[style.button, { display: 'flex', flexDirection: 'row', marginLeft: '40%', marginTop: '5%' }]}
                    onPress={postTransfer}
                    disabled={isSubmitting}
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, { marginLeft: 5, paddingBottom: 2 }]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
