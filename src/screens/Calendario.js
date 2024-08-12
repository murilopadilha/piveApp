import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from 'react-native-calendars';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import style from "../components/style"; // Certifique-se de que este estilo é adequado para o seu projeto

export default (props) => {
    const [scheduleDate, setScheduleDate] = useState('');

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

    return (
        <SafeAreaView style={styles.safeAreaView}>
            <View style={[style.divTitle]}>
                <TouchableOpacity>
                    <View style={{ marginRight: 50 }} />
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
            </View>
            <View>
                <TextInput style={style.inputSelect} />
                <TouchableOpacity onPress={showDatePicker} style={[style.dateInput, { marginLeft: 20, marginRight: 20, marginBottom: 20, marginTop: 10 }]}>
                    <Text style={style.dateText}>{scheduleDate || "Selecione a Data"}</Text>
                </TouchableOpacity>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Calendar
                    style={styles.calendar}
                    headerStyle={styles.headerStyle}
                    theme={{
                        todayTextColor: '#092955',
                        monthTextColor: '#000',
                        selectedDayBackgroundColor: '#092955',
                        selectedDayTextColor: '#FFFFFF',
                        dayTextColor: '#000', // Cor dos dias
                        textDayFontFamily: 'Arial',
                        textMonthFontFamily: 'Arial',
                        textDayHeaderFontFamily: 'Arial',
                        textDayFontSize: 16,
                        textMonthFontSize: 20,
                        textDayHeaderFontSize: 14,
                        calendarBackground: '#E0E0E0', // Cor do fundo do calendário
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
                    firstDay={1} // Define a segunda-feira como o primeiro dia da semana
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

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        backgroundColor: '#FFF', // Cor de fundo do SafeAreaView
    },
    calendar: {
        width: '95%', // Ajuste a largura conforme necessário
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#E0E0E0', // Cor do fundo do calendário
    },
    headerStyle: {
        backgroundColor: '#E0E0E0', // Cor do fundo do cabeçalho
        borderBottomWidth: 1,
        borderBottomColor: '#092955',
    },
});
