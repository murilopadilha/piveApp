import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from 'react-native-calendars';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';
import { useNavigation } from '@react-navigation/native';
import Octicons from '@expo/vector-icons/Octicons';
import Feather from '@expo/vector-icons/Feather';

import style from "../components/style"; 

import { IPAdress } from "../components/APIip";

export default (props) => {
    const [scheduleDate, setScheduleDate] = useState('')
    const [category, setCategory] = useState('')
    const [markedDates, setMarkedDates] = useState({})
    const [selectedDateDetails, setSelectedDateDetails] = useState([])

    const navigation = useNavigation()

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

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date()
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
        setScheduleDate(formattedDate)
    }

    const showDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: onChangeDate,
        })
    }

    const handleSchedule = async () => {
        if (!scheduleDate || !category) {
            Alert.alert("Erro", "Por favor, selecione a data e a categoria.")
            return
        }

        try {
            const response = await fetch(`http://${IPAdress}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    procedureType: category,
                    date: scheduleDate,
                }),
            })

            if (!response.ok) {
                throw new Error('Falha na solicitação')
            }

            const result = await response.json();
            Alert.alert("Sucesso", "Agendamento realizado com sucesso!")
            console.log(result)

            fetchScheduledDates()

        } catch (error) {
            Alert.alert("Erro", `Ocorreu um erro: ${error.message}`)
        }
    }

    const fetchScheduledDates = async () => {
        try {
            const response = await fetch(`http://${IPAdress}/schedule`)
            if (!response.ok) {
                throw new Error('Falha na solicitação')
            }
            const data = await response.json()

            const dates = {}
            data.forEach(item => {
                dates[item.date] = {
                    selected: true,
                    marked: true,
                    selectedColor: '#092955',
                }
            })

            setMarkedDates(dates)

        } catch (error) {
            Alert.alert("Erro", `Ocorreu um erro ao buscar datas agendadas: ${error.message}`)
        }
    }

    const fetchDateDetails = async (date) => {
        try {
            const response = await fetch(`http://${IPAdress}/schedule/search?date=${date}`)
            if (!response.ok) {
                throw new Error('Falha na solicitação')
            }
            const data = await response.json()
            
            if (data.length > 0) {
                const details = data.map(item => ({
                    id: item.id, 
                    procedureType: categories.find(cat => cat.key === item.procedureType)?.value || item.procedureType,
                    date: item.date
                }))
                setSelectedDateDetails(details)
            } else {
                setSelectedDateDetails([])
            }
        } catch (error) {
            
        }
    }

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://${IPAdress}/schedule/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Falha na solicitação')
            }

            Alert.alert("Sucesso", "Agendamento excluído com sucesso!")
            fetchScheduledDates()
            fetchDateDetails(scheduleDate)

        } catch (error) {
            Alert.alert("Erro", `Ocorreu um erro ao excluir o agendamento: ${error.message}`)
        }
    }

    useEffect(() => {
        fetchScheduledDates()
    }, [])

    return (
        <SafeAreaView style={style.safeAreaView}>
            <View style={style.divTitle}>
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
                    markedDates={markedDates}
                    onDayPress={(day) => {
                        fetchDateDetails(day.dateString);
                    }}
                />
                {selectedDateDetails.length > 0 && (
                    <ScrollView style={style.detailsContainer}>
                        {selectedDateDetails.map((detail, index) => (
                            <View key={index} style={style.detailItem}>
                                <Text style={style.detailsText}>
                                    <Text style={{ fontWeight: 'bold' }}>Agendamento:</Text> {detail.procedureType}
                                </Text>
                                <Text style={[style.detailsText, { marginBottom: 5 }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Data:</Text> {detail.date}
                                </Text>
                                <View style={{ display: 'flex', flexDirection: 'row' }}>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(detail.id)}
                                        style={[style.listButtonEdit, { width: 90 }]}
                                    >
                                        <Feather name="x" size={20} color="#E0E0E0" />
                                        <Text style={{ color: '#E0E0E0' }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('EditarAgendamento', { detail })}
                                        style={[style.listButtonEdit, { marginTop: 0, height: 30 }]}
                                    >
                                        <Octicons name="pencil" size={20} color="#E0E0E0" />
                                        <Text style={{ color: '#E0E0E0' }}>Editar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    )
}
