import React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import style from '../../../components/style'

export default function CultivationDraftForm({
    value,
    isSubmitting,
    onChange,
    onSave,
}) {
    return (
        <View>
            <TextInput
                style={style.input}
                value={value}
                placeholderTextColor={"#888"}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Digite o total de embriões"
            />
            <TouchableOpacity
                onPress={onSave}
                disabled={isSubmitting}
                style={[style.listButtonSearch, { width: '30%', height: '28%', display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '60%' }]}
            >
                <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
            </TouchableOpacity>
        </View>
    )
}
