import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from "react-native-safe-area-context";

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
                const result = await response.json();
                
                Alert.alert(
                    "Sucesso",
                    "Cadastro realizado com sucesso!",
                    [{ text: "OK" }]
                )

                setName('')
                setNumber('')
            } else if (response.status == '409') {
                const errorMessage = await response.text()
                Alert.alert('Erro', errorMessage);
            } else {
                Alert.alert('Erro', "Erro ao enviar dados")
            }
        } catch (error) {
            Alert.alert('Erro', error.message)
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
                <Text style={style.titleText}>Cadastro do touro</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome do touro"
                    placeholderTextColor="#888"
                    value={newBullName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação do touro"
                    placeholderTextColor="#888"
                    value={newBullIndentification}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <View>
                    <TouchableOpacity
                        style={[style.button, {display: 'flex', flexDirection: 'row'}]}
                        onPress={() => postBulls(newBullName, newBullIndentification)}
                    >
                        <MaterialIcons name="done" size={20} color="#fff" />
                        <Text style={[style.buttonText, {marginLeft: 5, paddingBottom: 2}]}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}
