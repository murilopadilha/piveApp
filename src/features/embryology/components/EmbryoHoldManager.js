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
    createOpenEmbryoHoldIntent,
    createReleaseEmbryoHoldIntent,
    markEmbryoHoldIntentSent,
} from '../embryoIntents'
import {
    isAmbiguousEmbryoCommandError,
    isEmbryoHoldConflict,
    useOpenEmbryoHoldMutation,
    useReleaseEmbryoHoldMutation,
} from '../hooks/useEmbryoMutations'
import {
    formatEmbryoTimestamp,
    getEmbryoCommandErrorMessage,
} from '../embryoPresentation'

const isSameIntentRetry = (intent, error) => Boolean(intent) && (
    isAmbiguousEmbryoCommandError(error) ||
    error?.code === 'COMMAND_IN_PROGRESS'
)

const HoldMetadata = ({ hold }) => (
    <>
        <Text style={styles.meta}>
            Aberto em {formatEmbryoTimestamp(hold.openedAt)} por {hold.openedBy ?? 'ator não informado'}
        </Text>
        {hold.releasedAt ? (
            <>
                <Text style={styles.releasedState}>
                    Liberado em {formatEmbryoTimestamp(hold.releasedAt)} por {hold.releasedBy ?? 'ator não informado'}
                </Text>
                <Text style={styles.meta}>
                    Motivo da liberação: {hold.releaseReason ?? 'Não informado'}
                </Text>
            </>
        ) : (
            <Text style={styles.activeState}>Ativo</Text>
        )}
    </>
)

function ReleaseHoldModal({
    embryoId,
    hold,
    onClose,
    onRefetch,
    organizationId,
}) {
    const [reason, setReason] = React.useState('')
    const [validationMessage, setValidationMessage] = React.useState(null)
    const [intent, setIntent] = React.useState(null)
    const mutation = useReleaseEmbryoHoldMutation({ organizationId, embryoId })
    const ambiguous = isSameIntentRetry(intent, mutation.error)
    const conflict = isEmbryoHoldConflict(mutation.error)
    const locked = Boolean(intent)

    React.useEffect(() => {
        setReason('')
        setValidationMessage(null)
        setIntent(null)
        mutation.reset()
    }, [embryoId, hold.id, mutation.reset, organizationId])

    const submit = () => {
        let nextIntent = intent

        if (!nextIntent) {
            try {
                nextIntent = markEmbryoHoldIntentSent(
                    createReleaseEmbryoHoldIntent({
                        embryoId,
                        holdId: hold.id,
                        reason,
                    })
                )
                setIntent(nextIntent)
            } catch (error) {
                setValidationMessage('Informe um motivo com até 500 caracteres.')
                return
            }
        }

        setValidationMessage(null)
        mutation.mutate(nextIntent, { onSuccess: onClose })
    }

    const reconcile = async () => {
        await onRefetch()
        setIntent(null)
        mutation.reset()
    }

    return (
        <Modal
            animationType="slide"
            onRequestClose={locked ? undefined : onClose}
            presentationStyle="pageSheet"
            visible
        >
            <SafeAreaView style={styles.modalScreen}>
                <View style={styles.modalHeader}>
                    <Text accessibilityRole="header" style={styles.modalTitle}>
                        Liberar hold
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Fechar liberação de hold"
                        accessibilityState={{ disabled: locked || mutation.isPending }}
                        disabled={locked || mutation.isPending}
                        onPress={onClose}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkText}>Fechar</Text>
                    </Pressable>
                </View>
                <Text style={styles.notice}>
                    O hold {hold.type} continuará visível no histórico após a liberação.
                </Text>
                <Text style={styles.label}>Motivo da liberação</Text>
                <TextInput
                    accessibilityLabel="Motivo da liberação do hold"
                    accessibilityHint="Explique por que o hold pode ser liberado"
                    accessibilityState={{ disabled: locked }}
                    editable={!locked}
                    maxLength={500}
                    multiline
                    onChangeText={setReason}
                    style={[styles.input, styles.reasonInput]}
                    value={reason}
                />
                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {validationMessage}
                    </Text>
                ) : null}
                {mutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getEmbryoCommandErrorMessage(mutation.error)}
                    </Text>
                ) : null}
                {conflict ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recarregar embrião e revisar liberação"
                        onPress={() => void reconcile()}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                    </Pressable>
                ) : intent && mutation.isError && !ambiguous ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Editar liberação como nova intenção"
                        onPress={() => {
                            setIntent(null)
                            mutation.reset()
                        }}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ambiguous
                        ? 'Reenviar a mesma intenção de liberação'
                        : 'Confirmar liberação do hold'}
                    accessibilityHint="Registra a liberação sem apagar o hold do histórico"
                    accessibilityState={{
                        busy: mutation.isPending,
                        disabled: mutation.isPending || (locked && !ambiguous),
                    }}
                    disabled={mutation.isPending || (locked && !ambiguous)}
                    onPress={submit}
                    style={styles.dangerButton}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.dangerText}>
                            {ambiguous ? 'Tentar mesma intenção' : 'Confirmar liberação'}
                        </Text>
                    )}
                </Pressable>
            </SafeAreaView>
        </Modal>
    )
}

export default function EmbryoHoldManager({
    canWrite,
    embryo,
    onRefetch,
    organizationId,
}) {
    const [showOpenForm, setShowOpenForm] = React.useState(false)
    const [type, setType] = React.useState('')
    const [reason, setReason] = React.useState('')
    const [validationMessage, setValidationMessage] = React.useState(null)
    const [intent, setIntent] = React.useState(null)
    const [releaseHoldId, setReleaseHoldId] = React.useState(null)
    const mutation = useOpenEmbryoHoldMutation({
        organizationId,
        embryoId: embryo.id,
    })
    const releaseHold = embryo.holds.find(hold => hold.id === releaseHoldId) ?? null
    const ambiguous = isSameIntentRetry(intent, mutation.error)
    const conflict = isEmbryoHoldConflict(mutation.error)
    const locked = Boolean(intent)

    React.useEffect(() => {
        setShowOpenForm(false)
        setType('')
        setReason('')
        setValidationMessage(null)
        setIntent(null)
        setReleaseHoldId(null)
        mutation.reset()
    }, [embryo.id, mutation.reset, organizationId])

    const submitOpen = () => {
        let nextIntent = intent

        if (!nextIntent) {
            try {
                nextIntent = markEmbryoHoldIntentSent(createOpenEmbryoHoldIntent({
                    embryoId: embryo.id,
                    type,
                    reason,
                }))
                setIntent(nextIntent)
            } catch (error) {
                setValidationMessage(
                    'Informe um tipo em código operacional e um motivo com até 500 caracteres.'
                )
                return
            }
        }

        setValidationMessage(null)
        mutation.mutate(nextIntent, {
            onSuccess: () => {
                setShowOpenForm(false)
                setType('')
                setReason('')
                setIntent(null)
            },
        })
    }

    const reconcile = async () => {
        await onRefetch()
        setIntent(null)
        mutation.reset()
    }

    return (
        <View>
            {embryo.holds.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum hold registrado.</Text>
            ) : embryo.holds.map(hold => (
                <View
                    accessibilityLabel={`Hold ${hold.type}, ${hold.releasedAt ? 'liberado' : 'ativo'}`}
                    key={hold.id}
                    style={styles.holdCard}
                >
                    <Text style={styles.holdTitle}>{hold.type}</Text>
                    <Text style={styles.holdReason}>{hold.reason}</Text>
                    <HoldMetadata hold={hold} />
                    {canWrite && !hold.releasedAt ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Liberar hold ${hold.type}`}
                            accessibilityHint="Solicita motivo e confirmação antes da liberação"
                            onPress={() => setReleaseHoldId(hold.id)}
                            style={styles.releaseButton}
                        >
                            <Text style={styles.releaseText}>Liberar hold</Text>
                        </Pressable>
                    ) : null}
                </View>
            ))}

            {canWrite && !showOpenForm ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Abrir novo hold"
                    accessibilityHint="Registra um bloqueio operacional para este embrião"
                    onPress={() => setShowOpenForm(true)}
                    style={styles.primaryButton}
                >
                    <Text style={styles.primaryText}>Abrir hold</Text>
                </Pressable>
            ) : null}

            {canWrite && showOpenForm ? (
                <View style={styles.form}>
                    <Text style={styles.label}>Código do tipo</Text>
                    <TextInput
                        accessibilityLabel="Código do tipo do hold"
                        accessibilityHint="Use o código operacional adotado pela organização"
                        accessibilityState={{ disabled: locked }}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        editable={!locked}
                        maxLength={48}
                        onChangeText={value => setType(value.toUpperCase())}
                        placeholder="CÓDIGO_OPERACIONAL"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        value={type}
                    />
                    <Text style={styles.helper}>
                        Sem catálogo predefinido; informe o código usado pela Organization.
                    </Text>
                    <Text style={styles.label}>Motivo</Text>
                    <TextInput
                        accessibilityLabel="Motivo do hold"
                        accessibilityState={{ disabled: locked }}
                        editable={!locked}
                        maxLength={500}
                        multiline
                        onChangeText={setReason}
                        style={[styles.input, styles.reasonInput]}
                        value={reason}
                    />
                    {validationMessage ? (
                        <Text accessibilityRole="alert" style={styles.error}>
                            {validationMessage}
                        </Text>
                    ) : null}
                    {mutation.error ? (
                        <Text accessibilityRole="alert" style={styles.error}>
                            {getEmbryoCommandErrorMessage(mutation.error)}
                        </Text>
                    ) : null}
                    {conflict ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Recarregar embrião e revisar hold"
                            onPress={() => void reconcile()}
                            style={styles.secondaryButton}
                        >
                            <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                        </Pressable>
                    ) : intent && mutation.isError && !ambiguous ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Editar hold como nova intenção"
                            onPress={() => {
                                setIntent(null)
                                mutation.reset()
                            }}
                            style={styles.secondaryButton}
                        >
                            <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                        </Pressable>
                    ) : null}
                    <View style={styles.formActions}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Cancelar abertura de hold"
                            accessibilityState={{ disabled: locked || mutation.isPending }}
                            disabled={locked || mutation.isPending}
                            onPress={() => {
                                setShowOpenForm(false)
                                setType('')
                                setReason('')
                                setValidationMessage(null)
                            }}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={ambiguous
                                ? 'Reenviar a mesma intenção de hold'
                                : 'Confirmar abertura de hold'}
                            accessibilityState={{
                                busy: mutation.isPending,
                                disabled: mutation.isPending || (locked && !ambiguous),
                            }}
                            disabled={mutation.isPending || (locked && !ambiguous)}
                            onPress={submitOpen}
                            style={styles.primaryButton}
                        >
                            {mutation.isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.primaryText}>
                                    {ambiguous ? 'Tentar mesma intenção' : 'Confirmar hold'}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            ) : null}

            {releaseHold ? (
                <ReleaseHoldModal
                    embryoId={embryo.id}
                    hold={releaseHold}
                    onClose={() => setReleaseHoldId(null)}
                    onRefetch={onRefetch}
                    organizationId={organizationId}
                />
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    emptyText: { color: '#475569', fontSize: 14, lineHeight: 20 },
    holdCard: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    holdTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
    holdReason: { color: '#334155', fontSize: 14, lineHeight: 20, marginTop: 4 },
    meta: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 4 },
    activeState: { color: '#9A3412', fontSize: 13, fontWeight: '700', marginTop: 5 },
    releasedState: { color: '#166534', fontSize: 13, fontWeight: '700', marginTop: 5 },
    releaseButton: { minHeight: 44, justifyContent: 'center', marginTop: 8 },
    releaseText: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
    form: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    label: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 12 },
    helper: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 5 },
    input: {
        minHeight: 48,
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 15,
    },
    reasonInput: { minHeight: 96, textAlignVertical: 'top' },
    error: { color: '#B91C1C', fontSize: 14, lineHeight: 20, marginTop: 12 },
    notice: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 16 },
    formActions: { marginTop: 14 },
    primaryButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingHorizontal: 18,
        borderRadius: 24,
        backgroundColor: '#092955',
    },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    secondaryButton: {
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#092955',
        borderRadius: 23,
    },
    secondaryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: '#475569', fontSize: 14, fontWeight: '700' },
    dangerButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        borderRadius: 25,
        backgroundColor: '#B91C1C',
    },
    dangerText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    modalScreen: { flex: 1, padding: 20, backgroundColor: '#F1F2F4' },
    modalHeader: { flexDirection: 'row', alignItems: 'center' },
    modalTitle: { flex: 1, color: '#092955', fontSize: 24, fontWeight: '700' },
    linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
    linkText: { color: '#092955', fontSize: 15, fontWeight: '700' },
})
