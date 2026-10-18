import { Pressable, StyleSheet, Text, View } from 'react-native'

import { formatDocumentTimestamp } from '../documentPresentation'

export default function DocumentListItem({ document, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Documento ${document.typeCode}, status ${document.status}`}
            accessibilityHint="Abre os detalhes e o histórico imutável de versões"
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.heading}>
                <Text style={styles.typeCode}>{document.typeCode}</Text>
                <Text style={styles.status}>{document.status}</Text>
            </View>
            <Text style={styles.secondary}>
                Criado em: {formatDocumentTimestamp(document.createdAt)}
            </Text>
            <Text style={styles.secondary}>
                Versão do registro: {document.version}
            </Text>
            <Text style={styles.secondary} numberOfLines={1}>
                Versão atual: {document.currentVersionId ?? 'Nenhuma'}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 112,
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
    typeCode: {
        flex: 1,
        marginRight: 12,
        color: '#092955',
        fontSize: 17,
        fontWeight: '700',
    },
    status: { color: '#334155', fontSize: 13, fontWeight: '600' },
    secondary: { marginTop: 5, color: '#475569', fontSize: 13 },
})
