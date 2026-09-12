import React from 'react'
import { Platform, Text, TouchableOpacity, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'

import style from '../../../components/style'

export default function PiveListItem({ fiv, onPress }) {
    return (
        <TouchableOpacity
            style={[style.listItemPive, {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
            }]}
            onPress={onPress}
        >
            <View style={{ display: 'flex', flexDirection: 'column', width: 320 }}>
                <View style={{ display: 'flex', flexDirection: 'row', marginBottom: '1%' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, marginTop: '0.5%'}}>FIV ID: </Text>
                    <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10, marginTop: '0.5%'}}>{fiv.id}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: '2%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Coleta dos Oócitos: </Text>
                        {fiv.status === 'OOCYTE_COLLECTION_COMPLETED' || fiv.status === 'COMPLETED' ? (
                            <MaterialIcons name="done" size={20} color="#555" />
                        ) : (
                            <Feather name="x" size={20} color="#555" />
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: '0%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Embriões: </Text>
                        {fiv.status === 'COMPLETED'  ? (
                            <MaterialIcons name="done" size={20} color="#555" />
                        ) : (
                            <Feather name="x" size={20} color="#555" />
                        )}
                    </View>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 5}}>
                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Data Asp: </Text>
                    <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10,}}>{fiv.date ? fiv.date : '-'}</Text>
                </View>
                <View style={{display: 'flex', flexDirection: 'row'}}>
                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Cliente/Fazenda: </Text>
                    <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10}}>{fiv.client ? fiv.client : '-'}</Text>
                    <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10}}>/</Text>
                    <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10,}}>{fiv.farm ? fiv.farm : '-'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}
