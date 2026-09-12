import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import style from '../../../components/style'

export default function EmbryoTransferActions({
    isSubmitting,
    onViewTransfers,
    onSubmit,
}) {
    return (
        <View style={{ display: 'flex', flexDirection: 'row' }}>
            <TouchableOpacity
                onPress={onViewTransfers}
                style={[style.listButtonEdit, { marginLeft: '10%', marginTop: '5%', height: '60%', width: '35%', paddingTop: '1%' }]}
            >
                <FontAwesome6 name="clipboard-list" size={20} color="#E0E0E0" />
                <Text style={{ color: '#E0E0E0', paddingTop: 1, paddingLeft: 5 }}>Transferências</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[style.listButtonEdit, { marginLeft: '20%', marginTop: '5%', height: '60%', width: '23%', paddingTop: '1%' }]}
                onPress={onSubmit}
                disabled={isSubmitting}
            >
                <MaterialIcons name="done" size={20} color="#fff" />
                <Text style={[style.buttonText, { marginLeft: 5, paddingTop: '1%' }]}>Salvar</Text>
            </TouchableOpacity>
        </View>
    )
}
