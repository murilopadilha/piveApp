import * as React from 'react';
import { Text, View, SafeAreaView, Platform } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
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
import Embrioes from './screens/PIVE-sections/Embrioes';
import Cabecalho from './screens/PIVE-sections/Cabecalho';
import Descartados from './screens/PIVE-sections/Descartados';
import Congelados from './screens/PIVE-sections/Congelados';
import Transferencia from './screens/PIVE-sections/Transferencia';
import Transferidos from './screens/PIVE-sections/Transferidos';
import Prenhez from './screens/PIVE-sections/Prenhez';
import ReceptorasPrenhaz from './screens/PIVE-sections/ReceptorasPrenhaz.js';

const AnimalsStack = createStackNavigator()

function AnimalsTabStack() {
  return(
    <AnimalsStack.Navigator screenOptions={{
      headerShown: false,
    }}>
      <AnimalsStack.Screen name='Menu' component={Menu}/>
      <AnimalsStack.Screen name='CadastrarReceptora' component={CadastrarReceptoras}/>
      <AnimalsStack.Screen name='CadastrarDoadora' component={CadastrarDoadora} />
      <AnimalsStack.Screen name='CadastrarTouro' component={CadastrarTouro} />
      <AnimalsStack.Screen name='ReceptorasCadastradas' component={ReceptorasCadastradas} />
      <AnimalsStack.Screen name='DoadorasCadastradas' component={DoadorasCadastradas} />
      <AnimalsStack.Screen name='TourosCadastrados' component={TourosCadastrados} />
      <AnimalsStack.Screen name="EditarDoadora" component={EditarDoadora} />
      <AnimalsStack.Screen name="EditarReceptora" component={EditarReceptora} />
      <AnimalsStack.Screen name="EditarTouro" component={EditarTouro} />
    </AnimalsStack.Navigator>
  )
}

const PiveStack = createStackNavigator()

function PiveTabStack() {
  return(
    <PiveStack.Navigator screenOptions={{
      headerShown: false,
    }}>
      <PiveStack.Screen name="Pive" component={Pive} />
      <PiveStack.Screen name="Cabecalho" component={Cabecalho} />
      <PiveStack.Screen name="FivInfo" component={FivInfo} />
      <PiveStack.Screen name="ColetaOocitos" component={ColetaOocitos} />
      <PiveStack.Screen name="Embrioes" component={Embrioes} />
      <PiveStack.Screen name="Cultivo" component={Cultivo} />
      <PiveStack.Screen name="Descartados" component={Descartados} />
      <PiveStack.Screen name="Congelados" component={Congelados} />
      <PiveStack.Screen name="Transferidos" component={Transferidos} />
      <PiveStack.Screen name="Transferencia" component={Transferencia} />
      <PiveStack.Screen name="Prenhez" component={Prenhez} />
      <PiveStack.Screen name="ReceptorasPrenhaz" component={ReceptorasPrenhaz} />
    </PiveStack.Navigator>
  )
}

const CalendarStack = createStackNavigator()

function CalendarTabStack() {
  return(
    <CalendarStack.Navigator screenOptions={{
      headerShown: false,
    }}>
      <CalendarStack.Screen name='Calendario' component={Calendario}/>
      <CalendarStack.Screen name="EditarAgendamento" component={EditarAgendamento} />
    </CalendarStack.Navigator>
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
          fontSize: Platform.OS === 'ios' ? 12 : 6,
          paddingBottom: '5%'
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
            <BlurView 
              style={{ flex: 1, backgroundColor: "transparent" }}
              blurType='xlight'
              blurAmount={5}
            /> 
          </View>
        )
      }}>
        <Tab.Screen name="Animais" component={AnimalsTabStack} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return  <MaterialCommunityIcons name="cow" size={26} color="#092955" />
            }

            return <MaterialCommunityIcons name="cow-off" size={24} color="#000" /> 
          }
        }}/>
        <Tab.Screen name="PIVE" component={PiveTabStack} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return <FontAwesome5 name="file-invoice" size={26} color="#092955" />
            }

            return <FontAwesome5 name="file-alt" size={24} color="#000" />
          }
        }}/>
        <Tab.Screen name="Calendário" component={CalendarTabStack} options={{
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
