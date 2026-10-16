import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

export function DataQualityState({ message, onRetry, loading = false }) {
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
                    accessibilityHint="Refaz a consulta de qualidade de dados"
                    onPress={onRetry}
                    style={styles.retry}
                >
                    <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
            ) : null}
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
})
