import { Pressable, StyleSheet, Text } from 'react-native'

import { formatDistributionTimestamp } from '../distributionPresentation'

export default function RecallListItem({ recall, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Recall ${recall.id}, gatilho ${recall.triggerType}`}
            accessibilityHint="Abre o caso e permite calcular seu impacto atual"
            onPress={onPress}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <Text style={styles.trigger}>{recall.triggerType}</Text>
            <Text style={styles.reason} numberOfLines={2}>{recall.reason}</Text>
            <Text style={styles.secondary}>ID: {recall.id}</Text>
            <Text style={styles.secondary}>
                Aberto em: {formatDistributionTimestamp(recall.openedAt)}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 126,
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
    trigger: { color: '#092955', fontSize: 16, fontWeight: '700' },
    reason: { marginTop: 7, color: '#0F172A', fontSize: 14, lineHeight: 20 },
    secondary: { marginTop: 6, color: '#475569', fontSize: 13 },
})
