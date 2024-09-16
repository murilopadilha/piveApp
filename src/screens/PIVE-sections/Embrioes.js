import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import style from "../../components/style";

export default ({ route, navigation }) => {
    const { fiv } = route.params;
    const [oocyteCollections, setOocyteCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://18.218.115.38:8080/fiv/${fiv.id}`);
                setOocyteCollections(response.data.oocyteCollections);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [fiv.id]);

    if (loading) {
        return (
            <SafeAreaView style={style.menu}>
                <ActivityIndicator size="small" color="#092955" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={style.menu}>
                <Text>Error: {error.message}</Text>
            </SafeAreaView>
        );
    }

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity style={styles.item}>
                <View style={styles.row}>
                    <Text style={styles.label}>Doadora:</Text>
                    <Text style={styles.value}>{item.donorCattle.registrationNumber}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Touro:</Text>
                    <Text style={styles.value}>{item.bull.registrationNumber}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Total Oócitos:</Text>
                    <Text style={styles.value}>{item.totalOocytes}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Oócitos Viáveis:</Text>
                    <Text style={styles.value}>{item.viableOocytes}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Aproveitamento Embriões:</Text>
                    {item.embryoProduction
                        ? <Text style={styles.value}>{item.embryoProduction.embryosPercentage || '-'}%</Text>
                        : <Text style={styles.value}>-</Text>
                    }
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Coletas realizadas</Text>
            </View>
            <FlatList
                data={oocyteCollections}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        padding: 10,
    },
    itemContainer: {
        marginBottom: 10,
    },
    item: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
        fontWeight: 'bold',
    },
    value: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
    },
});
