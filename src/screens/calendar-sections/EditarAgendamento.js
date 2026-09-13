import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import style from "../../components/style";

import { updateSchedule } from "../../api/scheduleService";
import { normalizeApiError } from "../../api/errors";
import { SCHEDULE_PROCEDURE_TYPES } from "../../features/calendar/constants";
import { formatLocalCalendarDate, parseLocalCalendarDate } from "../../utils/date";

export default () => {
    const route = useRoute()
    const navigation = useNavigation()
    const { detail } = route.params

    const [scheduleDate, setScheduleDate] = useState(detail.date || '')
    const [category, setCategory] = useState(detail.procedureType || '')
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isSubmittingRef = React.useRef(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            mutationAbortControllerRef.current?.abort()
            mutationAbortControllerRef.current = null
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true

            return () => {
                isScreenFocusedRef.current = false
                mutationAbortControllerRef.current?.abort()
                mutationAbortControllerRef.current = null
            }
        }, [])
    )

    const categoryData = SCHEDULE_PROCEDURE_TYPES.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const currentCategoryOption = SCHEDULE_PROCEDURE_TYPES.find(cat => cat.key === detail.procedureType) || {
        key: detail.procedureType,
        value: detail.procedureTypeLabel || detail.procedureType
    }

    const handleSelect = (selectedKey) => {
        const selectedCategory = SCHEDULE_PROCEDURE_TYPES.find(cat => cat.key === selectedKey)
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
        const formattedDate = formatLocalCalendarDate(date)
        setScheduleDate(formattedDate)
        hideDatePicker()
    }

    const submitSchedule = async () => {
        if (isSubmittingRef.current) return

        const scheduleId = detail.id
        const payload = {
            procedureType: category,
            date: scheduleDate,
        }
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            const result = await updateSchedule(scheduleId, payload, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return

            Alert.alert("Sucesso", "Agendamento editado com sucesso!")
            console.log(result)
            navigation.goBack()

        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro ao editar o agendamento.')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return
            Alert.alert("Erro", apiError.message)
        } finally {
            if (mutationAbortControllerRef.current === abortController) {
                mutationAbortControllerRef.current = null
            }
            isSubmittingRef.current = false
            if (isMountedRef.current) {
                setIsSubmitting(false)
            }
        }
    }

    const handleSchedule = async () => {
        if (!scheduleDate || !category) {
            Alert.alert("Erro", "Por favor, selecione a data e a categoria.")
            return
        }

        if (isSubmittingRef.current) return

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
                    onPress: submitSchedule
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
                    date={parseLocalCalendarDate(scheduleDate)}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                />
                <TouchableOpacity disabled={isSubmitting} onPress={handleSchedule} style={[style.scheduleButton, {width: 150, height: 35}]}>
                    <Text style={style.scheduleText}>Editar Agendamento</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
