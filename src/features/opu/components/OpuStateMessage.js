import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

export default function OpuStateMessage({ message, onRetry }) {
    return (
        <View
            accessibilityRole="alert"
            accessibilityLabel={message}
            style={styles.container}
        >
            <Text style={styles.message}>{message}</Text>
            {onRetry ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tentar novamente"
                    onPress={onRetry}
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 32,
    },
    message: {
        color: '#334155',
        fontSize: 16,
        lineHeight: 23,
        textAlign: 'center',
    },
    button: {
        minHeight: 48,
        minWidth: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: '#092955',
    },
    buttonPressed: { opacity: 0.75 },
    buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})
