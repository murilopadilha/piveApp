import { Pressable, StyleSheet, Text } from 'react-native'

import {
    formatTransferTimestamp,
    getTransferOriginLabel,
} from '../transferPresentation'

export default function PerformedTransferListItem({ transfer, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Transferência ${getTransferOriginLabel(transfer.origin)} realizada em ${formatTransferTimestamp(transfer.performedAt)}`}
            accessibilityHint="Abre o detalhe da transferência realizada"
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <Text style={styles.title}>{getTransferOriginLabel(transfer.origin)}</Text>
            <Text style={styles.text}>{formatTransferTimestamp(transfer.performedAt)}</Text>
            <Text style={styles.text}>Embrião: {transfer.embryoId}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: { minHeight: 88, marginBottom: 8, padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC' },
    pressed: { opacity: 0.72 },
    title: { color: '#092955', fontSize: 15, fontWeight: '700' },
    text: { marginTop: 4, color: '#475569', fontSize: 13 },
})
