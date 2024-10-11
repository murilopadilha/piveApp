import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Registrar prenhez</Text>
            </View>
            
        </SafeAreaView>
    )
}