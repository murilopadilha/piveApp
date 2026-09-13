import { View, Platform, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

import AnimalsStack from './AnimalsStack'
import PiveStack from './PiveStack'
import CalendarStack from './CalendarStack'

const Tab = createBottomTabNavigator()

export default function RootTabs() {
    return (
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
            <Tab.Screen name="Animais" component={AnimalsStack} options={{
                headerShown: false,
                tabBarIcon: ({ focused }) => {
                    if(focused){
                        return <MaterialCommunityIcons name="cow" size={26} color="#092955" />
                    }

                    return <MaterialCommunityIcons name="cow-off" size={24} color="#000" />
                }
            }}/>
            <Tab.Screen name="PIVE" component={PiveStack} options={{
                headerShown: false,
                tabBarIcon: ({ focused }) => {
                    if(focused){
                        return <FontAwesome5 name="file-invoice" size={26} color="#092955" />
                    }

                    return <FontAwesome5 name="file-alt" size={24} color="#000" />
                }
            }}/>
            <Tab.Screen name="Calendário" component={CalendarStack} options={{
                headerShown: false,
                tabBarIcon: ({ focused }) => {
                    if(focused){
                        return <Entypo name="calendar" size={26} color="#092955" />
                    }

                    return <AntDesign name="calendar" size={24} color="#000" />
                }
            }}/>
        </Tab.Navigator>
    )
}
