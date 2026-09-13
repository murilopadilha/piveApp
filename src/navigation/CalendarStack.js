import { createStackNavigator } from '@react-navigation/stack'

import Calendario from '../screens/Calendario'
import EditarAgendamento from '../screens/calendar-sections/EditarAgendamento'

const Stack = createStackNavigator()

export default function CalendarStack() {
    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name='Calendario' component={Calendario}/>
            <Stack.Screen name="EditarAgendamento" component={EditarAgendamento} />
        </Stack.Navigator>
    )
}
