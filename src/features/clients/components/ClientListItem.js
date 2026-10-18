import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    getClientStatusLabel,
    getClientTypeLabel,
} from '../clientPresentation'

export default function ClientListItem({ client, canOpen, onOpen }) {
    const location = client.address
        ? [client.address.municipality, client.address.state]
            .filter(Boolean)
            .join(' — ')
        : null

    return (
        <Pressable
            accessibilityRole={canOpen ? 'button' : 'text'}
            accessibilityLabel={`Cliente ${client.displayName}`}
            accessibilityHint={canOpen ? 'Abre os detalhes do cliente' : undefined}
            accessibilityState={{ disabled: !canOpen }}
            disabled={!canOpen}
            onPress={onOpen}
            style={({ pressed }) => [
                styles.container,
                pressed && canOpen && styles.pressed,
            ]}
        >
            <View style={styles.headingRow}>
                <Text style={styles.name}>{client.displayName}</Text>
                <Text style={styles.status}>
                    {getClientStatusLabel(client.status)}
                </Text>
            </View>
            {client.legalName ? (
                <Text style={styles.secondary}>{client.legalName}</Text>
            ) : null}
            <Text style={styles.secondary}>
                {getClientTypeLabel(client.type)}
            </Text>
            {location ? <Text style={styles.secondary}>{location}</Text> : null}
            {!canOpen ? (
                <Text style={styles.permissionText}>
                    Detalhes não disponíveis para este acesso.
                </Text>
            ) : null}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 96,
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
    pressed: {
        opacity: 0.72,
    },
    headingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    name: {
        flex: 1,
        color: '#092955',
        fontSize: 17,
        fontWeight: '700',
        marginRight: 12,
    },
    status: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
    },
    secondary: {
        color: '#475569',
        fontSize: 14,
        marginTop: 4,
    },
    permissionText: {
        color: '#7C2D12',
        fontSize: 13,
        marginTop: 8,
    },
})
