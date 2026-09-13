import React from 'react'
import { StyleSheet } from 'react-native'
import { Calendar } from 'react-native-calendars'

export default function ScheduleCalendarView({ markedDates, onDayPress }) {
    return (
        <Calendar
            style={styles.calendar}
            headerStyle={styles.header}
            theme={calendarTheme}
            monthFormat={'yyyy MMMM'}
            firstDay={1}
            markedDates={markedDates}
            onDayPress={onDayPress}
        />
    )
}

const calendarTheme = {
    todayTextColor: '#092955',
    monthTextColor: '#000',
    selectedDayBackgroundColor: '#092955',
    selectedDayTextColor: '#FFFFFF',
    dayTextColor: '#000',
    fontSize: 16,
    calendarBackground: '#E0E0E0',
    textSectionTitleColor: '#000',
    arrowColor: '#092955',
}

const styles = StyleSheet.create({
    calendar: {
        width: 350,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#E0E0E0',
    },
    header: {
        backgroundColor: '#E0E0E0',
        borderBottomWidth: 1,
        borderBottomColor: '#092955',
    },
})
