import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { useEffectiveContextQuery } from '../features/auth/hooks/useIdentityQueries'
import { useOrganization } from '../features/organizations/OrganizationContext'
import {
    OPU_PERMISSIONS,
    hasOpuPermission,
} from '../features/opu/opuPermissions'
import { OPU_ROUTES } from '../features/opu/routes'
import OocyteCollectionDetail from '../features/opu/screens/OocyteCollectionDetail'
import OpuCollectionBatch from '../features/opu/screens/OpuCollectionBatch'
import OpuSessionCreate from '../features/opu/screens/OpuSessionCreate'
import OpuSessionDetail from '../features/opu/screens/OpuSessionDetail'
import OpuSessionList from '../features/opu/screens/OpuSessionList'
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
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const showTargetOpu = effectiveContextQuery.isSuccess && hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.READ
    )
    const renderPive = React.useCallback(props => (
        <Pive {...props} showTargetOpu={showTargetOpu} />
    ), [showTargetOpu])

    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="Pive">
                {renderPive}
            </Stack.Screen>
            <Stack.Screen
                name={OPU_ROUTES.LIST}
                component={OpuSessionList}
            />
            <Stack.Screen
                name={OPU_ROUTES.DETAIL}
                component={OpuSessionDetail}
                options={{ headerShown: true, title: 'OPU' }}
            />
            <Stack.Screen
                name={OPU_ROUTES.CREATE}
                component={OpuSessionCreate}
                options={{ headerShown: true, title: 'Nova OPU' }}
            />
            <Stack.Screen
                name={OPU_ROUTES.COLLECTION_BATCH}
                component={OpuCollectionBatch}
                options={{ headerShown: true, title: 'Coletas da OPU' }}
            />
            <Stack.Screen
                name={OPU_ROUTES.COLLECTION_DETAIL}
                component={OocyteCollectionDetail}
                options={{ headerShown: true, title: 'Coleta de oócitos' }}
            />
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
