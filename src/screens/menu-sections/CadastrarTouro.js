import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";

import { IPAdress } from "../../components/APIip";

export default ({ navigation }) => {
    const [newBullName, setName] = useState('')
    const [newBullIndentification, setNumber] = useState('')

    async function postBulls(name, registrationNumber) {
        const bullsData = {
            "name": name,
            "registrationNumber": registrationNumber
        }

        try {
            const response = await fetch(`http://${IPAdress}/bull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bullsData)
            })

            if (response.ok) { 
                const result = await response.json()
                
                Alert.alert(
                    "Sucesso",
                    "Cadastro realizado com sucesso!",
                    [{ text: "OK" }]
                );
                setName('')
                setNumber('')
            } else {
                throw new Error('Falha no cadastro.')
            }
        } catch (error) {
            Alert.alert('Erro', error.message)
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
                <Text style={style.titleText}>Cadastro do Touro</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome do Touro"
                    value={newBullName}
                    style={style.input}
                    onChangeText={(text) => setName(text)}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação do Touro"
                    value={newBullIndentification}
                    style={style.input}
                    onChangeText={(text) => setNumber(text)}
                />
                <View>
                    <TouchableOpacity
                        style={style.button}
                        onPress={() => postBulls(newBullName, newBullIndentification)}
                    >
                        <Text style={style.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
