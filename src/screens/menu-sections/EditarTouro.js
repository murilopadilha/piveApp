import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";

import { updateBull as updateBullRequest } from "../../api/bullService";
import { API_ERROR_TYPES, normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { donor } = route.params; 
    const [newDonorName, setName] = useState(donor.name)
    const [newDonorBreed, setBreed] = useState(donor.breed)
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber)
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth)
    const [donorId, setDonorId] = useState(donor.id)

    async function updateBull(id, name, registrationNumber) {
        const donorData = {
            "name": name,
            "registrationNumber": registrationNumber
        }

        try {
            const result = await updateBullRequest(id, donorData)
            console.log(result)
            Alert.alert('Sucesso', 'Touro atualizado com sucesso!')
            navigation.goBack()
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível atualizar os dados.')
            if (apiError.isCanceled) return
            if (apiError.type === API_ERROR_TYPES.HTTP && apiError.status !== 409) {
                Alert.alert('Erro', 'Erro ao enviar dados')
                return
            }
            Alert.alert('Erro', apiError.message)
        }
    }

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
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
                    value={newDonorName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação do touro"
                    placeholderTextColor="#888"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <View>
                    <TouchableOpacity 
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
