import React, {useState} from "react";
import { Text, TextInput, View, TouchableOpacity, Button } from "react-native";

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
                <Text style={style.titleText}>Cadastro da Doadora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput                     
                    placeholder="Nome da Receptora"
                    value={newDonorName}
                    style={style.input}
                    onChangeText={(newDonorName => setName(newDonorName))}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput 
                    placeholder="Raça da Receptora"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={(newDonorBreed => setBreed(newDonorBreed))}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput 
                    placeholder="Identificação da Receptora"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={(newDonorIndentification => setNumber(newDonorIndentification))}
                />
                <Text style={style.label}>Data de Nascimento:</Text>
                <View >
                    <TouchableOpacity style={style.button} onPress={() => alert(`Salvo com sucesso!`)}>
                        <Text style={style.buttonText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}