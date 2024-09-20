import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params 
    const [newNumber, setNumber] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [newDate, setDate] = useState('')
    const [newFarmName, setFarmName] = useState('')

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date()
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
        setDate(formattedDate)
        setShowDatePicker(false)
    }

    const postTransfer = async () => {
        const transferData = {
            fivId: fiv.id,
            date: newDate,
            responsible: newNumber,
            farm: newFarmName
        }

        try {
            const response = await axios.post(`http://${IPAdress}/transfer`, transferData)
            Alert.alert("Success", "Transferência salva com sucesso.")
            setNumber('')
            setDate('')
            setFarmName('')
        } catch (error) {
            Alert.alert("Error", error.response?.data || "Ocorreu um erro")
            console.error(error)
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Transferência</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Data da transferência:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={style.dateInput}>
                    <Text style={style.dateText}>{newDate || "Selecione a data"}</Text>
                    <AntDesign style={{ paddingLeft: '20%' }} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode='date'
                        display={Platform.OS === 'ios' ? 'default' : 'default'}
                        onChange={onChangeDate}
                    />
                )}
                <Text style={style.label}>Responsável:</Text>
                <TextInput
                    placeholder="Nome do responsável"
                    placeholderTextColor="#888"
                    value={newNumber}
                    style={style.input}
                    onChangeText={(text) => setNumber(text)}
                />
                <Text style={style.label}>Fazenda:</Text>
                <TextInput
                    placeholder="Nome da fazenda"
                    placeholderTextColor="#888"
                    value={newFarmName}
                    style={style.input}
                    onChangeText={(text) => setFarmName(text)}
                />
            </View>
            <View>
                <TouchableOpacity
                    style={[style.button, { display: 'flex', flexDirection: 'row', marginLeft: '40%', marginTop: '5%' }]}
                    onPress={postTransfer}
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, { marginLeft: 5, paddingBottom: 2 }]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
