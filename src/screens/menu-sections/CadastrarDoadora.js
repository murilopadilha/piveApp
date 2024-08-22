import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";

import { IPAdress } from "../../components/APIip";

export default ({ navigation }) => {
    const [newDonorName, setName] = useState('')
    const [newDonorBreed, setBreed] = useState('')
    const [newDonorIndentification, setNumber] = useState('')
    const [newDonorDateOfBirth, setDateOfBirth] = useState('')

    async function postDonors(name, breed, registrationNumber, birth) {
        const receiverData = {
            "name": name,
            "breed": breed,
            "birth": birth,
            "registrationNumber": registrationNumber
        }

        try {
            const response = await fetch(`http://${IPAdress}/donor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(receiverData)
            })
            const receivers = await response.json()
            console.log(receivers)
            alert('Doadora cadastrada com sucesso!')
            
            setName('')
            setBreed('')
            setNumber('')
            setDateOfBirth('')
        } catch (error) {
            console.error('Erro ao salvar o doador:', error)
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

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Cadastro da Doadora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da Doadora"
                    value={newDonorName}
                    style={style.input}
                    onChangeText={(text) => setName(text)}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da Doadora"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={(text) => setBreed(text)}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da Doadora"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={(text) => setNumber(text)}
                />
                <Text style={style.label}>Data de Nascimento:</Text>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{newDonorDateOfBirth || "Selecione a Data"}</Text>
                </TouchableOpacity>
                <View>
                    <TouchableOpacity 
                        style={style.button} 
                        onPress={() => postDonors(newDonorName, newDonorBreed, newDonorIndentification, newDonorDateOfBirth)}
                    >
                        <Text style={style.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
