import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

export function OpuDetailField({ label, value }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    )
}

export function OpuDetailSection({ title, children }) {
    return (
        <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
                {title}
            </Text>
            {children}
        </View>
    )
}

export function OpuSectionLoading({ label }) {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel={label}
            style={styles.state}
        >
            <ActivityIndicator size="small" color="#092955" />
            <Text style={styles.stateText}>{label}</Text>
        </View>
    )
}

export function OpuSectionError({ message, onRetry }) {
    return (
        <View accessibilityRole="alert" style={styles.state}>
            <Text style={styles.stateText}>{message}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente"
                onPress={onRetry}
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                ]}
            >
                <Text style={styles.buttonText}>Tentar novamente</Text>
            </Pressable>
        </View>
    )
}

export const opuDetailElementStyles = styles

const styles = StyleSheet.create({
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
    field: { marginBottom: 12 },
    label: { color: '#64748B', fontSize: 13, marginBottom: 3 },
    value: { color: '#0F172A', fontSize: 16, lineHeight: 22 },
    state: { alignItems: 'center', paddingVertical: 12 },
    stateText: { color: '#475569', fontSize: 14, textAlign: 'center' },
    button: {
        minHeight: 44,
        justifyContent: 'center',
        marginTop: 12,
        paddingHorizontal: 18,
        borderRadius: 22,
        backgroundColor: '#092955',
    },
    pressed: { opacity: 0.72 },
    buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
})
