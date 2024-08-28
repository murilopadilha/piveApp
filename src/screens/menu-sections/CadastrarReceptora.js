import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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

        try {
            const response = await fetch(`http://${IPAdress}/receiver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(receiverData)
            })

            if (response.ok) {
                const receivers = await response.json()
                Alert.alert('Sucesso', 'Receptora cadastrada com sucesso!')
                
                setName('')
                setBreed('')
                setIdentification('')
            } else if (response.status == '409') {
                const errorMessage = await response.text()
                Alert.alert('Erro', errorMessage);
            } else {
                Alert.alert('Erro', "Erro ao enviar dados")
            }
        } catch (error) {
            console.error('Erro dnv:', error)
            Alert.alert('Erro', 'Ocorreu um erro')
        }
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Cadastro da receptora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da receptora"
                    value={newReceiverName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da receptora"
                    value={newReceiverBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da receptora"
                    value={newReceiverIdentification}
                    style={style.input}
                    onChangeText={setIdentification}
                />
                <View>
                    <TouchableOpacity 
                        style={[style.button, {display: 'flex', flexDirection: 'row'}]} 
                        onPress={() => postReceivers(newReceiverName, newReceiverBreed, newReceiverIdentification)}
                    >
                        <MaterialIcons name="done" size={20} color="#fff" />
                        <Text style={[style.buttonText, {marginLeft: 5, paddingBottom: 2}]}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
