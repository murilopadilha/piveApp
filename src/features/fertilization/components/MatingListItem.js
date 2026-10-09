import { Pressable, StyleSheet, Text, View } from 'react-native'

import {
    formatMatingTimestamp,
    getMatingStatusLabel,
} from '../matingPresentation'

export default function MatingListItem({ mating, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Alocação de ${mating.allocatedOocytes} oócitos`}
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <View style={styles.heading}>
                <Text style={styles.title}>
                    {mating.allocatedOocytes} oócitos · {mating.method}
                </Text>
                <Text style={styles.status}>{getMatingStatusLabel(mating.status)}</Text>
            </View>
            <Text style={styles.detail}>
                {formatMatingTimestamp(mating.fertilizedAt)}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        minHeight: 94,
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    heading: { marginBottom: 6 },
    title: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
    status: { color: '#166534', fontSize: 13, fontWeight: '600', marginTop: 3 },
    detail: { color: '#475569', fontSize: 14, marginTop: 3 },
    pressed: { opacity: 0.72 },
})
