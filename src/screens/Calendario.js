import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SelectList } from 'react-native-dropdown-select-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import style from "../components/style"; 
import {
    createSchedule,
    deleteSchedule,
} from "../api/scheduleService";
import { normalizeApiError } from "../api/errors";
import { SCHEDULE_PROCEDURE_TYPES } from "../features/calendar/constants";
import ScheduleCalendarView from "../features/calendar/components/ScheduleCalendarView";
import ScheduleDetailsList from "../features/calendar/components/ScheduleDetailsList";
import useScheduleCalendar from "../features/calendar/hooks/useScheduleCalendar";
import { formatLocalCalendarDate } from "../utils/date";

export default () => {
    const [newScheduleDate, setNewScheduleDate] = useState('');
    const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
    const [category, setCategory] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
    const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
    const handleLoadError = React.useCallback((message) => {
        Alert.alert("Erro", message);
    }, []);
    const {
        markedDates,
        selectedDateDetails,
        reloadScheduledDates,
        reloadDateDetails,
        clearDateDetails,
    } = useScheduleCalendar({
        selectedCalendarDate,
        onLoadError: handleLoadError,
    });
    const isMountedRef = React.useRef(true);
    const isScreenFocusedRef = React.useRef(false);
    const selectedCalendarDateRef = React.useRef(selectedCalendarDate);
    const isCreatingScheduleRef = React.useRef(false);
    const isDeletingScheduleRef = React.useRef(false);
    const createScheduleAbortControllerRef = React.useRef(null);
    const deleteScheduleAbortControllerRef = React.useRef(null);

    const navigation = useNavigation();

    selectedCalendarDateRef.current = selectedCalendarDate;

    React.useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            createScheduleAbortControllerRef.current?.abort();
            createScheduleAbortControllerRef.current = null;
            deleteScheduleAbortControllerRef.current?.abort();
            deleteScheduleAbortControllerRef.current = null;
        };
    }, []);

    const categoryData = SCHEDULE_PROCEDURE_TYPES.map(cat => ({
        key: cat.key,
        value: cat.value
    }));

    const calendarMarkedDates = selectedCalendarDate
        ? {
            ...markedDates,
            [selectedCalendarDate]: {
                ...markedDates[selectedCalendarDate],
                selected: true,
                selectedColor: '#092955',
            },
        }
        : markedDates;

    const handleSelect = (selectedKey) => {
        const selectedCategory = SCHEDULE_PROCEDURE_TYPES.find(cat => cat.key === selectedKey);
        if (selectedCategory) {
            setCategory(selectedCategory.key);
        }
    };

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        const formattedDate = formatLocalCalendarDate(date);
        setNewScheduleDate(formattedDate);
        hideDatePicker();
    };

    const handleSchedule = async () => {
        if (!newScheduleDate || !category) {
            Alert.alert("Erro", "Por favor, selecione a data e a categoria.");
            return;
        }

        if (isCreatingScheduleRef.current) return;

        const scheduleDate = newScheduleDate;
        const scheduleCategory = category;
        const abortController = new AbortController();
        isCreatingScheduleRef.current = true;
        createScheduleAbortControllerRef.current = abortController;
        setIsCreatingSchedule(true);

        try {
            await createSchedule({
                procedureType: scheduleCategory,
                date: scheduleDate,
            }, {
                signal: abortController.signal,
            });

            if (
                !isScreenFocusedRef.current ||
                createScheduleAbortControllerRef.current !== abortController
            ) return;

            await reloadScheduledDates();
            if (
                !isScreenFocusedRef.current ||
                createScheduleAbortControllerRef.current !== abortController
            ) return;

            if (selectedCalendarDateRef.current === scheduleDate) {
                await reloadDateDetails(scheduleDate);
            }

            if (
                !isScreenFocusedRef.current ||
                createScheduleAbortControllerRef.current !== abortController
            ) return;
            Alert.alert("Sucesso", "Agendamento realizado com sucesso!");

        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro ao criar o agendamento.');
            if (apiError.isCanceled) return;
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                createScheduleAbortControllerRef.current !== abortController
            ) return;
            Alert.alert("Erro", apiError.message);
        } finally {
            if (createScheduleAbortControllerRef.current === abortController) {
                createScheduleAbortControllerRef.current = null;
            }
            isCreatingScheduleRef.current = false;
            if (isMountedRef.current) {
                setIsCreatingSchedule(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (isDeletingScheduleRef.current) return;

        isDeletingScheduleRef.current = true;
        const abortController = new AbortController();
        deleteScheduleAbortControllerRef.current = abortController;
        setIsDeletingSchedule(true);

        try {
            await deleteSchedule(id, {
                signal: abortController.signal,
            });

            if (
                !isScreenFocusedRef.current ||
                deleteScheduleAbortControllerRef.current !== abortController
            ) return;

            await reloadScheduledDates();
            if (
                !isScreenFocusedRef.current ||
                deleteScheduleAbortControllerRef.current !== abortController
            ) return;

            const currentSelectedDate = selectedCalendarDateRef.current;
            if (currentSelectedDate) {
                await reloadDateDetails(currentSelectedDate);
            }

            if (
                !isScreenFocusedRef.current ||
                deleteScheduleAbortControllerRef.current !== abortController
            ) return;
            Alert.alert("Sucesso", "Agendamento excluído com sucesso!");

        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro ao excluir o agendamento.');
            if (apiError.isCanceled) return;
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                deleteScheduleAbortControllerRef.current !== abortController
            ) return;
            Alert.alert("Erro", apiError.message);
        } finally {
            if (deleteScheduleAbortControllerRef.current === abortController) {
                deleteScheduleAbortControllerRef.current = null;
            }
            isDeletingScheduleRef.current = false;
            if (isMountedRef.current) {
                setIsDeletingSchedule(false);
            }
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true;

            return () => {
                isScreenFocusedRef.current = false;
                createScheduleAbortControllerRef.current?.abort();
                createScheduleAbortControllerRef.current = null;
                deleteScheduleAbortControllerRef.current?.abort();
                deleteScheduleAbortControllerRef.current = null;
            };
        }, [])
    );

    const handleDayPress = (day) => {
        if (day.dateString !== selectedCalendarDate) {
            clearDateDetails();
        }
        setSelectedCalendarDate(day.dateString);
    };

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.screenBackground]}>
            <View style={style.divTitleMain}>
                <Image source={require('../images/menu/logo.png')} style={styles.logo} />
                <Text style={style.titleTextMain}>BovInA</Text>
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
                <TouchableOpacity onPress={showDatePicker} style={[style.dateInput, styles.dateInput]}>
                    <Text style={style.dateText}>{newScheduleDate || "Selecione a Data"}</Text>
                    <AntDesign style={styles.calendarIcon} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                />
                <TouchableOpacity disabled={isCreatingSchedule} onPress={handleSchedule} style={[style.scheduleButton, styles.scheduleButton]}>
                    <FontAwesome5 name="calendar-check" size={20} color="white" />
                    <Text style={[style.scheduleText, styles.scheduleText]}>Agendar</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.calendarContainer}>
                <ScheduleCalendarView
                    markedDates={calendarMarkedDates}
                    onDayPress={handleDayPress}
                />
                <ScheduleDetailsList
                    details={selectedDateDetails}
                    isDeleting={isDeletingSchedule}
                    onDelete={handleDelete}
                    onEdit={(detail) => navigation.navigate('EditarAgendamento', { detail })}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    screenBackground: {
        backgroundColor: '#F1F2F4',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: '2%',
    },
    dateInput: {
        marginLeft: 20,
        marginRight: 20,
        marginTop: 10,
    },
    calendarIcon: {
        paddingLeft: '20%',
    },
    scheduleButton: {
        display: 'flex',
        flexDirection: 'row',
        width: 90,
    },
    scheduleText: {
        fontSize: 13,
        paddingLeft: 5,
    },
    calendarContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
});
