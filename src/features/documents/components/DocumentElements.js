import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

export function DocumentState({ message, onRetry, loading = false }) {
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
                    accessibilityHint="Refaz a consulta de documentos"
                    onPress={onRetry}
                    style={styles.retry}
                >
                    <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

export function DocumentSection({ title, children }) {
    return (
        <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
                {title}
            </Text>
            {children}
        </View>
    )
}

export function DocumentField({ label, value, selectable = false }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Text selectable={selectable} style={styles.value}>
                {value ?? 'Não informado'}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    state: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    stateText: {
        marginTop: 10,
        color: '#475569',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    retry: {
        minHeight: 44,
        justifyContent: 'center',
        marginTop: 10,
    },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    section: {
        marginHorizontal: 16,
        marginBottom: 14,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        marginBottom: 10,
        color: '#092955',
        fontSize: 18,
        fontWeight: '700',
    },
    field: { marginBottom: 10 },
    label: { color: '#64748B', fontSize: 12, fontWeight: '600' },
    value: {
        marginTop: 2,
        color: '#0F172A',
        fontSize: 15,
        lineHeight: 21,
    },
})
