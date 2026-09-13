import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

import { updateBull as updateBullRequest } from "../../api/bullService";
import { API_ERROR_TYPES, normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { donor } = route.params; 
    const [newDonorName, setName] = useState(donor.name)
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber)
    const [donorId] = useState(donor.id)
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

    async function updateBull(id, name, registrationNumber) {
        if (isSubmittingRef.current) return

        const donorData = {
            "name": name,
            "registrationNumber": registrationNumber
        }
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await updateBullRequest(id, donorData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return

            Alert.alert('Sucesso', 'Touro atualizado com sucesso!')
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

    function confirmUpdate() {
        if (isSubmittingRef.current) return

        Alert.alert(
            "Confirmar Edição",
            "Você tem certeza de que deseja editar os dados do touro?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Editar",
                    onPress: () => updateBull(donorId, newDonorName, newDonorIndentification)
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
                <Text style={style.titleText}>Editar touro</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome do touro"
                    placeholderTextColor="#888"
                    value={newDonorName == null ? '' : String(newDonorName)}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação do touro"
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
