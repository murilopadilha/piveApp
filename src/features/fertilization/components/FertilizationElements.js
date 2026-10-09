import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

export function FertilizationField({ label, value }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    )
}

export function FertilizationSection({ title, children }) {
    return (
        <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
                {title}
            </Text>
            {children}
        </View>
    )
}

export function FertilizationState({ message, onRetry, loading = false }) {
    return (
        <View
            accessibilityRole={loading ? 'progressbar' : 'alert'}
            accessibilityLabel={message}
            style={styles.state}
        >
            {loading ? <ActivityIndicator color="#092955" size="large" /> : null}
            <Text style={styles.stateText}>{message}</Text>
            {onRetry ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tentar novamente"
                    onPress={onRetry}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    field: { marginBottom: 12 },
    label: { color: '#64748B', fontSize: 13, marginBottom: 3 },
    value: { color: '#0F172A', fontSize: 16, lineHeight: 22 },
    section: {
        marginHorizontal: 20,
        marginBottom: 14,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        color: '#092955',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    state: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    stateText: {
        color: '#475569',
        fontSize: 15,
        lineHeight: 22,
        marginTop: 12,
        textAlign: 'center',
    },
    button: {
        minHeight: 44,
        justifyContent: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
        borderRadius: 22,
        backgroundColor: '#092955',
    },
    buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})
