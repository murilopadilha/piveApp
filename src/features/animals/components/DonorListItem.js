import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Octicons from '@expo/vector-icons/Octicons'

import style from '../../../components/style'

export default function DonorListItem({ data, isDeleting, onEdit, onRemove }) {
    return (
        <View style={style.listItem}>
            <View style={{ alignSelf: 'center' }}>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nome: </Text>
                    {data?.name || '-'} ({data?.breed || '-'})
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Identificação: </Text>
                    {data?.registrationNumber || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nascimento: </Text>
                    {data?.birth || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Média oócitos viáveis: </Text>
                    {data?.averageViableOocytes ?? '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
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
                    style={[style.listButtonDelete, { marginTop: 2 }]}
                    onPress={() => onEdit(data)}
                >
                    <Octicons name="pencil" size={20} color="#908D8E" />
                </TouchableOpacity>
            </View>
        </View>
    )
}
