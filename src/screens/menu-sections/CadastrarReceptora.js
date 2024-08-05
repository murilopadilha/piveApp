import React, {useState} from "react";
import { Text, TextInput, View, TouchableOpacity } from "react-native";

import AntDesign from '@expo/vector-icons/AntDesign';

import style from "../../components/style";

export const newReceiverName = ''
export const newReceiverBreed = ''
export const newReceiverIndentification = ''

export default ({ navigation }) => {
    const [newReceiverName, setName] = useState(newReceiverName)
    const [newReceiverBreed, setBreed] = useState(newReceiverBreed)
    const [newReceiverIndentification, setNumber] = useState(newReceiverIndentification)

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
                <Text style={style.titleText}>Cadastro da Receptora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput                     
                    placeholder="Nome da Receptora"
                    value={newReceiverName}
                    style={style.input}
                    onChangeText={(newReceiverName => setName(newReceiverName))}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput 
                    placeholder="Raça da Receptora"
                    value={newReceiverBreed}
                    style={style.input}
                    onChangeText={(newReceiverBreed => setBreed(newReceiverBreed))}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput 
                    placeholder="Identificação da Receptora"
                    value={newReceiverIndentification}
                    style={style.input}
                    onChangeText={(newReceiverIndentification => setNumber(newReceiverIndentification))}
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