import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, FlatList } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from "axios";
import style from "../../components/style";

export default ({ route, navigation }) => {
    const { cultivationId } = route.params

    const [embryos, setEmbryos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchEmbryos = async () => {
            try {
                const response = await axios.get(`http://18.218.115.38:8080/cultivation/${cultivationId}`)
                console.log("Embryos data:", response.data.embryos)
                if (response.data && Array.isArray(response.data.embryos)) {
                    setEmbryos(response.data.embryos)
                } else {
                    console.warn("Embryos data is not an array or is empty.")
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchEmbryos()
    }, [cultivationId])

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>ID:</Text>
                <Text style={styles.itemText}>{item.id}</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>Touro:</Text>
                <Text style={styles.itemText}>{item.bull.name} ({item.bull.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>Doadora:</Text>
                <Text style={styles.itemText}>{item.donorCattle.name} ({item.donorCattle.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>Receptora:</Text>
                <Text style={styles.itemText}>{item.receiverCattle.name} ({item.receiverCattle.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>Congelado:</Text>
                <Text style={styles.itemText}>{item.frozen ? 'Sim' : 'Não'}</Text>
            </View>
        </View>
    )

    if (loading) {
        return <ActivityIndicator size="large" color="#092955" />
    }

    if (error) {
        return <Text>Error: {error}</Text>
    }

    return (
        <View style={style.menu}>
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
            <View style={[style.listItem, { marginHorizontal: 20, paddingBottom: 350 }]}>
                <FlatList
                    style={{ marginTop: 5 }}
                    data={embryos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    itemContainer: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginTop: 5,
        borderRadius: 10
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    boldText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemText: {
        fontSize: 16,
        color: '#555',
    },
})
