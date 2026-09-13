import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

import { updateDonor as updateDonorRequest } from "../../api/donorService";
import { API_ERROR_TYPES, normalizeApiError } from "../../api/errors";

const parseLocalDate = (value) => {
    const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    if (!match) {
        return new Date()
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const date = new Date(year, month - 1, day)

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return new Date()
    }

    return date
}

export default ({ route, navigation }) => {
    const { donor } = route.params
    const [newDonorName, setName] = useState(donor.name)
    const [newDonorBreed, setBreed] = useState(donor.breed)
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber)
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth)
    const [donorId, setDonorId] = useState(donor.id)
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isSubmittingRef = React.useRef(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)

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
        }, [])
    )

    async function updateDonor(id, name, breed, registrationNumber, birth) {
        if (isSubmittingRef.current) return

        const donorData = {
            "name": name,
            "breed": breed,
            "birth": birth,
            "registrationNumber": registrationNumber
        }
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            const result = await updateDonorRequest(id, donorData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return

            console.log(result)
            Alert.alert('Sucesso', 'Doadora atualizada com sucesso!')
            navigation.goBack()
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível atualizar os dados.')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return
            console.error('Erro ao atualizar o doador:', apiError.message)
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

    const confirmUpdate = () => {
        if (isSubmittingRef.current) return

        Alert.alert(
            "Confirmar Edição",
            "Você tem certeza de que deseja editar os dados da doadora?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Editar",
                    onPress: () => updateDonor(donorId, newDonorName, newDonorBreed, newDonorIndentification, newDonorDateOfBirth)
                }
            ]
        )
    }

    const showDatePicker = () => {
        setDatePickerVisibility(true)
    }

    const hideDatePicker = () => {
        setDatePickerVisibility(false)
    }

    const handleConfirm = (date) => {
        const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`
        setDateOfBirth(formattedDate)
        hideDatePicker()
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '5%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Editar doadora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da doadora"
                    placeholderTextColor="#888"
                    value={newDonorName == null ? '' : String(newDonorName)}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da doadora"
                    placeholderTextColor="#888"
                    value={newDonorBreed == null ? '' : String(newDonorBreed)}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da doadora"
                    placeholderTextColor="#888"
                    value={newDonorIndentification == null ? '' : String(newDonorIndentification)}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <Text style={style.label}>Data de nascimento:</Text>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{newDonorDateOfBirth || "Selecione a data"}</Text>
                    <AntDesign style={{paddingLeft: 90}} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    date={parseLocalDate(newDonorDateOfBirth)}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
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
