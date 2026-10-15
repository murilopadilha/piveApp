import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    formatDocumentSize,
    formatDocumentTimestamp,
} from '../documentPresentation'
import { DocumentField } from './DocumentElements'

export default function DocumentVersionItem({
    version,
    current = false,
    onOpenShare,
    busy = false,
    disabled = false,
}) {
    return (
        <View
            accessibilityLabel={`Versão ${version.versionNumber}${current ? ', versão atual' : ''}`}
            style={[styles.container, current && styles.current]}
        >
            <View style={styles.heading}>
                <Text style={styles.title}>Versão {version.versionNumber}</Text>
                {current ? (
                    <Text accessibilityRole="text" style={styles.badge}>
                        Atual
                    </Text>
                ) : null}
            </View>
            <DocumentField label="Arquivo" value={version.originalFileName} />
            <DocumentField label="MIME" value={version.mimeType} />
            <DocumentField
                label="Tamanho"
                value={`${formatDocumentSize(version.sizeBytes)} (${version.sizeBytes} bytes)`}
            />
            <DocumentField
                label="SHA-256"
                selectable
                value={version.checksum}
            />
            <DocumentField
                label="Enviado em"
                value={formatDocumentTimestamp(version.uploadedAt)}
            />
            {onOpenShare ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ou compartilhar versão ${version.versionNumber}`}
                    accessibilityHint="Baixa temporariamente esta versão e abre as opções do sistema"
                    accessibilityState={{ busy, disabled: disabled || busy }}
                    disabled={disabled || busy}
                    onPress={onOpenShare}
                    style={({ pressed }) => [
                        styles.action,
                        (disabled || busy) && styles.actionDisabled,
                        pressed && !disabled && !busy && styles.actionPressed,
                    ]}
                >
                    {busy ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.actionText}>Abrir/Compartilhar</Text>
                    )}
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    current: { borderColor: '#166534', backgroundColor: '#F0FDF4' },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#DCFCE7',
        color: '#166534',
        fontSize: 12,
        fontWeight: '700',
    },
    action: {
        minHeight: 46,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 23,
        backgroundColor: '#092955',
    },
    actionDisabled: { opacity: 0.55 },
    actionPressed: { opacity: 0.82 },
    actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
})
