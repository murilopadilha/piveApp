import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import style from '../../../components/style'

export default function EmbryoTransferActions({
    isSubmitting,
    onViewTransfers,
    onSubmit,
}) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onViewTransfers}
                style={[style.listButtonEdit, styles.transfersButton]}
            >
                <FontAwesome6 name="clipboard-list" size={20} color="#E0E0E0" />
                <Text style={styles.transfersText}>Transferências</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[style.listButtonEdit, styles.submitButton]}
                onPress={onSubmit}
                disabled={isSubmitting}
            >
                <MaterialIcons name="done" size={20} color="#fff" />
                <Text style={[style.buttonText, styles.submitText]}>Salvar</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
    },
    transfersButton: {
        marginLeft: '10%',
        marginTop: '5%',
        height: '60%',
        width: '35%',
        paddingTop: '1%',
    },
    transfersText: {
        color: '#E0E0E0',
        paddingTop: 1,
        paddingLeft: 5,
    },
    submitButton: {
        marginLeft: '20%',
        marginTop: '5%',
        height: '60%',
        width: '23%',
        paddingTop: '1%',
    },
    submitText: {
        marginLeft: 5,
        paddingTop: '1%',
    },
})
