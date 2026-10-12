import { Pressable, StyleSheet, Text, View } from 'react-native'

import {
    formatTransferDate,
    getRecipientCycleStatusLabel,
} from '../transferPresentation'

export default function RecipientCycleListItem({ cycle, onPress }) {
    const recipient = cycle.recipientName?.trim() || 'Animal sem nome'

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${recipient}, ciclo ${getRecipientCycleStatusLabel(cycle.status)}`}
            accessibilityHint="Abre o detalhe do ciclo da receptora"
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <View style={styles.row}>
                <Text style={styles.title}>{recipient}</Text>
                <Text style={styles.status}>{getRecipientCycleStatusLabel(cycle.status)}</Text>
            </View>
            <Text style={styles.secondary}>Aberto em {formatTransferDate(cycle.openedOn)}</Text>
            {cycle.closedOn ? (
                <Text style={styles.secondary}>Fechado em {formatTransferDate(cycle.closedOn)}</Text>
            ) : null}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        minHeight: 92,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    pressed: { opacity: 0.72 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    title: { flex: 1, color: '#092955', fontSize: 17, fontWeight: '700' },
    status: { color: '#334155', fontSize: 13, fontWeight: '700' },
    secondary: { marginTop: 5, color: '#475569', fontSize: 14 },
})
