import { createStackNavigator } from '@react-navigation/stack'

import ClientDetail from '../features/clients/screens/ClientDetail'
import ClientSearch from '../features/clients/screens/ClientSearch'
import { CLIENT_ROUTES } from '../features/clients/routes'

const Stack = createStackNavigator()

export default function ClientStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name={CLIENT_ROUTES.SEARCH}
                component={ClientSearch}
            />
            <Stack.Screen
                name={CLIENT_ROUTES.DETAIL}
                component={ClientDetail}
                options={{
                    headerShown: true,
                    title: 'Cliente',
                }}
            />
        </Stack.Navigator>
    )
}
