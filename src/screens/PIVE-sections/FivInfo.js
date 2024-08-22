import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import axios from "axios";
import style from "../../components/style";

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/fiv/${fiv.id}`)
                
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setData(response.data[0])
                } else if (response.data && response.data.oocyteCollection) {
                    setData(response.data)
                } else {
                    setData(null)
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [fiv])

    if (loading) {
        return <ActivityIndicator size="large" color="#092955" />
    }

    if (error) {
        return <Text>Error: {error}</Text>
    }

    return (
        <View style={styles.container}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Informação da FIV</Text>
            </View>
            <ScrollView style={[styles.scrollContainer, { marginHorizontal: 20 }]}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coleta dos Oócitos</Text>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Data da coleta:</Text>
                            <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.date : '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Fazenda:</Text>
                            <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.farm : '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Cliente:</Text>
                            <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.client : '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Veterinário:</Text>
                            <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.veterinarian : '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Técnico:</Text>
                            <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.technical : '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Doadora:</Text>
                            <Text style={styles.value}>{data.oocyteCollection && data.oocyteCollection.donorCattle ? `${data.oocyteCollection.donorCattle.name} (${data.oocyteCollection.donorCattle.registrationNumber})` : '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Touro:</Text>
                            <Text style={styles.value}>{data.oocyteCollection && data.oocyteCollection.bull ? `${data.oocyteCollection.bull.name} (${data.oocyteCollection.bull.registrationNumber})` : '-'}</Text>
                        </View>
                    </View>
                    <Text style={[styles.sectionTitle, styles.oocytesTitle]}>Oócitos:</Text>
                    <View style={styles.oocytesContainer}>
                        <View style={styles.oocytesRow}>
                            <View style={styles.oocytesItem}>
                                <Text style={styles.label}>Total:</Text>
                                <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.totalOocytes : '-'}</Text>
                            </View>
                            <View style={styles.oocytesItem}>
                                <Text style={styles.label}>Viáveis:</Text>
                                <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.viableOocytes : '-'}</Text>
                            </View>
                            <View style={styles.oocytesItem}>
                                <Text style={styles.label}>Inviáveis:</Text>
                                <Text style={styles.value}>{data.oocyteCollection ? data.oocyteCollection.nonViableOocytes : '-'}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={[styles.sectionTitle, styles.cultivationTitle]}>Cultivo</Text>
                    <View style={styles.cultivationContainer}>
                        <View style={styles.cultivationItem}>
                            <Text style={styles.label}>Total de Embriões:</Text>
                            <Text style={styles.value}>{data.cultivation ? data.cultivation.totalEmbryos : '-'}</Text>
                        </View>
                        <View style={styles.cultivationItem}>
                            <Text style={styles.label}>Embriões Viáveis:</Text>
                            <Text style={styles.value}>{data.cultivation ? data.cultivation.viableEmbryos : '-'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ColetaOocitos', { fiv: fiv })}
                        style={[style.listButtonEdit, { marginTop: 0, marginLeft: 125, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                    >
                        <Octicons name="pencil" size={20} color="#E0E0E0" />
                        <Text style={{ color: '#E0E0E0', paddingTop: 1 }}>Registrar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
        flex: 1,
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
        padding: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoContainer: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    label: {
        fontWeight: 'bold',
    },
    value: {
        color: '#555',
    },
    oocytesTitle: {
        marginTop: 20,
    },
    oocytesContainer: {
        marginBottom: 20,
    },
    oocytesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    oocytesItem: {
        flex: 1,
        alignItems: 'center',
    },
    cultivationTitle: {
        marginTop: 20,
    },
    cultivationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 20,
    },
    cultivationItem: {
        flex: 1,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#E0E0E0',
        marginLeft: 5,
    },
})
