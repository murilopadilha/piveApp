import React from 'react'
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
    isAmbiguousPregnancyCheckError,
    isPregnancyCheckConflict,
    useInvalidatePregnancyCheckMutation,
} from '../hooks/usePregnancyCheckMutations'
import {
    createPregnancyCheckInvalidationIntent,
    markPregnancyCheckInvalidationIntentSent,
} from '../pregnancyCheckIntents'
import { getTransferCommandErrorMessage } from '../transferPresentation'

export default function PregnancyInvalidationModal({
    entry,
    organizationId,
    transferId,
    onClose,
    onReconcile,
}) {
    const [reason, setReason] = React.useState('')
    const [validationMessage, setValidationMessage] = React.useState(null)
    const [pendingIntent, setPendingIntent] = React.useState(null)
    const mutation = useInvalidatePregnancyCheckMutation({
        organizationId,
        transferId,
    })
    const checkId = entry?.check.id ?? null

    React.useEffect(() => {
        setReason('')
        setValidationMessage(null)
        setPendingIntent(null)
        mutation.reset()
    }, [checkId, mutation.reset, organizationId])

    if (!entry) {
        return null
    }

    const conflict = isPregnancyCheckConflict(mutation.error)
    const sameIntentRetry = Boolean(pendingIntent) && (
        isAmbiguousPregnancyCheckError(mutation.error) ||
        mutation.error?.code === 'COMMAND_IN_PROGRESS'
    )
    const locked = Boolean(pendingIntent)
    const alreadyInvalidated = Boolean(entry.invalidationId)

    const submit = () => {
        let intent = pendingIntent

        if (!intent) {
            const normalizedReason = reason.trim()

            if (!normalizedReason || normalizedReason.length > 500) {
                setValidationMessage('Informe um motivo com até 500 caracteres.')
                return
            }
            intent = markPregnancyCheckInvalidationIntentSent(
                createPregnancyCheckInvalidationIntent({
                    checkId: entry.check.id,
                    reason: normalizedReason,
                })
            )
            setPendingIntent(intent)
        }

        setValidationMessage(null)
        mutation.mutate(intent, {
            onSuccess: onClose,
        })
    }

    const reconcile = async () => {
        await onReconcile()
        setPendingIntent(null)
        mutation.reset()
    }

    return (
        <Modal
            animationType="slide"
            onRequestClose={onClose}
            presentationStyle="pageSheet"
            visible
        >
            <SafeAreaView style={styles.screen}>
                <View style={styles.header}>
                    <Text accessibilityRole="header" style={styles.title}>
                        Invalidar checagem?
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Fechar invalidação"
                        accessibilityState={{ disabled: mutation.isPending }}
                        disabled={mutation.isPending}
                        onPress={onClose}
                        style={styles.close}
                    >
                        <Text style={styles.closeText}>Fechar</Text>
                    </Pressable>
                </View>
                <Text style={styles.notice}>
                    O fato original não será apagado. Ele continuará visível no histórico como invalidado.
                </Text>
                {alreadyInvalidated ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        Esta checagem já está invalidada. Recarregue o histórico antes de continuar.
                    </Text>
                ) : (
                    <>
                        <Text style={styles.label}>Motivo da invalidação</Text>
                        <TextInput
                            accessibilityLabel="Motivo da invalidação"
                            accessibilityHint="Explique por que este fato não deve compor o outcome atual"
                            editable={!locked}
                            maxLength={500}
                            multiline
                            onChangeText={setReason}
                            style={styles.input}
                            value={reason}
                        />
                    </>
                )}
                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {validationMessage}
                    </Text>
                ) : null}
                {mutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getTransferCommandErrorMessage(mutation.error)}
                    </Text>
                ) : null}
                {conflict ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recarregar histórico e revisar invalidação"
                        onPress={() => void reconcile()}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                    </Pressable>
                ) : pendingIntent && mutation.isError && !sameIntentRetry ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Editar motivo como nova intenção"
                        onPress={() => {
                            setPendingIntent(null)
                            mutation.reset()
                        }}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}
                {!alreadyInvalidated ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={sameIntentRetry
                            ? 'Tentar invalidar novamente com a mesma intenção'
                            : 'Confirmar invalidação da checagem'}
                        accessibilityHint="Mantém o fato no histórico e recalcula o outcome pelo backend"
                        accessibilityState={{
                            busy: mutation.isPending,
                            disabled: mutation.isPending || (
                                Boolean(pendingIntent) && !sameIntentRetry
                            ),
                        }}
                        disabled={mutation.isPending || (
                            Boolean(pendingIntent) && !sameIntentRetry
                        )}
                        onPress={submit}
                        style={styles.dangerButton}
                    >
                        {mutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.dangerText}>
                                {sameIntentRetry
                                    ? 'Tentar novamente a mesma intenção'
                                    : 'Confirmar invalidação'}
                            </Text>
                        )}
                    </Pressable>
                ) : null}
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 20, backgroundColor: '#F1F2F4' },
    header: { flexDirection: 'row', alignItems: 'center' },
    title: { flex: 1, color: '#092955', fontSize: 24, fontWeight: '700' },
    close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
    closeText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    notice: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 16 },
    label: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 22 },
    input: {
        minHeight: 120,
        marginTop: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 16,
        textAlignVertical: 'top',
    },
    error: { color: '#B91C1C', fontSize: 14, lineHeight: 20, marginTop: 14 },
    secondaryButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#092955',
        borderRadius: 24,
    },
    secondaryText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    dangerButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        borderRadius: 25,
        backgroundColor: '#B91C1C',
    },
    dangerText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})
