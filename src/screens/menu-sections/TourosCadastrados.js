import React, {useState} from "react";
import { Text, TextInput, View, TouchableOpacity } from "react-native";

import AntDesign from '@expo/vector-icons/AntDesign';

import style from "../../components/style";

export default ({ navigation }) => {

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => {
                    navigation.navigate('Menu')
                }}>
                    <View style={{marginRight: 50}}>
                    <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Touros Cadastrados</Text>
            </View>
            <View style={style.content}>
            </View>
        </View>
    )
}