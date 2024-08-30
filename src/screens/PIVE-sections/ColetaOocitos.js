import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from "axios";
import style from "../../components/style";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const [newOocyteCollectionDate, setDateOfOocyteCollection] = useState('')
    const [farm, setFarm] = useState('')
    const [client, setClient] = useState('')
    const [laboratory, setLaboratory] = useState('')
    const [veterinarian, setVeterinarian] = useState('')
    const [technical, setTechnical] = useState('')
    const [donorCattleId, setDonorCattleId] = useState(null)
    const [bullId, setBullId] = useState(null)
    const [totalOocytes, setTotalOocytes] = useState('')
    const [viableOocytes, setViableOocytes] = useState('')
    const [donors, setDonors] = useState([])
    const [bulls, setBulls] = useState([])
    const { fiv } = route.params;

    useEffect(() => {
        const fetchDonorsAndBulls = async () => {
            try {
                const [donorsResponse, bullsResponse] = await Promise.all([
                    axios.get(`http://${IPAdress}/donor`),
                    axios.get(`http://${IPAdress}/bull`)
                ])

                setDonors(donorsResponse.data)
                setBulls(bullsResponse.data)
            } catch (error) {
                console.error('Failed to fetch donors or bulls', error)
                Alert.alert('Error', 'Failed to load data. Please try again.')
            }
        }

        fetchDonorsAndBulls();
    }, [])

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

    const donorOptions = donors.map(donor => ({
        key: donor.id,
        value: `${donor.name} (${donor.registrationNumber})`
    }))

    const bullOptions = bulls.map(bull => ({
        key: bull.id,
        value: `${bull.name} (${bull.registrationNumber})`
    }))

    const handleSave = async () => {
        console.log(totalOocytes)
        try {
            const response = await axios.post(`http://${IPAdress}/oocyte-collection`, {
                fivId: fiv.id, 
                date: newOocyteCollectionDate,
                farm,
                laboratory,
                client,
                veterinarian,
                technical,
                donorCattleId,
                bullId,
                totalOocytes: parseInt(totalOocytes) || 0,
                viableOocytes: parseInt(viableOocytes) || 0,
            })

            if(response.ok){
                Alert.alert('Successo', 'Coleta salva com sucesso!')
            } else if (response.status == '409') {
                const errorMessage = await response.text()
                Alert.alert('Erro', errorMessage);
            } else {
                Alert.alert('Erro', "Erro ao enviar dados")
            }
            
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'Failed to save data. Please try again.')
        }
    }

    return (
        <View style={style.menu}>
            <View style={[style.divTitle, {marginBottom: 0}]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={{ marginRight: 80 }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: 120 }]}>Coleta Oócitos</Text>
            </View>
            <View style={[style.content, {marginTop: 0, paddingTop: 0}]}>
                <ScrollView style={{ height: '90%'}}
                showsVerticalScrollIndicator={false}>
                    <Text style={style.label}>Data da coleta:</Text>
                    <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                        <Text style={style.dateText}>{newOocyteCollectionDate || "Selecione a Data"}</Text>
                        <AntDesign style={{paddingLeft: 90}} name="calendar" size={24} color="#000" />
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
                    <Text style={style.label}>Doadora:</Text>
                    <SelectList
                        setSelected={setDonorCattleId}
                        data={donorOptions}
                        placeholder={"Selecione a doadora"}
                        boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                    />
                    <Text style={style.label}>Touro:</Text>
                    <SelectList
                        setSelected={setBullId}
                        data={bullOptions}
                        placeholder={"Selecione o touro"}
                        boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                    />
                    <Text style={[style.label, { textAlign: 'center', marginTop: 20 }]}>Oócitos:</Text>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
                        <View>
                            <Text style={style.label}>Total:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Total"
                                style={[style.input, { width: 70, textAlign: 'center', paddingLeft: 0 }]}
                                value={totalOocytes}
                                onChangeText={setTotalOocytes}
                            />
                        </View>
                        <View>
                            <Text style={style.label}>Viáveis:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Viáveis"
                                style={[style.input, { width: 70, textAlign: 'center', paddingLeft: 0 }]}
                                value={viableOocytes}
                                onChangeText={setViableOocytes}
                            />
                        </View>
                        <View>
                            <Text style={style.label}>Inviáveis:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Inviáveis"
                                style={[style.input, { width: 70, textAlign: 'center', paddingLeft: 0 }]}
                            />
                        </View>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleSave} style={[style.listButtonSearch, { width: 90, height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}>
                            <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[style.listButtonSearch, { width: 90, height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}
                        onPress={() => navigation.navigate('Cultivo', { fiv: fiv })}>
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Cultivo</Text>
                            <AntDesign name="right" size={16} color="#FFFFFF" style={{ paddingLeft: 10, paddingTop: 5 }} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}
