import React from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'

export default function PiveListItem({ fiv, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.container, styles.shadow]}
            onPress={onPress}
        >
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.label, styles.headerText]}>FIV ID: </Text>
                    <Text style={[styles.value, styles.headerText]}>{fiv.id}</Text>
                    <View style={[styles.status, styles.oocyteStatus]}>
                        <Text style={styles.label}>Coleta dos Oócitos: </Text>
                        {fiv.status === 'OOCYTE_COLLECTION_COMPLETED' || fiv.status === 'COMPLETED' ? (
                            <MaterialIcons name="done" size={20} color="#555" />
                        ) : (
                            <Feather name="x" size={20} color="#555" />
                        )}
                    </View>
                    <View style={[styles.status, styles.embryoStatus]}>
                        <Text style={styles.label}>Embriões: </Text>
                        {fiv.status === 'COMPLETED'  ? (
                            <MaterialIcons name="done" size={20} color="#555" />
                        ) : (
                            <Feather name="x" size={20} color="#555" />
                        )}
                    </View>
                </View>
                <View style={styles.dateRow}>
                    <Text style={styles.label}>Data Asp: </Text>
                    <Text style={styles.value}>{fiv.date ? fiv.date : '-'}</Text>
                </View>
                <View style={styles.footerRow}>
                    <Text style={styles.label}>Cliente/Fazenda: </Text>
                    <Text style={styles.value}>{fiv.client ? fiv.client : '-'}</Text>
                    <Text style={styles.value}>/</Text>
                    <Text style={styles.value}>{fiv.farm ? fiv.farm : '-'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginTop: 10,
        borderRadius: 10,
        height: 90,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        width: 320,
    },
    headerRow: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: '1%',
    },
    label: {
        fontWeight: 'bold',
        fontSize: Platform.OS === 'ios' ? 13 : 10,
    },
    value: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
    },
    headerText: {
        marginTop: '0.5%',
    },
    status: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    oocyteStatus: {
        marginLeft: '2%',
    },
    embryoStatus: {
        marginLeft: '0%',
    },
    dateRow: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 5,
    },
    footerRow: {
        display: 'flex',
        flexDirection: 'row',
    },
})
