import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign'

import style from './style'

export default function ScreenHeader({ title, onBack }) {
    return (
        <View style={style.divTitle}>
            <TouchableOpacity onPress={onBack}>
                <View style={{ marginRight: '8%' }}>
                    <AntDesign name="arrowleft" size={24} color="#092955" />
                </View>
            </TouchableOpacity>
            <Text style={style.titleText}>{title}</Text>
        </View>
    )
}
