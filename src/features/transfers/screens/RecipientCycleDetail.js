import React from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import PerformedTransferListItem from '../components/PerformedTransferListItem'
import {
    TransferField,
    TransferSection,
    TransferState,
} from '../components/TransferElements'
import {
    isAmbiguousRecipientCycleError,
    isStaleRecipientCycleError,
    useCloseRecipientCycleMutation,
} from '../hooks/useRecipientCycleMutations'
import {
    useRecipientCycleDetailQuery,
    useTransfersQuery,
} from '../hooks/useTransferQueries'
import { createCloseRecipientCycleIntent } from '../recipientCycleIntents'
import { TRANSFER_ROUTES } from '../routes'
import { TRANSFER_PERMISSIONS, hasTransferPermission } from '../transferPermissions'
import {
    formatTransferDate,
    formatTransferTimestamp,
    getRecipientCycleStatusLabel,
    getTransferCommandErrorMessage,
    getTransferErrorMessage,
} from '../transferPresentation'

export default function RecipientCycleDetail({ navigation, route }) {
    const recipientCycleId = route.params?.recipientCycleId
    const { activeOrganizationId } = useOrganization()
    const [closedOn, setClosedOn] = React.useState('')
    const [reason, setReason] = React.useState('')
    const [intent, setIntent] = React.useState(null)
    const [sent, setSent] = React.useState(false)
    const [localError, setLocalError] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.READ)
    const canWrite = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.WRITE)
    const cycleQuery = useRecipientCycleDetailQuery({
        organizationId: activeOrganizationId,
        recipientCycleId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const transfersQuery = useTransfersQuery({
        organizationId: activeOrganizationId,
        recipientCycleId,
        enabled: contextQuery.isSuccess && canRead && cycleQuery.isSuccess,
    })
    const closeMutation = useCloseRecipientCycleMutation({
        organizationId: activeOrganizationId,
        recipientCycleId,
    })

    React.useEffect(() => {
        setClosedOn('')
        setReason('')
        setIntent(null)
        setSent(false)
        setLocalError(null)
    }, [activeOrganizationId, recipientCycleId])

    if (!recipientCycleId) {
        return <SafeAreaView style={styles.screen}><TransferState message="Ciclo de receptora não identificado." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && cycleQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando ciclo de receptora" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><TransferState message="Você não tem permissão para consultar este ciclo." /></SafeAreaView>
    }
    const mainError = getTransferErrorMessage(contextQuery.error ?? cycleQuery.error)
    if (mainError || !cycleQuery.data) {
        return <SafeAreaView style={styles.screen}><TransferState message={mainError ?? 'Não foi possível carregar o ciclo.'} onRetry={() => void cycleQuery.refetch()} /></SafeAreaView>
    }

    const cycle = cycleQuery.data
    const transfers = transfersQuery.data?.pages.flatMap(page => page.items) ?? []
    const submitClose = () => {
        setLocalError(null)
        let prepared = intent
        try {
            if (!prepared) {
                prepared = createCloseRecipientCycleIntent({
                    recipientCycleId,
                    expectedVersion: cycle.version,
                    closedOn,
                    reason,
                })
                if (closedOn < cycle.openedOn) {
                    throw new TypeError('close precedes open')
                }
                setIntent(prepared)
            }
        } catch (error) {
            setLocalError('Informe data válida, posterior à abertura, e motivo do fechamento.')
            return
        }
        setSent(true)
        closeMutation.mutate(prepared)
    }
    const reviewCurrentState = async () => {
        await cycleQuery.refetch()
        setIntent(null)
        setSent(false)
        closeMutation.reset()
    }
    const editAsNewIntention = () => {
        setIntent(null)
        setSent(false)
        closeMutation.reset()
    }
    const closeError = localError ?? getTransferCommandErrorMessage(
        closeMutation.error
    )
    const stale = isStaleRecipientCycleError(closeMutation.error)
    const ambiguous = isAmbiguousRecipientCycleError(closeMutation.error)

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text accessibilityRole="header" style={styles.title}>{cycle.recipientName?.trim() || 'Animal sem nome'}</Text>
                <Text style={styles.subtitle}>{getRecipientCycleStatusLabel(cycle.status)}</Text>

                <TransferSection title="Ciclo">
                    <TransferField label="Animal" value={cycle.recipientName?.trim() || 'Animal sem nome'} />
                    <TransferField label="Aberto em" value={formatTransferDate(cycle.openedOn)} />
                    {cycle.closedOn ? <TransferField label="Fechado em" value={formatTransferDate(cycle.closedOn)} /> : null}
                    {cycle.notes ? <TransferField label="Observações" value={cycle.notes} /> : null}
                    {cycle.closureReason ? <TransferField label="Motivo do fechamento" value={cycle.closureReason} /> : null}
                    <TransferField label="Protocolo" value={cycle.protocolVersionId ?? 'Não informado'} />
                    <TransferField label="Versão" value={String(cycle.version)} />
                </TransferSection>

                <TransferSection title="Proveniência">
                    <TransferField label="Origem" value={cycle.provenance.originType} />
                    <TransferField label="Registrado em" value={formatTransferTimestamp(cycle.provenance.recordedAt)} />
                </TransferSection>

                {cycle.status === 'OPEN' && canWrite ? (
                    <TransferSection title="Fechar ciclo">
                        <Text style={styles.help}>O fechamento é definitivo no contrato público atual.</Text>
                        <TextInput accessibilityLabel="Data de fechamento do ciclo" accessibilityHint="Informe no formato AAAA-MM-DD" editable={!sent} maxLength={10} onChangeText={setClosedOn} placeholder="AAAA-MM-DD" placeholderTextColor="#64748B" style={styles.input} value={closedOn} />
                        <TextInput accessibilityLabel="Motivo do fechamento" editable={!sent} maxLength={500} multiline onChangeText={setReason} placeholder="Motivo" placeholderTextColor="#64748B" style={[styles.input, styles.reason]} value={reason} />
                        {closeError ? <Text accessibilityRole="alert" style={styles.error}>{closeError}</Text> : null}
                        {stale ? (
                            <Pressable accessibilityRole="button" accessibilityLabel="Recarregar ciclo e revisar fechamento" onPress={() => void reviewCurrentState()} style={styles.secondaryButton}>
                                <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                            </Pressable>
                        ) : sent && closeMutation.isError && !ambiguous ? (
                            <Pressable accessibilityRole="button" accessibilityLabel="Editar fechamento como nova intenção" onPress={editAsNewIntention} style={styles.secondaryButton}>
                                <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                            </Pressable>
                        ) : null}
                        <Pressable accessibilityRole="button" accessibilityLabel={ambiguous ? 'Reenviar a mesma intenção de fechamento' : 'Fechar ciclo de receptora'} accessibilityState={{ busy: closeMutation.isPending, disabled: closeMutation.isPending || stale }} disabled={closeMutation.isPending || stale} onPress={submitClose} style={[styles.primaryButton, (closeMutation.isPending || stale) && styles.disabled]}>
                            <Text style={styles.primaryText}>{closeMutation.isPending ? 'Fechando...' : ambiguous ? 'Tentar mesma intenção' : 'Fechar ciclo'}</Text>
                        </Pressable>
                    </TransferSection>
                ) : null}

                <TransferSection title="Transferências realizadas">
                    {transfersQuery.isPending ? <Text style={styles.help}>Carregando transferências...</Text> : transfersQuery.error && transfers.length === 0 ? (
                        <TransferState message={getTransferErrorMessage(transfersQuery.error)} onRetry={() => void transfersQuery.refetch()} />
                    ) : transfers.length === 0 ? <Text style={styles.help}>Nenhuma transferência realizada neste ciclo.</Text> : transfers.map(transfer => (
                        <PerformedTransferListItem key={transfer.id} transfer={transfer} onPress={() => navigation.navigate(TRANSFER_ROUTES.TRANSFER_DETAIL, { transferId: transfer.id })} />
                    ))}
                    {transfersQuery.hasNextPage ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Carregar mais transferências" accessibilityState={{ busy: transfersQuery.isFetchingNextPage }} onPress={() => void transfersQuery.fetchNextPage()} style={styles.secondaryButton}>
                            <Text style={styles.secondaryText}>{transfersQuery.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}</Text>
                        </Pressable>
                    ) : null}
                </TransferSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#166534', fontSize: 14, fontWeight: '700' },
    help: { color: '#475569', fontSize: 14, lineHeight: 20 },
    input: { minHeight: 48, marginTop: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 16 },
    reason: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
    error: { marginTop: 10, color: '#991B1B', fontSize: 14, lineHeight: 20 },
    primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: 24, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    secondaryButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    secondaryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    disabled: { opacity: 0.5 },
})
