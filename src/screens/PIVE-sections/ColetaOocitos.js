import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";

import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { ScrollView } from "react-native-gesture-handler";
import { SelectList } from 'react-native-dropdown-select-list';

export default ({ navigation }) => {
    const [newOocyteCollectionDate, setDateOfOocyteCollection] = useState('');

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

    const categories = [
        { key: 'OOCYTE_COLLECTION', value: 'Coleta de Oócito' },
        { key: 'IN_VITRO_MATURATION', value: 'Maturação In Vitro' },
        { key: 'IN_VITRO_FERTILIZATION', value: 'Fertilização In Vitro' },
        { key: 'EMBRYO_TRANSFER', value: 'Transferência de Embrião' },
    ]

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setCategory(selectedCategory.key)
        }
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 100}}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, {marginRight: 100}]}>Coleta Oócitos</Text>
            </View>
            <View style={style.content}>
                <ScrollView style={{height: '86%'}}>
                    <Text style={style.label}>Data da coleta:</Text>
                    <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                        <Text style={style.dateText}>{newOocyteCollectionDate || "Selecione a Data"}</Text>
                    </TouchableOpacity>
                    <Text style={style.label}>Fazenda:</Text>
                    <TextInput
                        placeholder="Nome da fazenda"
                        style={style.input}
                    />
                    <Text style={style.label}>Cliente:</Text>
                    <TextInput
                        placeholder="Nome do cliente"
                        style={style.input}
                    />
                    <Text style={style.label}>Veterinário:</Text>
                    <TextInput
                        placeholder="Nome do veterinário"
                        style={style.input}
                    />
                    <Text style={style.label}>Técnico:</Text>
                    <TextInput
                        placeholder="Nome do técnico"
                        style={style.input}
                    />
                    <Text style={style.label}>Doadora:</Text>
                    <SelectList
                        setSelected={handleSelect}
                        data={categoryData}
                        placeholder={"Selecione a doadora"}
                        boxStyles={[style.selectListBox, { height: 45, marginLeft: 0}]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={[style.selectListDropdown, {marginLeft: 0, width: 300}]}
                    />
                    <Text style={style.label}>Touro:</Text>
                    <SelectList
                        setSelected={handleSelect}
                        data={categoryData}
                        placeholder={"Selecione o touro"}
                        boxStyles={[style.selectListBox, { height: 45, marginLeft: 0}]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={[style.selectListDropdown, {marginLeft: 0, width: 300}]}
                    />
                    <Text style={[style.label, {textAlign: 'center', marginTop: 20}]}>Oócitos:</Text>
                    <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
                        <View>
                            <Text style={style.label}>Total:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Total"
                                style={[style.input, {width: 70, textAlign: 'center', paddingLeft: 0}]}
                            />
                        </View>
                        <View>
                            <Text style={style.label}>Viáveis:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Viáveis"
                                style={[style.input, {width: 70, textAlign: 'center', paddingLeft: 0}]}
                            />
                        </View>
                        <View>
                            <Text style={style.label}>Inviáveis:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Inviáveis"
                                style={[style.input, {width: 70, textAlign: 'center', paddingLeft: 0}]}
                            />
                        </View>
                    </View>
                    <TouchableOpacity style={[style.listButtonSearch, {width: 100, height: 35, marginLeft: 155, 
                        display: 'flex', flexDirection: 'row', marginTop: 20, marginLeft: 200}]}>
                        <Text style={{color: '#FFFFFF', paddingTop: 3, paddingLeft: 5}}>Próximo</Text>
                        <AntDesign name="right" size={16} color="#FFFFFF" style={{paddingLeft: 10, paddingTop: 5}}/>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    )
}
