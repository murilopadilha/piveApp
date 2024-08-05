import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Button, StyleSheet } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";

export const newDonorName = ''
export const newDonorBreed = ''
export const newDonorIndentification = ''
export const newDonorDateOfBirth = ''

export default ({ navigation }) => {
    const [newDonorName, setName] = useState(newDonorName)
    const [newDonorBreed, setBreed] = useState(newDonorBreed)
    const [newDonorIndentification, setNumber] = useState(newDonorIndentification)
    const [newDonorDateOfBirth, setDateOfBirth] = useState('')

    async function postDonors(name, breed, registrationNumber) {
        const receiverData = {
        "name": name,
        "breed": breed,
        "birth": onChangeDate(),
        "registrationNumber": registrationNumber
        }

        const response = await fetch('http://192.168.1.183:8080/donor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiverData)
        })
        const receivers = await response.json()
    }  

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date()
        const formattedDate = `${("0" + currentDate.getDate()).slice(-2)}/${("0" + (currentDate.getMonth() + 1)).slice(-2)}/${currentDate.getFullYear()}`
        setDateOfBirth(formattedDate)

        return `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`;
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
                    onChangeText={(newDonorName) => setName(newDonorName)}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da Doadora"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={(newDonorBreed) => setBreed(newDonorBreed)}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da Doadora"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={(newDonorIndentification) => setNumber(newDonorIndentification)}
                />
                <Text style={style.label}>Data de Nascimento:</Text>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{newDonorDateOfBirth || "Selecione a Data"}</Text>
                </TouchableOpacity>
                <View>
                    <TouchableOpacity style={style.button} onPress={() => postDonors(newDonorName, newDonorBreed, newDonorIndentification)}>
                        <Text style={style.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}