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
            <View style={{justifyContent: 'center', alignItems: 'center', marginTop: 300}}>
                <Text>PIVE page</Text>
            </View>
        </SafeAreaView>
    )
}