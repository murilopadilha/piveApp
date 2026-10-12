import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useProfessionalDetailQuery } from '../../opu/hooks/useOpuLookupQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    TransferField,
    TransferSection,
    TransferState,
} from '../components/TransferElements'
import {
    usePregnancyChecksQuery,
    usePregnancyOutcomeQuery,
    useRecipientCycleDetailQuery,
    useTransferDetailQuery,
} from '../hooks/useTransferQueries'
import { TRANSFER_PERMISSIONS, hasTransferPermission } from '../transferPermissions'
import {
    formatTransferTimestamp,
    getPregnancyResultLabel,
    getTransferErrorMessage,
    getTransferOriginLabel,
} from '../transferPresentation'

function PregnancyCheckCard({ entry }) {
    const { check } = entry

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{getPregnancyResultLabel(check.result)}</Text>
            <Text style={styles.cardText}>{formatTransferTimestamp(check.checkedAt)}</Text>
            <Text style={styles.cardText}>Método registrado: {check.methodCode}</Text>
            {check.observations ? <Text style={styles.cardText}>{check.observations}</Text> : null}
            {entry.invalidationId ? (
                <View accessibilityRole="text" style={styles.invalidated}>
                    <Text style={styles.invalidatedTitle}>Registro invalidado</Text>
                    <Text style={styles.cardText}>{entry.invalidationReason}</Text>
                    <Text style={styles.cardText}>{formatTransferTimestamp(entry.invalidatedAt)}</Text>
                </View>
            ) : null}
        </View>
    )
}

export default function TransferDetail({ route }) {
    const transferId = route.params?.transferId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.READ)
    const canReadMasterData = hasTransferPermission(
        contextQuery.data,
        TRANSFER_PERMISSIONS.MASTER_DATA_READ
    )
    const detailQuery = useTransferDetailQuery({
        organizationId: activeOrganizationId,
        transferId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const cycleQuery = useRecipientCycleDetailQuery({
        organizationId: activeOrganizationId,
        recipientCycleId: detailQuery.data?.transfer.recipientCycleId,
        enabled: detailQuery.isSuccess && canRead,
    })
    const historyQuery = usePregnancyChecksQuery({
        organizationId: activeOrganizationId,
        transferId,
        enabled: detailQuery.isSuccess && canRead,
    })
    const outcomeQuery = usePregnancyOutcomeQuery({
        organizationId: activeOrganizationId,
        transferId,
        enabled: detailQuery.isSuccess && canRead,
    })
    const professionalQuery = useProfessionalDetailQuery({
        organizationId: activeOrganizationId,
        professionalId: detailQuery.data?.transfer.operatorProfessionalId,
        enabled: detailQuery.isSuccess && canReadMasterData,
    })

    if (!transferId) {
        return <SafeAreaView style={styles.screen}><TransferState message="Transferência não identificada." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && detailQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando transferência" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><TransferState message="Você não tem permissão para consultar transferências." /></SafeAreaView>
    }
    const mainError = getTransferErrorMessage(contextQuery.error ?? detailQuery.error)
    if (mainError || !detailQuery.data) {
        return <SafeAreaView style={styles.screen}><TransferState message={mainError ?? 'Não foi possível carregar a transferência.'} onRetry={() => void detailQuery.refetch()} /></SafeAreaView>
    }

    const { transfer, lineage } = detailQuery.data
    const history = historyQuery.data?.pages.flatMap(page => page.items) ?? []
    const latest = outcomeQuery.data?.latestValidCheck ?? null
    const semen = lineage.mating.semen

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Transferência realizada</Text>
                <Text style={styles.subtitle}>{getTransferOriginLabel(transfer.origin)}</Text>

                <TransferSection title="Transferência">
                    <TransferField label="Realizada em" value={formatTransferTimestamp(transfer.performedAt)} />
                    <TransferField label="Fuso horário" value={transfer.timezone} />
                    <TransferField label="Animal receptora" value={cycleQuery.data?.recipientName?.trim() || 'Apresentação não disponível'} />
                    <TransferField label="Embrião" value={transfer.embryoId} />
                    <TransferField label="Profissional" value={professionalQuery.data?.name ?? transfer.operatorProfessionalId} />
                    {transfer.notes ? <TransferField label="Observações" value={transfer.notes} /> : null}
                </TransferSection>

                <TransferSection title="Lineage">
                    <TransferField label="Fertilização" value={lineage.matingId} />
                    <TransferField label="Coleta de oócitos" value={lineage.mating.collectionId} />
                    <TransferField label="Doadora" value={lineage.mating.donorId} />
                    <TransferField label="Lote de sêmen" value={semen.batch.batchCode} />
                    <TransferField label="Reprodutor" value={semen.sire.name?.trim() || 'Animal sem nome'} />
                    <TransferField label="Produtor externo" value={semen.producer.name} />
                    <TransferField label="Ciclo da receptora" value={transfer.recipientCycleId} />
                </TransferSection>

                <TransferSection title="Resultado gestacional atual">
                    {outcomeQuery.isPending ? <Text style={styles.help}>Carregando resultado...</Text> : outcomeQuery.error ? (
                        <TransferState message={getTransferErrorMessage(outcomeQuery.error)} onRetry={() => void outcomeQuery.refetch()} />
                    ) : latest ? (
                        <>
                            <TransferField label="Resultado" value={getPregnancyResultLabel(latest.result)} />
                            <TransferField label="Verificado em" value={formatTransferTimestamp(latest.checkedAt)} />
                        </>
                    ) : <Text style={styles.help}>Ainda sem outcome gestacional válido.</Text>}
                </TransferSection>

                <TransferSection title="Histórico de PregnancyChecks">
                    {historyQuery.isPending ? <Text style={styles.help}>Carregando histórico...</Text> : historyQuery.error && history.length === 0 ? (
                        <TransferState message={getTransferErrorMessage(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />
                    ) : history.length === 0 ? <Text style={styles.help}>Nenhuma checagem registrada.</Text> : history.map(entry => <PregnancyCheckCard key={entry.check.id} entry={entry} />)}
                    {historyQuery.hasNextPage ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Carregar mais checagens gestacionais" accessibilityState={{ busy: historyQuery.isFetchingNextPage }} onPress={() => void historyQuery.fetchNextPage()} style={styles.moreButton}>
                            <Text style={styles.moreText}>{historyQuery.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}</Text>
                        </Pressable>
                    ) : null}
                </TransferSection>

                <TransferSection title="Proveniência">
                    <TransferField label="Origem" value={transfer.provenance.originType} />
                    <TransferField label="Registrado em" value={formatTransferTimestamp(transfer.provenance.recordedAt)} />
                </TransferSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 14 },
    help: { color: '#475569', fontSize: 14, lineHeight: 20 },
    card: { marginBottom: 10, padding: 12, borderRadius: 10, backgroundColor: '#F8FAFC' },
    cardTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
    cardText: { marginTop: 4, color: '#475569', fontSize: 13, lineHeight: 18 },
    invalidated: { marginTop: 8, padding: 9, borderRadius: 8, backgroundColor: '#FEF2F2' },
    invalidatedTitle: { color: '#991B1B', fontSize: 13, fontWeight: '700' },
    moreButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    moreText: { color: '#092955', fontSize: 14, fontWeight: '700' },
})
