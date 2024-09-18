import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from "axios";
import style from "../../components/style";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
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
                Alert.alert('Error', 'Failed to load data. Please try again.')
            }
        }

        fetchDonorsAndBulls();
    }, [])

    function confirmSave() {
        Alert.alert(
            "Confirmar",
            "Você tem certeza de que deseja finalizar essa coleta?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Finalizar",
                    onPress: () => handleSaveAndFinish()
                }
            ]
        )
    }

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
                donorCattleId,
                bullId,
                totalOocytes: parseInt(totalOocytes) || 0,
                viableOocytes: parseInt(viableOocytes) || 0,
            })
                setDonorCattleId('')
                setBullId('')
                setTotalOocytes('')
                setViableOocytes('')
                Alert.alert('Successo', 'Coleta salva com sucesso!')
        } catch (error) {
            Alert.alert(`${error.response.data}`)
        }
    }

    const handleSaveAndFinish = async () => {
        console.log(totalOocytes)
        try {
            const response = await axios.post(`http://${IPAdress}/oocyte-collection`, {
                fivId: fiv.id,
                finished: true,
                donorCattleId,
                bullId,
                totalOocytes: parseInt(totalOocytes) || 0,
                viableOocytes: parseInt(viableOocytes) || 0,
            })
                Alert.alert('Successo', 'Coleta salva com sucesso!')
        } catch (error) {
        }
        navigation.navigate('Cultivo', { fiv: fiv })
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, {marginBottom: 0}]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ marginRight: 80 }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: 120 }]}>Coleta Oócitos</Text>
            </View>
            <View style={[style.content, {marginTop: 0, paddingTop: 0}]}>
                <ScrollView style={{ height: '90%'}}
                showsVerticalScrollIndicator={false}>
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
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: '11%' }}>
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
                        </View>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleSave} style={[style.listButtonSearch, { width: 90, height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}>
                            <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[style.listButtonSearch, { width: '50%', height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}
                        onPress={confirmSave}>
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar e Finalizar</Text>
                            <AntDesign name="right" size={16} color="#FFFFFF" style={{ paddingLeft: 10, paddingTop: 5 }} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}
