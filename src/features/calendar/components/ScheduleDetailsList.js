import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
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
        <ScrollView style={style.detailsContainer} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
            {details.map(detail => (
                <View key={detail.id} style={style.detailItem}>
                    <Text style={style.detailsText}>
                        <Text style={{ fontWeight: 'bold' }}>Agendamento:</Text> {detail.procedureTypeLabel}
                    </Text>
                    <Text style={[style.detailsText, { marginBottom: 5 }]}>
                        <Text style={{ fontWeight: 'bold' }}>Data:</Text> {detail.date}
                    </Text>
                    <View style={{ display: 'flex', flexDirection: 'row' }}>
                        <TouchableOpacity disabled={isDeleting} onPress={() => onDelete(detail.id)} style={[style.listButtonEdit, { width: 90 }]}>
                            <Feather name="x" size={20} color="#E0E0E0" />
                            <Text style={{ color: '#E0E0E0' }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onEdit(detail)} style={[style.listButtonEdit, { marginTop: 0, height: 30 }]}>
                            <Octicons name="pencil" size={20} color="#E0E0E0" />
                            <Text style={{ color: '#E0E0E0' }}>Editar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    )
}
