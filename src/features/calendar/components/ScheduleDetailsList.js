import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import Octicons from '@expo/vector-icons/Octicons'

import style from '../../../components/style'

export default function ScheduleDetailsList({
    details,
    isDeleting,
    onDelete,
    onEdit,
}) {
    if (details.length === 0) return null

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {details.map(detail => (
                <View key={detail.id} style={styles.item}>
                    <Text style={styles.text}>
                        <Text style={styles.label}>Agendamento:</Text> {detail.procedureTypeLabel}
                    </Text>
                    <Text style={[styles.text, styles.dateText]}>
                        <Text style={styles.label}>Data:</Text> {detail.date}
                    </Text>
                    <View style={styles.actions}>
                        <TouchableOpacity disabled={isDeleting} onPress={() => onDelete(detail.id)} style={[style.listButtonEdit, styles.deleteButton]}>
                            <Feather name="x" size={20} color="#E0E0E0" />
                            <Text style={styles.actionText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onEdit(detail)} style={[style.listButtonEdit, styles.editButton]}>
                            <Octicons name="pencil" size={20} color="#E0E0E0" />
                            <Text style={styles.actionText}>Editar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#E0E0E0',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        width: 350,
    },
    content: {
        paddingBottom: 80,
    },
    item: {
        padding: 10,
        borderBottomColor: '#fff',
        borderBottomWidth: 1,
    },
    text: {
        paddingLeft: 5,
        paddingBottom: 3,
        fontSize: Platform.OS === 'ios' ? 14 : 10,
        color: '#333',
    },
    label: {
        fontWeight: 'bold',
    },
    dateText: {
        marginBottom: 5,
    },
    actions: {
        display: 'flex',
        flexDirection: 'row',
    },
    deleteButton: {
        width: 90,
    },
    editButton: {
        marginTop: 0,
        height: 30,
    },
    actionText: {
        color: '#E0E0E0',
    },
})
