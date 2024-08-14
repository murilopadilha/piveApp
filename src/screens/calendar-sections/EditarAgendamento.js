import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRoute, useNavigation } from '@react-navigation/native';

import AntDesign from '@expo/vector-icons/AntDesign';
import { SelectList } from "react-native-dropdown-select-list";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import style from "../../components/style";

export default () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { detail } = route.params;

    const [scheduleDate, setScheduleDate] = useState('');
    const [category, setCategory] = useState('');
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDateDetails, setSelectedDateDetails] = useState([]); // Lista de detalhes do agendamento

    const categories = [
        { key: 'OOCYTE_COLLECTION', value: 'Coleta de Oócito' },
        { key: 'IN_VITRO_MATURATION', value: 'Maturação In Vitro' },
        { key: 'IN_VITRO_FERTILIZATION', value: 'Fertilização In Vitro' },
        { key: 'EMBRYO_TRANSFER', value: 'Transferência de Embrião' },
    ];

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }));

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey);
        if (selectedCategory) {
            setCategory(selectedCategory.key);
        }
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`;
        setScheduleDate(formattedDate);
    };

    const showDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: onChangeDate,
        });
    };

    const handleSchedule = async () => {
        if (!scheduleDate || !category) {
            Alert.alert("Erro", "Por favor, selecione a data e a categoria.");
            return;
        }

        try {
            const response = await fetch('http://18.217.70.110:8080/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    procedureType: category,
                    date: scheduleDate,
                }),
            });

            if (!response.ok) {
                throw new Error('Falha na solicitação');
            }

            const result = await response.json();
            Alert.alert("Sucesso", "Agendamento realizado com sucesso!");
            console.log(result);

            // Atualize a lista de datas marcadas após o agendamento
            fetchScheduledDates();

        } catch (error) {
            Alert.alert("Erro", `Ocorreu um erro: ${error.message}`);
        }
    };

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Calendario')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Editar Agendamento</Text>
            </View>
            <View>
                <SelectList
                    setSelected={handleSelect}
                    data={categoryData}
                    placeholder={"Selecione seu agendamento"}
                    boxStyles={style.selectListBox}
                    inputStyles={style.selectListInput}
                    dropdownStyles={style.selectListDropdown}
                />
                <TouchableOpacity onPress={showDatePicker} style={[style.dateInput, { marginLeft: 20, marginRight: 20, marginTop: 10 }]}>
                    <Text style={style.dateText}>{scheduleDate || "Selecione a Data"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSchedule} style={[style.scheduleButton, {width: 150, height: 35}]}>
                    <Text style={style.scheduleText}>Editar Agendamento</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}