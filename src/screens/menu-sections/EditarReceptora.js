import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

import { updateReceiver as updateReceiverRequest } from "../../api/receiverService";
import { API_ERROR_TYPES, normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { donor } = route.params
    const [newDonorName, setName] = useState(donor.name)
    const [newDonorBreed, setBreed] = useState(donor.breed);
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber)
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth)
    const [donorId, setDonorId] = useState(donor.id)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isSubmittingRef = React.useRef(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)

    useEffect(() => {
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
        }, [])
    )

    async function updateReceiver(id, name, breed, registrationNumber) {
        if (isSubmittingRef.current) return

        const donorData = {
            "name": name,
            "breed": breed,
            "registrationNumber": registrationNumber
        }
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            const result = await updateReceiverRequest(id, donorData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return

            console.log(result)
            Alert.alert('Sucesso', 'Receptora atualizada com sucesso!')
            navigation.goBack()
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível atualizar os dados.')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return
            if (apiError.type === API_ERROR_TYPES.HTTP && apiError.status !== 409) {
                Alert.alert('Erro', 'Erro ao enviar dados')
                return
            }
            Alert.alert('Erro', apiError.message)
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

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date()
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
        setDateOfBirth(formattedDate)
    }

    const showDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: onChangeDate,
        })
    }

    function confirmUpdate() {
        if (isSubmittingRef.current) return

        Alert.alert(
            "Confirmar Edição",
            "Você tem certeza de que deseja editar os dados da receptora?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Editar",
                    onPress: () => updateReceiver(donorId, newDonorName, newDonorBreed, newDonorIndentification, newDonorDateOfBirth)
                }
            ]
        )
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '5%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Editar receptora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da receptora"
                    placeholderTextColor="#888"
                    value={newDonorName == null ? '' : String(newDonorName)}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da receptora"
                    placeholderTextColor="#888"
                    value={newDonorBreed == null ? '' : String(newDonorBreed)}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da receptora"
                    placeholderTextColor="#888"
                    value={newDonorIndentification == null ? '' : String(newDonorIndentification)}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <View>
                    <TouchableOpacity 
                        disabled={isSubmitting}
                        style={[style.button, {display: 'flex', flexDirection: 'row'}]} 
                        onPress={confirmUpdate} 
                    >
                        <Octicons name="pencil" size={20} color="#fff" />
                        <Text style={[style.buttonText, {paddingLeft: 6, paddingBottom: 2}]}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}
