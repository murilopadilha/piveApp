import React, {useState} from "react";
import { Text, TextInput, View, TouchableOpacity } from "react-native";

import AntDesign from '@expo/vector-icons/AntDesign';

import style from "../../components/style";

export const newBullName = ''
export const newBullIndentification = ''

export default ({ navigation }) => {
    const [newBullName, setName] = useState(newBullName)
    const [newBullIndentification, setNumber] = useState(newBullIndentification)

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => {
                    navigation.navigate('Menu')
                }}>
                    <View style={{marginRight: 50}}>
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
                    onChangeText={(newBullName => setName(newBullName))}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput 
                    placeholder="Identificação do Touro"
                    value={newBullIndentification}
                    style={style.input}
                    onChangeText={(newBullIndentification => setNumber(newBullIndentification))}
                />
                <View >
                    <TouchableOpacity style={style.button} onPress={() => alert(`Salvo com sucesso!`)}>
                        <Text style={style.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}