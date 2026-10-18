import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    formatOpuTimestamp,
    getOpuStatusLabel,
} from '../opuPresentation'

export default function OpuSessionListItem({ session, onPress }) {
    const performedAt = formatOpuTimestamp(session.performedAt)
    const status = getOpuStatusLabel(session.status)

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`OPU em ${performedAt}, ${status}`}
            accessibilityHint="Abre os detalhes da OPU"
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.header}>
                <Text style={styles.title}>OPU</Text>
                <Text style={styles.status}>{status}</Text>
            </View>
            <Text style={styles.date}>{performedAt}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        minHeight: 92,
        marginHorizontal: 20,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    pressed: { opacity: 0.72 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
    status: { color: '#092955', fontSize: 14, fontWeight: '700' },
    date: { color: '#475569', fontSize: 15, marginTop: 10 },
})
