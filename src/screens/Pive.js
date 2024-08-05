import React, {useState} from "react";
import { Text, TextInput, View, Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LinearGradient from 'react-native-linear-gradient';

import style from "../components/style";

export default (props) => {
    return (
        <SafeAreaView>
            <View style={[style.divTitle]} >
                <TouchableOpacity>
                    <View style={{marginRight: 50}}>
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
            </View>
            <LinearGradient
                colors={['#2E4BA8', '#d3d3d3']} // Cores do degradê
                start={{ x: 0, y: 1 }} // Início do degradê (esquerda inferior)
                end={{ x: 1, y: 1 }}   // Fim do degradê (centro inferior)
                locations={[0.1, 0.9]}
                style={style.bottomBorder}
            />
            <View style={{justifyContent: 'center', alignItems: 'center', marginTop: 300}}>
                <Text>PIVE page</Text>
            </View>
        </SafeAreaView>
    )
}