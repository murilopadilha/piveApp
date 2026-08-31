import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import style from "../../components/style";

import { IPAdress } from "../../components/APIip";

const parseLocalDate = (value) => {
    const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    if (!match) {
        return new Date()
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const date = new Date(year, month - 1, day)

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return new Date()
    }

    return date
}

export default () => {
    const route = useRoute()
    const navigation = useNavigation()
    const { detail } = route.params

    const [scheduleDate, setScheduleDate] = useState(detail.date || '')
    const [category, setCategory] = useState(detail.procedureType || '')
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false)

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

    const currentCategoryOption = categories.find(cat => cat.key === detail.procedureType) || {
        key: detail.procedureType,
        value: detail.procedureTypeLabel || detail.procedureType
    }

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setCategory(selectedCategory.key)
        }
    }

    const showDatePicker = () => {
        setDatePickerVisibility(true)
    }

    const hideDatePicker = () => {
        setDatePickerVisibility(false)
    }

    const handleConfirm = (date) => {
        const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`
        setScheduleDate(formattedDate)
        hideDatePicker()
    }

    const handleSchedule = async () => {
        if (!scheduleDate || !category) {
            Alert.alert("Erro", "Por favor, selecione a data e a categoria.")
            return
        }

        Alert.alert(
            "Confirmar Edição",
            "Você tem certeza que deseja editar este agendamento?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        const scheduleId = detail.id

                        try {
                            const response = await fetch(`http://${IPAdress}/schedule/${scheduleId}`, {
                                method: 'PUT',
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

                            const result = await response.json()
                            Alert.alert("Sucesso", "Agendamento editado com sucesso!")
                            console.log(result)
                            navigation.goBack()

                        } catch (error) {
                            Alert.alert("Erro", `Ocorreu um erro: ${error.message}`)
                        }
                    }
                }
            ]
        );
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
                    defaultOption={currentCategoryOption}
                    placeholder={"Selecione seu agendamento"}
                    boxStyles={style.selectListBox}
                    inputStyles={style.selectListInput}
                    dropdownStyles={style.selectListDropdown}
                />
                <TouchableOpacity onPress={showDatePicker} style={[style.dateInput, { marginLeft: 20, marginRight: 20, marginTop: 10 }]}>
                    <Text style={style.dateText}>{scheduleDate || "Selecione a Data"}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    date={parseLocalDate(scheduleDate)}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                />
                <TouchableOpacity onPress={handleSchedule} style={[style.scheduleButton, {width: 150, height: 35}]}>
                    <Text style={style.scheduleText}>Editar Agendamento</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
