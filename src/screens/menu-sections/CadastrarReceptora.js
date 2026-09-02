import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import { createReceiver } from "../../api/receiverService";
import { API_ERROR_TYPES, normalizeApiError } from "../../api/errors";

export default ({ navigation }) => {
    const [newReceiverName, setName] = useState('')
    const [newReceiverBreed, setBreed] = useState('')
    const [newReceiverIdentification, setIdentification] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isSubmittingRef = React.useRef(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true

            return () => {
                isScreenFocusedRef.current = false
            }
        }, [])
    )

    async function postReceivers(name, breed, registrationNumber) {
        if (isSubmittingRef.current) return

        const receiverData = {
            "name": name,
            "breed": breed,
            "registrationNumber": registrationNumber
        }

        isSubmittingRef.current = true
        setIsSubmitting(true)

        try {
            await createReceiver(receiverData)

            if (!isMountedRef.current || !isScreenFocusedRef.current) return

            Alert.alert('Sucesso', 'Receptora cadastrada com sucesso!')

            setName('')
            setBreed('')
            setIdentification('')
        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro')
            if (apiError.isCanceled) return
            if (!isMountedRef.current || !isScreenFocusedRef.current) return
            if (apiError.type === API_ERROR_TYPES.HTTP && apiError.status !== 409) {
                Alert.alert('Erro', 'Erro ao enviar dados')
                return
            }
            Alert.alert('Erro', apiError.message)
        } finally {
            isSubmittingRef.current = false
            if (isMountedRef.current) {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '8%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Cadastro da receptora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da receptora"
                    placeholderTextColor="#888"
                    value={newReceiverName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da receptora"
                    placeholderTextColor="#888"
                    value={newReceiverBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da receptora"
                    placeholderTextColor="#888"
                    value={newReceiverIdentification}
                    style={style.input}
                    onChangeText={setIdentification}
                />
                <View>
                    <TouchableOpacity 
                        disabled={isSubmitting}
                        style={[style.button, {display: 'flex', flexDirection: 'row'}]} 
                        onPress={() => postReceivers(newReceiverName, newReceiverBreed, newReceiverIdentification)}
                    >
                        <MaterialIcons name="done" size={20} color="#fff" />
                        <Text style={[style.buttonText, {marginLeft: 5, paddingBottom: 2}]}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}
