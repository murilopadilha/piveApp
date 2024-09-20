import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert, ScrollView, Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from "axios";
import DateTimePicker from '@react-native-community/datetimepicker';
import style from "../../components/style";
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
    const [showDatePicker, setShowDatePicker] = useState(false)

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(false)
        if (event.type === 'set') {
            const currentDate = selectedDate || new Date()
            const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
            setDateOfOocyteCollection(formattedDate)
        }
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
            Alert.alert('Sucesso', 'FIV salva com sucesso!')
            setDateOfOocyteCollection('');
            setFarm('');
            setClient('');
            setLaboratory('');
            setVeterinarian('');
            setTechnical('');
            setTE('');
        } catch (error) {
            Alert.alert('Erro', error.response.data)
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: '10%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Informações da FIV</Text>
            </View>
            <View style={[style.content, { marginTop: 0, paddingTop: 0 }]}>
                <ScrollView style={{ height: '90%' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 250 }}>
                    <Text style={style.label}>Data da coleta:</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={style.dateInput}>
                        <Text style={style.dateText}>{newOocyteCollectionDate || "Selecione a Data"}</Text>
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
                    <Text style={style.label}>Fazenda:</Text>
                    <TextInput
                        placeholder="Nome da fazenda"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={farm}
                        onChangeText={setFarm}
                    />
                    <Text style={style.label}>Cliente:</Text>
                    <TextInput
                        placeholder="Nome do cliente"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={client}
                        onChangeText={setClient}
                    />
                    <Text style={style.label}>Laboratório:</Text>
                    <TextInput
                        placeholder="Nome do laboratório"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={laboratory}
                        onChangeText={setLaboratory}
                    />
                    <Text style={style.label}>Veterinário:</Text>
                    <TextInput
                        placeholder="Nome do veterinário"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={veterinarian}
                        onChangeText={setVeterinarian}
                    />
                    <Text style={style.label}>Técnico:</Text>
                    <TextInput
                        placeholder="Nome do técnico"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={technical}
                        onChangeText={setTechnical}
                    />
                    <Text style={style.label}>TE:</Text>
                    <TextInput
                        placeholder="Nome do TE"
                        placeholderTextColor="#888"
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
