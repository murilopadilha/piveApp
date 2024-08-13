import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from 'react-native-calendars';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';

import style from "../components/style"; // Certifique-se de que este estilo é adequado para o seu projeto

export default (props) => {
    const [scheduleDate, setScheduleDate] = useState('');
    const [category, setCategory] = useState('');

    const categories = [
        { key: 'OP1', value: 'Option 1' },
        { key: 'OP2', value: 'Option 2' },
        { key: 'OP3', value: 'Option 3' },
        { key: 'OP4', value: 'Option 4' },
    ];

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
                <SelectList
                    setSelected={setCategory}
                    data={categories}
                    placeholder={"Selecione seu agendamento"}
                    boxStyles={styles.selectListBox}
                    inputStyles={styles.selectListInput}
                    dropdownStyles={styles.selectListDropdown}
                />
                <TouchableOpacity onPress={showDatePicker} style={[style.dateInput, { marginLeft: 20, marginRight: 20, marginTop: 10 }]}>
                    <Text style={style.dateText}>{scheduleDate || "Selecione a Data"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={style.scheduleButton}>
                    <Text style={style.scheduleText}>Agendar</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.calendarContainer}>
                <Calendar
                    style={styles.calendar}
                    headerStyle={styles.headerStyle}
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

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    calendarContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    calendar: {
        width: 350,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#E0E0E0',
    },
    headerStyle: {
        backgroundColor: '#E0E0E0',
        borderBottomWidth: 1,
        borderBottomColor: '#092955',
    },
    selectListBox: {
        width: '90%', // Ajuste a largura para garantir que o dropdown tenha espaço suficiente
        maxWidth: 352, // Define uma largura máxima
        height: 45,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#092955',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 10,
        paddingTop: 9,
    },
    selectListInput: {
        fontSize: 14,
        color: '#000',
    },
    selectListDropdown: {
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#092955',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
    },
});