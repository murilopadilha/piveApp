import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, TextInput } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import axios from "axios";
import style from "../../components/style";

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {

    return (
        <View>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Embriões Viáveis</Text>
            </View>
            <View style={style.searchPive}>
                <TextInput
                    placeholder="Buscar Embrião"
                    style={style.input}
                />
                <TouchableOpacity
                onPress={() => navigation.navigate('ColetaOocitos', { fiv: fiv })}
                style={[style.listButtonEdit, { marginLeft: 10, marginTop: 5, height: 30, width: 150 }]}
                >
                    <MaterialCommunityIcons name="clipboard-text-search-outline" size={24} color="#E0E0E0" />
                    <Text style={{ color: '#E0E0E0', paddingTop: 1 }}>Todos Embriões</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={{ marginHorizontal: 20 }}>
                <TouchableOpacity
                onPress={() => navigation.navigate('ColetaOocitos', { fiv: fiv })}
                style={[style.listButtonEdit, { marginTop: 0, marginLeft: 125, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                >
                    <Octicons name="pencil" size={20} color="#E0E0E0" />
                    <Text style={{ color: '#E0E0E0', paddingTop: 1 }}>Registrar</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}