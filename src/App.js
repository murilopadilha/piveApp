import * as React from 'react';
import { Text, View, SafeAreaView } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { BlurView } from '@react-native-community/blur';
import '../gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import style from './components/style';

import Menu from './screens/Menu';
import Calendario from './screens/Calendario';
import Pive from './screens/Pive';

import CadastrarReceptoras from './screens/menu-sections/CadastrarReceptora';
import CadastrarDoadora from './screens/menu-sections/CadastrarDoadora';
import CadastrarTouro from './screens/menu-sections/CadastrarTouro';
import ReceptorasCadastradas from './screens/menu-sections/ReceptorasCadastradas';
import DoadorasCadastradas from './screens/menu-sections/DoadorasCadastradas';
import TourosCadastrados from './screens/menu-sections/TourosCadastrados';
import EditarDoadora from './screens/menu-sections/EditarDoadora';
import EditarReceptora from './screens/menu-sections/EditarReceptora'
import EditarTouro from './screens/menu-sections/EditarTouro';
import EditarAgendamento from './screens/calendar-sections/EditarAgendamento';
import ColetaOocitos from './screens/PIVE-sections/ColetaOocitos';
import FivInfo from './screens/PIVE-sections/FivInfo';
import Cultivo from './screens/PIVE-sections/Cultivo';
import EmbrioesViaveis from './screens/PIVE-sections/EmbrioesViaveis';
import Cabecalho from './screens/PIVE-sections/Cabecalho';

const MenuStack = createStackNavigator()

function MenuTabStack() {
  return(
    <MenuStack.Navigator screenOptions={{
      headerShown: false,
    }}>
      <MenuStack.Screen name='Menu' component={Menu}/>
      <MenuStack.Screen name='Calendario' component={Calendario}/>
      <MenuStack.Screen name='CadastrarReceptora' component={CadastrarReceptoras}/>
      <MenuStack.Screen name='CadastrarDoadora' component={CadastrarDoadora} />
      <MenuStack.Screen name='CadastrarTouro' component={CadastrarTouro} />
      <MenuStack.Screen name='ReceptorasCadastradas' component={ReceptorasCadastradas} />
      <MenuStack.Screen name='DoadorasCadastradas' component={DoadorasCadastradas} />
      <MenuStack.Screen name='TourosCadastrados' component={TourosCadastrados} />
      <MenuStack.Screen name="EditarDoadora" component={EditarDoadora} />
      <MenuStack.Screen name="EditarReceptora" component={EditarReceptora} />
      <MenuStack.Screen name="EditarTouro" component={EditarTouro} />
      <MenuStack.Screen name="EditarAgendamento" component={EditarAgendamento} />
      <MenuStack.Screen name="ColetaOocitos" component={ColetaOocitos} />
      <MenuStack.Screen name="Pive" component={Pive} />
      <MenuStack.Screen name="FivInfo" component={FivInfo} />
      <MenuStack.Screen name="Cultivo" component={Cultivo} />
      <MenuStack.Screen name="EmbrioesViaveis" component={EmbrioesViaveis} />
      <MenuStack.Screen name="Cabecalho" component={Cabecalho} />
    </MenuStack.Navigator>
  )
}

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer >
      <Tab.Navigator screenOptions={{
        tabBarInactiveTintColor: '#000',
        tabBarActiveTintColor: '#092955',
        tabBarActiveBackgroundColor: '#fff',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarItemStyle:{
          height: 50,
          marginHorizontal: 10,
          marginTop: 8,
          borderRadius: 25
        },
        tabBarLabelStyle: {
          fontSize: 13
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          bottom: 14,
          left: 24,
          right: 24,
          elevation: 0,
          borderRadius: 25,
          height: 65,
        },
        tabBarBackground: () => (
          <View 
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 50,
              overflow: "hidden",
            }}
          >
            {/* <BlurView 
              style={{ flex: 1, backgroundColor: "transparent" }}
              blurType='xlight'
              blurAmount={5}
            />  */}
          </View>
        )
      }}>
        <Tab.Screen name="Animais" component={MenuTabStack} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return  <MaterialCommunityIcons name="cow" size={26} color="#092955" />
            }

            return <MaterialCommunityIcons name="cow-off" size={24} color="#000" /> 
          }
        }}/>
        <Tab.Screen name="PIVE" component={Pive} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return <FontAwesome5 name="file-invoice" size={26} color="#092955" />
            }

            return <FontAwesome5 name="file-alt" size={24} color="#000" />
          }
        }}/>
        <Tab.Screen name="Calendário" component={Calendario} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return <Entypo name="calendar" size={26} color="#092955" />
            }

            return <AntDesign name="calendar" size={24} color="#000" />
          }
        }}/>
      </Tab.Navigator>
    </NavigationContainer>
  )
}