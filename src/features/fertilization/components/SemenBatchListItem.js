import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function SemenBatchListItem({ batch, onPress, disabled = false }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Lote de sêmen ${batch.batchCode}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                disabled && styles.disabled,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.heading}>
                <Text style={styles.code}>{batch.batchCode}</Text>
                <Text style={batch.status === 'ACTIVE'
                    ? styles.active
                    : styles.inactive}>
                    {batch.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </Text>
            </View>
            <Text style={styles.detail}>
                {batch.semenType ?? 'Tipo não informado'}
            </Text>
            <Text style={styles.detail}>
                Proveniência: {batch.provenanceCode}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        minHeight: 96,
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    code: { flex: 1, color: '#0F172A', fontSize: 17, fontWeight: '700' },
    active: { color: '#166534', fontSize: 13, fontWeight: '700' },
    inactive: { color: '#991B1B', fontSize: 13, fontWeight: '700' },
    detail: { color: '#475569', fontSize: 14, marginTop: 3 },
    pressed: { opacity: 0.72 },
    disabled: { opacity: 0.5 },
})
