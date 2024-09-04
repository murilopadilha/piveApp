import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from "axios";
import style from "../../components/style";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from "react-native-safe-area-context";

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const [newOocyteCollectionDate, setDateOfOocyteCollection] = useState('')
    const [farm, setFarm] = useState('')
    const [client, setClient] = useState('')
    const [laboratory, setLaboratory] = useState('')
    const [veterinarian, setVeterinarian] = useState('')
    const [technical, setTechnical] = useState('')
    const [TE, setTE] = useState('')
    //const { fiv } = route.params;

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date()
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
        setDateOfOocyteCollection(formattedDate)
    }

    const showDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: onChangeDate,
        })
    }

    const handleSave = async () => {
        try {
            const response = await axios.post(`http://${IPAdress}/fiv`, {
                date: newOocyteCollectionDate,
                farm,
                laboratory,
                client,
                veterinarian,
                technical,
                TE,
            })
                Alert.alert('Successo', 'FIV salva com sucesso!')
        } catch (error) {
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, {marginBottom: 0}]}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: '10%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Informações da FIV</Text>
            </View>
            <View style={[style.content, {marginTop: 0, paddingTop: 0}]}>
                <ScrollView style={{ height: '90%'}}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 250}}>
                    <Text style={style.label}>Data da coleta:</Text>
                    <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                        <Text style={style.dateText}>{newOocyteCollectionDate || "Selecione a Data"}</Text>
                        <AntDesign style={{paddingLeft: '20%'}} name="calendar" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={style.label}>Fazenda:</Text>
                    <TextInput
                        placeholder="Nome da fazenda"
                        style={style.input}
                        value={farm}
                        onChangeText={setFarm}
                    />
                    <Text style={style.label}>Cliente:</Text>
                    <TextInput
                        placeholder="Nome do cliente"
                        style={style.input}
                        value={client}
                        onChangeText={setClient}
                    />
                    <Text style={style.label}>Laboratório:</Text>
                    <TextInput
                        placeholder="Nome do laboratório"
                        style={style.input}
                        value={laboratory}
                        onChangeText={setLaboratory}
                    />
                    <Text style={style.label}>Veterinário:</Text>
                    <TextInput
                        placeholder="Nome do veterinário"
                        style={style.input}
                        value={veterinarian}
                        onChangeText={setVeterinarian}
                    />
                    <Text style={style.label}>Técnico:</Text>
                    <TextInput
                        placeholder="Nome do técnico"
                        style={style.input}
                        value={technical}
                        onChangeText={setTechnical}
                    />
                    <Text style={style.label}>TE:</Text>
                    <TextInput
                        placeholder="Nome do TE"
                        style={style.input}
                        value={TE}
                        onChangeText={setTE}
                    />
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleSave} 
                        style={[style.listButtonSearch, { width: '30%', height: '58%', display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '60%' }]}>
                            <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}