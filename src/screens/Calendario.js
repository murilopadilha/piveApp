import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from 'react-native-calendars';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';

import style from "../components/style"; // Certifique-se de que este estilo é adequado para o seu projeto

export default (props) => {
    const [scheduleDate, setScheduleDate] = useState('');
    const [category, setCategory] = useState('');

    const categories = [
        { key: 'OOCYTE_COLLECTION', value: 'Coleta de Oócito' },
        { key: 'IN_VITRO_MATURATION', value: 'Maturação In Vitro' },
        { key: 'IN_VITRO_FERTILIZATION', value: 'Fertilização In Vitro' },
        { key: 'EMBRYO_TRANSFER', value: 'Transferência de Embrião' },
    ];

    // Mapeamento das categorias para o formato do SelectList
    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }));

    // Função para lidar com a seleção no SelectList
    const handleSelect = (selectedKey) => {
        // Encontrar o key correspondente e definir no estado
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

        console.log("Categoria selecionada:", category); // Verifique o valor de category

        try {
            const response = await fetch('http://3.138.173.182:8080/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    procedureType: category, // Envia o key da categoria como procedureType
                    date: scheduleDate,
                }),
            });

            if (!response.ok) {
                throw new Error('Falha na solicitação');
            }

            const result = await response.json();
            Alert.alert("Sucesso", "Agendamento realizado com sucesso!");
            console.log(result);

        } catch (error) {
            Alert.alert("Erro", `Ocorreu um erro: ${error.message}`);
        }
    };

    return (
        <SafeAreaView style={style.safeAreaView}>
            <View style={[style.divTitle]}>
                <TouchableOpacity>
                    <View style={{ marginRight: 50 }} />
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
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
                <TouchableOpacity onPress={handleSchedule} style={style.scheduleButton}>
                    <Text style={style.scheduleText}>Agendar</Text>
                </TouchableOpacity>
            </View>
            <View style={style.calendarContainer}>
                <Calendar
                    style={style.calendar}
                    headerStyle={style.headerStyle}
                    theme={{
                        todayTextColor: '#092955',
                        monthTextColor: '#000',
                        selectedDayBackgroundColor: '#092955',
                        selectedDayTextColor: '#FFFFFF',
                        dayTextColor: '#000',
                        textDayFontFamily: 'Arial',
                        textMonthFontFamily: 'Arial',
                        textDayHeaderFontFamily: 'Arial',
                        textDayFontSize: 16,
                        textMonthFontSize: 20,
                        textDayHeaderFontSize: 14,
                        calendarBackground: '#E0E0E0',
                        textSectionTitleColor: '#000',
                        arrowColor: '#092955',
                        monthTextColor: '#000',
                        textDayHeaderFontSize: 16,
                        textDayFontSize: 16,
                        textMonthFontSize: 20,
                        textDayHeaderFontFamily: 'Arial',
                        textDayFontFamily: 'Arial',
                        textMonthFontFamily: 'Arial',
                    }}
                    monthFormat={'yyyy MMMM'}
                    firstDay={1}
                    markedDates={{
                        [scheduleDate]: {
                            selected: true,
                            marked: true,
                            selectedColor: '#092955',
                        }
                    }}
                    onDayPress={(day) => {
                        console.log(day.dateString);
                    }}
                />
            </View>
        </SafeAreaView>
    );
};