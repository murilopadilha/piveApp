import React, {useState} from "react";
import { Text, TextInput, View, TouchableOpacity,StyleSheet } from "react-native";

import AntDesign from '@expo/vector-icons/AntDesign';

import style from "../../components/style";

export default ({ navigation }) => {
    async function fetchDonors() {

        const response = await fetch('http://192.168.1.183:8080/donor')
        const donors = await response.json()

        const donorsData = JSON.stringify(donors)

        return donorsData;
    }  

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText}>Nome: {item.name}</Text>
            <Text style={styles.itemText}>Raça: {item.breed}</Text>
            <Text style={styles.itemText}>Identificação: {item.registrationNumber}</Text>
            <Text style={styles.itemText}>Nascimento: {item.birth}</Text>
        </View>
    );

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
                <Text style={style.titleText}>Doadoras Cadastradas</Text>
            </View>
            <View style={style.content}>
                {renderItem(fetchDonors())}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    itemContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    itemText: {
        fontSize: 16,
    },
});