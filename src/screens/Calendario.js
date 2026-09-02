import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from 'react-native-calendars';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SelectList } from 'react-native-dropdown-select-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Octicons from '@expo/vector-icons/Octicons';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import style from "../components/style"; 
import {
    createSchedule,
    deleteSchedule,
    getScheduleDetailsByDate,
    listSchedules,
} from "../api/scheduleService";
import { normalizeApiError } from "../api/errors";

export default (props) => {
    const [newScheduleDate, setNewScheduleDate] = useState('');
    const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
    const [category, setCategory] = useState('');
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDateDetails, setSelectedDateDetails] = useState([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
    const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
    const isMountedRef = React.useRef(true);
    const isScreenFocusedRef = React.useRef(false);
    const selectedCalendarDateRef = React.useRef(selectedCalendarDate);
    const isCreatingScheduleRef = React.useRef(false);
    const isDeletingScheduleRef = React.useRef(false);
    const scheduledDatesAbortControllerRef = React.useRef(null);
    const scheduledDatesRequestIdRef = React.useRef(0);
    const dateDetailsAbortControllerRef = React.useRef(null);
    const dateDetailsRequestIdRef = React.useRef(0);

    const navigation = useNavigation();

    selectedCalendarDateRef.current = selectedCalendarDate;

    React.useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

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
        const selectedCategory = categories.find(cat => cat.key === selectedKey);
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
        const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
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
        isCreatingScheduleRef.current = true;
        setIsCreatingSchedule(true);

        try {
            await createSchedule({
                procedureType: scheduleCategory,
                date: scheduleDate,
            });

            if (!isScreenFocusedRef.current) return;

            await fetchScheduledDates();
            if (!isScreenFocusedRef.current) return;

            if (selectedCalendarDateRef.current === scheduleDate) {
                await fetchDateDetails(scheduleDate);
            }

            if (!isScreenFocusedRef.current) return;
            Alert.alert("Sucesso", "Agendamento realizado com sucesso!");

        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro ao criar o agendamento.');
            if (apiError.isCanceled) return;
            if (!isMountedRef.current || !isScreenFocusedRef.current) return;
            Alert.alert("Erro", apiError.message);
        } finally {
            isCreatingScheduleRef.current = false;
            if (isMountedRef.current) {
                setIsCreatingSchedule(false);
            }
        }
    };

    const fetchScheduledDates = async () => {
        if (!isScreenFocusedRef.current) return;

        scheduledDatesAbortControllerRef.current?.abort();
        const abortController = new AbortController();
        scheduledDatesAbortControllerRef.current = abortController;
        const requestId = ++scheduledDatesRequestIdRef.current;

        try {
            const data = await listSchedules({ signal: abortController.signal });

            if (
                requestId !== scheduledDatesRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return;

            const dates = {};
            data.forEach(item => {
                dates[item.date] = {
                    selected: true,
                    marked: true,
                    selectedColor: '#092955',
                };
            });

            setMarkedDates(dates);

        } catch (error) {
            if (
                requestId !== scheduledDatesRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return;

            const apiError = normalizeApiError(error, 'Ocorreu um erro ao buscar datas agendadas.');
            if (apiError.isCanceled) return;
            Alert.alert("Erro", apiError.message);
        } finally {
            if (requestId === scheduledDatesRequestIdRef.current) {
                scheduledDatesAbortControllerRef.current = null;
            }
        }
    };

    const fetchDateDetails = async (date) => {
        if (!isScreenFocusedRef.current) return;

        dateDetailsAbortControllerRef.current?.abort();
        const abortController = new AbortController();
        dateDetailsAbortControllerRef.current = abortController;
        const requestId = ++dateDetailsRequestIdRef.current;

        try {
            const data = await getScheduleDetailsByDate(date, {
                signal: abortController.signal,
            });

            if (
                requestId !== dateDetailsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return;

            const details = data.map(item => ({
                id: item.id,
                procedureType: item.procedureType,
                procedureTypeLabel: categories.find(cat => cat.key === item.procedureType)?.value || item.procedureType,
                date: item.date,
            }));
            setSelectedDateDetails(details);
        } catch (error) {
            if (
                requestId !== dateDetailsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return;

            const apiError = normalizeApiError(error, 'Ocorreu um erro ao buscar detalhes do agendamento.');
            if (apiError.isCanceled) return;
            Alert.alert("Erro", apiError.message);
        } finally {
            if (requestId === dateDetailsRequestIdRef.current) {
                dateDetailsAbortControllerRef.current = null;
            }
        }
    };

    const handleDelete = async (id) => {
        if (isDeletingScheduleRef.current) return;

        isDeletingScheduleRef.current = true;
        setIsDeletingSchedule(true);

        try {
            await deleteSchedule(id);

            if (!isScreenFocusedRef.current) return;

            await fetchScheduledDates();
            if (!isScreenFocusedRef.current) return;

            const currentSelectedDate = selectedCalendarDateRef.current;
            if (currentSelectedDate) {
                await fetchDateDetails(currentSelectedDate);
            }

            if (!isScreenFocusedRef.current) return;
            Alert.alert("Sucesso", "Agendamento excluído com sucesso!");

        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro ao excluir o agendamento.');
            if (apiError.isCanceled) return;
            if (!isMountedRef.current || !isScreenFocusedRef.current) return;
            Alert.alert("Erro", apiError.message);
        } finally {
            isDeletingScheduleRef.current = false;
            if (isMountedRef.current) {
                setIsDeletingSchedule(false);
            }
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true;
            fetchScheduledDates();

            return () => {
                isScreenFocusedRef.current = false;

                scheduledDatesRequestIdRef.current += 1;
                scheduledDatesAbortControllerRef.current?.abort();
                scheduledDatesAbortControllerRef.current = null;
            };
        }, [])
    );

    useFocusEffect(
        React.useCallback(() => {
            if (selectedCalendarDate) {
                fetchDateDetails(selectedCalendarDate);
            }

            return () => {
                dateDetailsRequestIdRef.current += 1;
                dateDetailsAbortControllerRef.current?.abort();
                dateDetailsAbortControllerRef.current = null;
            };
        }, [selectedCalendarDate])
    );

    return (
        <SafeAreaView style={[style.safeAreaView, { backgroundColor: '#F1F2F4' }]}>
            <View style={style.divTitleMain}>
                <Image source={require('../images/menu/logo.png')} style={{ width: 40, height: 40, marginRight: '2%' }} />
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
                <TouchableOpacity onPress={showDatePicker} style={[style.dateInput, { marginLeft: 20, marginRight: 20, marginTop: 10 }]}>
                    <Text style={style.dateText}>{newScheduleDate || "Selecione a Data"}</Text>
                    <AntDesign style={{ paddingLeft: '20%' }} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                />
                <TouchableOpacity disabled={isCreatingSchedule} onPress={handleSchedule} style={[style.scheduleButton, { display: 'flex', flexDirection: 'row', width: 90 }]}>
                    <FontAwesome5 name="calendar-check" size={20} color="white" />
                    <Text style={[style.scheduleText, { fontSize: 13, paddingLeft: 5 }]}>Agendar</Text>
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
                        fontSize: 16,
                        calendarBackground: '#E0E0E0',
                        textSectionTitleColor: '#000',
                        arrowColor: '#092955',
                    }}
                    monthFormat={'yyyy MMMM'}
                    firstDay={1}
                    markedDates={calendarMarkedDates}
                    onDayPress={(day) => {
                        if (day.dateString !== selectedCalendarDate) {
                            dateDetailsRequestIdRef.current += 1;
                            dateDetailsAbortControllerRef.current?.abort();
                            dateDetailsAbortControllerRef.current = null;

                            setSelectedDateDetails([]);
                        }
                        setSelectedCalendarDate(day.dateString);
                    }}
                />
                {selectedDateDetails.length > 0 && (
                    <ScrollView style={style.detailsContainer} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                        {selectedDateDetails.map((detail, index) => (
                            <View key={index} style={style.detailItem}>
                                <Text style={style.detailsText}>
                                    <Text style={{ fontWeight: 'bold' }}>Agendamento:</Text> {detail.procedureTypeLabel}
                                </Text>
                                <Text style={[style.detailsText, { marginBottom: 5 }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Data:</Text> {detail.date}
                                </Text>
                                <View style={{ display: 'flex', flexDirection: 'row' }}>
                                    <TouchableOpacity disabled={isDeletingSchedule} onPress={() => handleDelete(detail.id)} style={[style.listButtonEdit, { width: 90 }]}>
                                        <Feather name="x" size={20} color="#E0E0E0" />
                                        <Text style={{ color: '#E0E0E0' }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => navigation.navigate('EditarAgendamento', { detail })} style={[style.listButtonEdit, { marginTop: 0, height: 30 }]}>
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
    );
}
