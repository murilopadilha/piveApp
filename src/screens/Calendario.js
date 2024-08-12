import React, {useState} from "react";
import { Text, TextInput, View, Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LinearGradient from 'react-native-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import style from "../components/style";

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
        })
    }

    return (
        <SafeAreaView>
            <View style={[style.divTitle]} >
                <TouchableOpacity>
                    <View style={{marginRight: 50}}>
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
            </View>
            <View>
                <Text>Agendar:</Text>
                <TextInput style={style.input}/>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{scheduleDate || "Selecione a Data"}</Text>
                </TouchableOpacity>
            </View>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Calendar />
            </View>
        </SafeAreaView>
    )
}