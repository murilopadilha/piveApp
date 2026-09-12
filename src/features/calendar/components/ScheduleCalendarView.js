import React from 'react'
import { Calendar } from 'react-native-calendars'

import style from '../../../components/style'

export default function ScheduleCalendarView({ markedDates, onDayPress }) {
    return (
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
            markedDates={markedDates}
            onDayPress={onDayPress}
        />
    )
}
