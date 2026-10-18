import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    formatEmbryoTimestamp,
    getAvailabilityLabel,
    getPreservationLabel,
} from '../embryoPresentation'

export default function EmbryoListItem({ embryo, onOpen }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Embrião ${embryo.humanCode}, ${getAvailabilityLabel(embryo.availability)}`}
            accessibilityHint="Abre os detalhes e o histórico do embrião"
            onPress={onOpen}
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.heading}>
                <Text style={styles.code}>{embryo.humanCode}</Text>
                <Text style={styles.availability}>
                    {getAvailabilityLabel(embryo.availability)}
                </Text>
            </View>
            <Text style={styles.secondary}>
                Preservação: {getPreservationLabel(embryo.preservation)}
            </Text>
            <Text style={styles.secondary}>
                Identificado em {formatEmbryoTimestamp(embryo.identifiedAt)}
            </Text>
            {embryo.holds.some(hold => !hold.releasedAt) ? (
                <Text style={styles.hold}>Possui hold ativo</Text>
            ) : null}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 104,
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
    code: {
        flex: 1,
        marginRight: 12,
        color: '#092955',
        fontSize: 17,
        fontWeight: '700',
    },
    availability: { color: '#334155', fontSize: 13, fontWeight: '600' },
    secondary: { color: '#475569', fontSize: 14, marginTop: 5 },
    hold: { color: '#9A3412', fontSize: 13, fontWeight: '700', marginTop: 7 },
})
