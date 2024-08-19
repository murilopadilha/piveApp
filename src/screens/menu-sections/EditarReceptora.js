import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { donor } = route.params
    const [newDonorName, setName] = useState(donor.name)
    const [newDonorBreed, setBreed] = useState(donor.breed);
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber)
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth)
    const [donorId, setDonorId] = useState(donor.id)

    async function updateReceiver(id, name, breed, registrationNumber) {
        const donorData = {
            "name": name,
            "breed": breed,
            "registrationNumber": registrationNumber
        }

        try {
            const response = await fetch(`http://${IPAdress}/receiver/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donorData)
            });
            const result = await response.json()
            console.log(result)
            Alert.alert('Sucesso', 'Receptora atualizada com sucesso!')
            navigation.goBack()
        } catch (error) {
            console.error('Erro ao atualizar o doador:', error)
            Alert.alert('Erro', 'Não foi possível atualizar os dados.')
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
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Editar Receptora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da Receptora"
                    value={newDonorName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da Receptora"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da Receptora"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <View>
                    <TouchableOpacity 
                        style={style.button} 
                        onPress={confirmUpdate}
                    >
                        <Text style={style.buttonText}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
