import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import {
    ANIMAL_PERMISSIONS,
    hasAnimalPermission,
} from '../features/animals/animalPermissions'
import { useEffectiveContextQuery } from '../features/auth/hooks/useIdentityQueries'
import { useOrganization } from '../features/organizations/OrganizationContext'
import { ANIMAL_ROUTES } from '../features/animals/routes'
import AnimalDetail from '../features/animals/screens/AnimalDetail'
import AnimalSearch from '../features/animals/screens/AnimalSearch'
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
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const showCanonicalDirectory = effectiveContextQuery.isSuccess &&
        hasAnimalPermission(
            effectiveContextQuery.data,
            ANIMAL_PERMISSIONS.READ
        )
    const renderMenu = React.useCallback(props => (
        <Menu
            {...props}
            showCanonicalDirectory={showCanonicalDirectory}
        />
    ), [showCanonicalDirectory])

    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name='Menu'>
                {renderMenu}
            </Stack.Screen>
            <Stack.Screen
                name={ANIMAL_ROUTES.SEARCH}
                component={AnimalSearch}
            />
            <Stack.Screen
                name={ANIMAL_ROUTES.DETAIL}
                component={AnimalDetail}
                options={{
                    headerShown: true,
                    title: 'Animal',
                }}
            />
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
