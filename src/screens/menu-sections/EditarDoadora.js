import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { donor } = route.params
    const [newDonorName, setName] = useState(donor.name)
    const [newDonorBreed, setBreed] = useState(donor.breed)
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber)
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth)
    const [donorId, setDonorId] = useState(donor.id)

    async function updateDonor(id, name, breed, registrationNumber, birth) {
        const donorData = {
            "name": name,
            "breed": breed,
            "birth": birth,
            "registrationNumber": registrationNumber
        }

        try {
            const response = await fetch(`http://${IPAdress}/donor/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donorData)
            })
            if (response.ok) {
                const result = await response.json();
                console.log(result)
                Alert.alert('Sucesso', 'Doadora atualizada com sucesso!')
                navigation.goBack()
            } else if (response.status == '409') {
                const errorMessage = await response.text()
                Alert.alert('Erro', errorMessage);
            } else {
                Alert.alert('Erro', "Erro ao enviar dados")
            }
        } catch (error) {
            console.error('Erro ao atualizar o doador:', error)
            Alert.alert('Erro', 'Não foi possível atualizar os dados.')
        }
    }

    const confirmUpdate = () => {
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
                    value={newDonorName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da doadora"
                    placeholderTextColor="#888"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da doadora"
                    placeholderTextColor="#888"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <Text style={style.label}>Data de nascimento:</Text>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{newDonorDateOfBirth || "Selecione a data"}</Text>
                    <AntDesign style={{paddingLeft: 90}} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
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
