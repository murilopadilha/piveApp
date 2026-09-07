import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import Pive from '../screens/Pive'
import Cabecalho from '../screens/PIVE-sections/Cabecalho'
import FivInfo from '../screens/PIVE-sections/FivInfo'
import ColetaOocitos from '../screens/PIVE-sections/ColetaOocitos'
import Embrioes from '../screens/PIVE-sections/Embrioes'
import Cultivo from '../screens/PIVE-sections/Cultivo'
import Descartados from '../screens/PIVE-sections/Descartados'
import Congelados from '../screens/PIVE-sections/Congelados'
import Transferidos from '../screens/PIVE-sections/Transferidos'
import Transferencia from '../screens/PIVE-sections/Transferencia'
import Prenhez from '../screens/PIVE-sections/Prenhez'
import ReceptorasPrenhaz from '../screens/PIVE-sections/ReceptorasPrenhaz.js'

const Stack = createStackNavigator()

export default function PiveStack() {
    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="Pive" component={Pive} />
            <Stack.Screen name="Cabecalho" component={Cabecalho} />
            <Stack.Screen name="FivInfo" component={FivInfo} />
            <Stack.Screen name="ColetaOocitos" component={ColetaOocitos} />
            <Stack.Screen name="Embrioes" component={Embrioes} />
            <Stack.Screen name="Cultivo" component={Cultivo} />
            <Stack.Screen name="Descartados" component={Descartados} />
            <Stack.Screen name="Congelados" component={Congelados} />
            <Stack.Screen name="Transferidos" component={Transferidos} />
            <Stack.Screen name="Transferencia" component={Transferencia} />
            <Stack.Screen name="Prenhez" component={Prenhez} />
            <Stack.Screen name="ReceptorasPrenhaz" component={ReceptorasPrenhaz} />
        </Stack.Navigator>
    )
}
