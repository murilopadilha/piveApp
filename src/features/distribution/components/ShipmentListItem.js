import { Pressable, StyleSheet, Text, View } from 'react-native'

import {
    formatDistributionTimestamp,
    formatShipmentStatus,
} from '../distributionPresentation'

export default function ShipmentListItem({ shipment, onPress }) {
    const status = formatShipmentStatus(shipment.status)
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Shipment ${shipment.id}, status ${status}`}
            accessibilityHint="Abre o detalhe operacional e a readiness atual"
            onPress={onPress}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <View style={styles.heading}>
                <Text style={styles.identifier} numberOfLines={1}>{shipment.id}</Text>
                <Text style={styles.status}>{status}</Text>
            </View>
            <Text style={styles.secondary}>Destino: {shipment.recipientId}</Text>
            <Text style={styles.secondary}>
                Criado em: {formatDistributionTimestamp(shipment.createdAt)}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 112,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    pressed: { opacity: 0.72 },
    heading: { flexDirection: 'row', justifyContent: 'space-between' },
    identifier: { flex: 1, marginRight: 12, color: '#092955', fontWeight: '700' },
    status: { color: '#334155', fontSize: 13, fontWeight: '600' },
    secondary: { marginTop: 7, color: '#475569', fontSize: 13 },
})
