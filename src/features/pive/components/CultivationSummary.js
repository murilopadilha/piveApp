import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import style from '../../../components/style'

export default function CultivationSummary({
    embryoProduction,
    onOpenDiscarded,
    onOpenFrozen,
    onOpenTransferred,
}) {
    return (
        <View style={styles.container}>
            <View style={styles.primaryMetrics}>
                <View>
                    <Text style={styles.metricLabel}>Total de Embriões:</Text>
                    <Text style={styles.metricValue}>{embryoProduction.totalEmbryos}</Text>
                </View>
                <View>
                    <Text style={styles.metricLabel}>Embriões registrados:</Text>
                    <Text style={styles.metricValue}>{embryoProduction.embryosRegistered}/{embryoProduction.totalEmbryos}</Text>
                </View>
            </View>
            <View style={styles.dispositionMetrics}>
                <View>
                    <Text style={styles.metricLabel}>Transferidos:</Text>
                    <Text style={styles.metricValue}>{embryoProduction.numberTransferredEmbryos}</Text>
                </View>
                <View>
                    <Text style={styles.metricLabel}>Congelados:</Text>
                    <Text style={styles.metricValue}>{embryoProduction.numberFrozenEmbryos}</Text>
                </View>
                <View>
                    <Text style={styles.metricLabel}>Descartados:</Text>
                    <Text style={styles.metricValue}>{embryoProduction.numberDiscardedEmbryos}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={onOpenDiscarded}
                    style={[style.listButtonSearch, styles.edgeActionButton]}
                >
                    <Text style={styles.actionText}>Descartados</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onOpenFrozen}
                    style={[style.listButtonSearch, styles.actionButton]}
                >
                    <Text style={styles.actionText}>Congelados</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onOpenTransferred}
                    style={[style.listButtonSearch, styles.edgeActionButton]}
                >
                    <Text style={styles.actionText}>Transferidos</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    primaryMetrics: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dispositionMetrics: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '10%',
    },
    metricLabel: {
        color: '#000',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    metricValue: {
        alignSelf: 'center',
        marginRight: '3%',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: '20%',
    },
    actionButton: {
        width: '30%',
    },
    edgeActionButton: {
        width: '30%',
        paddingLeft: '0%',
        paddingBottom: '2%',
    },
    actionText: {
        color: '#FFFFFF',
        paddingTop: 3,
        paddingLeft: 10,
    },
})
