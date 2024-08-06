import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";

export default ({ navigation }) => {
    const [newReceiverName, setName] = useState('')
    const [newReceiverBreed, setBreed] = useState('')
    const [newReceiverIdentification, setIdentification] = useState('')

    async function postReceivers(name, breed, registrationNumber) {
        const receiverData = {
        "name": name,
        "breed": breed,
        "registrationNumber": registrationNumber
        }

        const response = await fetch('http://172.20.7.184:8080/receiver', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiverData)
        })
        const receivers = await response.json()
        alert('Receptora cadastrada com sucesso!')
    }    

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Cadastro da Receptora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da Receptora"
                    value={newReceiverName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da Receptora"
                    value={newReceiverBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da Receptora"
                    value={newReceiverIdentification}
                    style={style.input}
                    onChangeText={setIdentification}
                />
                <View>
                    <TouchableOpacity style={style.button} onPress={() => postReceivers(newReceiverName, newReceiverBreed, newReceiverIdentification)}>
                        <Text style={style.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
