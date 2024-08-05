import * as React from 'react';
import { Text, View, SafeAreaView } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import '../gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';

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

const MenuStack = createStackNavigator()

function MenuTabStack() {
  return(
    <MenuStack.Navigator screenOptions={{
      headerShown: false,
    }}>
      <MenuStack.Screen name='Menu' component={Menu}/>
      <MenuStack.Screen name='CadastrarReceptora' component={CadastrarReceptoras}/>
      <MenuStack.Screen name='CadastrarDoadora' component={CadastrarDoadora} />
    </MenuStack.Navigator>
  )
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer >
      <Tab.Navigator screenOptions={{
        tabBarInactiveTintColor: '#fff',
        tabBarActiveTintColor: '#2E4BA8',
        tabBarActiveBackgroundColor: '#ffc',
        tabBarInactiveBackgroundColor: '#2E4BA8',
        tabBarItemStyle:{
          borderRadius: 10
        },
        tabBarLabelStyle: {
          fontSize: 13
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#2E4BA8',
          borderTopWidth: 0,
          bottom: 14,
          left: 14,
          right: 14,
          elevation: 0,
          borderRadius: 25,
          height: 50,

        }
      }}>
        <Tab.Screen name="Animais" component={MenuTabStack} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return  <MaterialCommunityIcons name="cow" size={24} color="#2E4BA8" />
            }

            return <MaterialCommunityIcons name="cow-off" size={24} color="#fff" /> 
          }
        }}/>
        <Tab.Screen name="PIVE" component={Pive} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return <FontAwesome5 name="file-invoice" size={24} color="#2E4BA8" />
            }

            return <FontAwesome5 name="file-alt" size={24} color="#fff" />
          }
        }}/>
        <Tab.Screen name="Calendário" component={Calendario} options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            if(focused){
              return <Entypo name="calendar" size={24} color="#2E4BA8" />
            }

            return <AntDesign name="calendar" size={24} color="#fff" />
          }
        }}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
}