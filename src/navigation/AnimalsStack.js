import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import Menu from '../screens/Menu'
import CadastrarReceptoras from '../screens/menu-sections/CadastrarReceptora'
import CadastrarDoadora from '../screens/menu-sections/CadastrarDoadora'
import CadastrarTouro from '../screens/menu-sections/CadastrarTouro'
import ReceptorasCadastradas from '../screens/menu-sections/ReceptorasCadastradas'
import DoadorasCadastradas from '../screens/menu-sections/DoadorasCadastradas'
import TourosCadastrados from '../screens/menu-sections/TourosCadastrados'
import EditarDoadora from '../screens/menu-sections/EditarDoadora'
import EditarReceptora from '../screens/menu-sections/EditarReceptora'
import EditarTouro from '../screens/menu-sections/EditarTouro'

const Stack = createStackNavigator()

export default function AnimalsStack() {
    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name='Menu' component={Menu}/>
            <Stack.Screen name='CadastrarReceptora' component={CadastrarReceptoras}/>
            <Stack.Screen name='CadastrarDoadora' component={CadastrarDoadora} />
            <Stack.Screen name='CadastrarTouro' component={CadastrarTouro} />
            <Stack.Screen name='ReceptorasCadastradas' component={ReceptorasCadastradas} />
            <Stack.Screen name='DoadorasCadastradas' component={DoadorasCadastradas} />
            <Stack.Screen name='TourosCadastrados' component={TourosCadastrados} />
            <Stack.Screen name="EditarDoadora" component={EditarDoadora} />
            <Stack.Screen name="EditarReceptora" component={EditarReceptora} />
            <Stack.Screen name="EditarTouro" component={EditarTouro} />
        </Stack.Navigator>
    )
}
