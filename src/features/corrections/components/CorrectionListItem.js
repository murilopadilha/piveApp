import { Pressable, StyleSheet, Text, View } from 'react-native'

import {
    formatCorrectionStatus,
    formatCorrectionTimestamp,
} from '../correctionPresentation'

export default function CorrectionListItem({ correction, onPress }) {
    const status = formatCorrectionStatus(correction.status)

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Solicitação ${correction.id}, tipo ${correction.subjectType}, status ${status}`}
            accessibilityHint="Abre o conteúdo histórico e o impacto atual da solicitação"
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.heading}>
                <Text style={styles.subjectType}>{correction.subjectType}</Text>
                <Text style={styles.status}>{status}</Text>
            </View>
            <Text style={styles.reason} numberOfLines={2}>
                {correction.reason}
            </Text>
            <Text style={styles.secondary} numberOfLines={1}>
                Subject: {correction.subjectId}
            </Text>
            <Text style={styles.secondary}>
                Registrada em: {formatCorrectionTimestamp(correction.requestedAt)}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 132,
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
    heading: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    subjectType: {
        flex: 1,
        marginRight: 12,
        color: '#092955',
        fontSize: 16,
        fontWeight: '700',
    },
    status: { color: '#334155', fontSize: 13, fontWeight: '600' },
    reason: { marginTop: 8, color: '#0F172A', fontSize: 14, lineHeight: 20 },
    secondary: { marginTop: 5, color: '#475569', fontSize: 13 },
})
