import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Octicons from '@expo/vector-icons/Octicons'

import style from '../../../components/style'

export default function DonorListItem({ data, isDeleting, onEdit, onRemove }) {
    return (
        <View style={style.listItem}>
            <View style={styles.content}>
                <Text style={style.listText}>
                    <Text style={styles.label}>Nome: </Text>
                    {data?.name || '-'} ({data?.breed || '-'})
                </Text>
                <Text style={style.listText}>
                    <Text style={styles.label}>Identificação: </Text>
                    {data?.registrationNumber || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={styles.label}>Nascimento: </Text>
                    {data?.birth || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={styles.label}>Média oócitos viáveis: </Text>
                    {data?.averageViableOocytes ?? '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={styles.label}>Eficiência emb viáveis: </Text>
                    {data?.averageEmbryoPercentage ?? '-'}
                </Text>
            </View>
            <View style={style.listButtons}>
                <TouchableOpacity
                    disabled={isDeleting}
                    style={style.listButtonDelete}
                    onPress={() => onRemove(data.id)}
                >
                    <Octicons name="trash" size={20} color="#908D8E" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[style.listButtonDelete, styles.deleteButton]}
                    onPress={() => onEdit(data)}
                >
                    <Octicons name="pencil" size={20} color="#908D8E" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    content: {
        alignSelf: 'center',
    },
    label: {
        fontWeight: 'bold',
    },
    deleteButton: {
        marginTop: 2,
    },
})
