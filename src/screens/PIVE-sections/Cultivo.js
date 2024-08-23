import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from "axios";
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const [total, setTotal] = useState('')
    const [viables, setViables] = useState('')
    const { fiv } = route.params

    const handleSave = async () => {
        try {
            const totalEmbryos = parseInt(total, 10) || 0
            const viableEmbryos = parseInt(viables, 10) || 0

            const resp = await axios.post(`http://${IPAdress}/cultivation`, {
                fivId: fiv.id,
                totalEmbryos: totalEmbryos,
                viableEmbryos: viableEmbryos,
            })

            Alert.alert('Successo', 'Coleta salva com sucesso!')
            
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'Failed to save data. Please try again.')
        }
    };

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('ColetaOocitos', { fiv: fiv })}>
                    <View style={{ marginRight: 100 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: 100 }]}>Cultivo</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Total de Embriões:</Text>
                <TextInput
                    placeholder="Número total de embriões"
                    keyboardType="numeric"
                    style={style.input}
                    value={total}
                    onChangeText={setTotal}
                />
                <Text style={style.label}>Embriões Viáveis:</Text>
                <TextInput
                    placeholder="Número de embriões viáveis"
                    keyboardType="numeric"
                    style={style.input}
                    value={viables}
                    onChangeText={setViables}
                />
                <TouchableOpacity 
                    onPress={handleSave} 
                    style={[style.listButtonSearch, { width: 90, height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}
                >
                    <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
