import React from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    DistributionField,
    DistributionSection,
    DistributionState,
} from '../components/DistributionElements'
import {
    DISTRIBUTION_PERMISSIONS,
    hasDistributionPermission,
} from '../distributionPermissions'
import {
    formatDistributionTimestamp,
    getRecallErrorMessage,
} from '../distributionPresentation'
import {
    useRecallDetailQuery,
    useRecallImpactQuery,
} from '../hooks/useDistributionQueries'

function MaterialImpact({ material }) {
    return (
        <View accessible accessibilityLabel={`Material afetado, Embryo ${material.embryoId}`} style={styles.card}>
            <DistributionField label="Embryo ID" selectable value={material.embryoId} />
            <DistributionField label="Availability atual" value={material.availability} />
            <DistributionField label="Mating ID" selectable value={material.matingId} />
            <DistributionField label="Donor ID" selectable value={material.donorId} />
            <DistributionField label="SemenBatch ID" selectable value={material.semenBatchId} />
            <DistributionField label="Sire ID" selectable value={material.sireId} />
            <DistributionField label="Package ID" selectable value={material.packageId} />
            <DistributionField label="Membership ativo agora" value={material.activeMembership ? 'Sim' : 'Não'} />
            <DistributionField label="Localização atual" selectable value={material.currentLocation} accessibilityLabel={`Localização atual: ${material.currentLocation ?? 'não informada'}`} />
            <DistributionField label="Localização no corte" selectable value={material.locationAtCutoff} accessibilityLabel={`Localização no corte: ${material.locationAtCutoff ?? 'não informada'}`} />
            <Text style={styles.distinction}>A localização no corte é histórica e não substitui a localização atual.</Text>
            <DistributionField label="Shipment ID" selectable value={material.shipmentId} />
            <DistributionField label="Destino no Shipment" value={material.destinationName} />
            <DistributionField label="Transfer ID" selectable value={material.transferId} />
            <DistributionField label="Hold ativo agora" value={material.held ? 'Sim' : 'Não'} accessibilityLabel={`Hold atual: ${material.held ? 'sim' : 'não'}`} />
        </View>
    )
}

export default function RecallDetail({ route }) {
    const recallId = route.params?.recallId
    const { activeOrganizationId } = useOrganization()
    const [pickerVisible, setPickerVisible] = React.useState(false)
    const [cutoff, setCutoff] = React.useState(null)
    const [submittedCutoff, setSubmittedCutoff] = React.useState(null)
    const [analysisRequested, setAnalysisRequested] = React.useState(false)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasDistributionPermission(
        contextQuery.data,
        DISTRIBUTION_PERMISSIONS.RECALL_READ
    )
    const enabled = contextQuery.isSuccess && canRead
    const recallQuery = useRecallDetailQuery({
        organizationId: activeOrganizationId,
        recallId,
        enabled,
    })
    const impactQuery = useRecallImpactQuery({
        organizationId: activeOrganizationId,
        recallId,
        cutoff: submittedCutoff,
        enabled: enabled && analysisRequested,
    })

    React.useEffect(() => {
        setCutoff(null)
        setSubmittedCutoff(null)
        setAnalysisRequested(false)
        setPickerVisible(false)
    }, [activeOrganizationId, recallId])

    if (!recallId) {
        return <SafeAreaView style={styles.screen}><DistributionState message="Recall não identificado." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && recallQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><DistributionState loading message="Carregando Recall" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><DistributionState message="Você não tem permissão para consultar este Recall." /></SafeAreaView>
    }
    const detailError = getRecallErrorMessage(contextQuery.error ?? recallQuery.error)
    if (detailError || !recallQuery.data) {
        const retry = contextQuery.error ? contextQuery.refetch : recallQuery.refetch
        return <SafeAreaView style={styles.screen}><DistributionState message={detailError ?? 'Não foi possível carregar o Recall.'} onRetry={() => void retry()} /></SafeAreaView>
    }

    const recall = recallQuery.data
    const materials = impactQuery.data?.pages.flatMap(page => page.materials) ?? []
    const firstImpact = impactQuery.data?.pages[0]
    const impactError = getRecallErrorMessage(impactQuery.error)
    const runAnalysis = () => {
        const next = cutoff?.toISOString() ?? null
        if (analysisRequested && submittedCutoff === next) {
            void impactQuery.refetch()
        } else {
            setSubmittedCutoff(next)
            setAnalysisRequested(true)
        }
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Recall</Text>
                <Text style={styles.subtitle}>{recall.id}</Text>

                <DistributionSection title="Caso registrado">
                    <DistributionField label="Trigger type" value={recall.triggerType} />
                    <DistributionField label="Trigger ID" selectable value={recall.triggerId} />
                    <DistributionField label="Motivo" value={recall.reason} />
                    <DistributionField label="Aberto em" value={formatDistributionTimestamp(recall.openedAt)} />
                    <DistributionField label="Source DocumentReference ID" selectable value={recall.sourceDocumentId} />
                    {recall.sourceDocumentId ? <Text style={styles.help}>Esta referência é um DocumentReference externo declarado; não é Document ou evidência binária verificada.</Text> : null}
                    <Text style={styles.help}>O backend atual não expõe status, encerramento, cancelamento ou remediação para RecallCase.</Text>
                </DistributionSection>

                <DistributionSection title="Impacto recalculado">
                    <Text style={styles.help}>Sem corte informado, o backend usa o momento da análise. Um corte explícito deve estar entre a abertura do caso e agora.</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Selecionar corte da análise" accessibilityHint="Seleciona uma data e hora histórica opcional" onPress={() => setPickerVisible(true)} style={styles.selectionButton}>
                        <Text style={styles.selectionText}>{cutoff ? formatDistributionTimestamp(cutoff.toISOString()) : 'Sem corte explícito — analisar estado atual'}</Text>
                    </Pressable>
                    {cutoff ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Remover corte e analisar estado atual" onPress={() => {
                            setCutoff(null)
                            setSubmittedCutoff(null)
                            setAnalysisRequested(false)
                        }} style={styles.clearButton}>
                            <Text style={styles.clearText}>Remover corte</Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Calcular impacto do Recall"
                        accessibilityHint="Executa cálculo paginado sem persistir resultado ou criar holds"
                        accessibilityState={{ busy: impactQuery.isFetching, disabled: impactQuery.isFetching }}
                        disabled={impactQuery.isFetching}
                        onPress={runAnalysis}
                        style={[styles.primaryButton, impactQuery.isFetching && styles.disabled]}
                    >
                        <Text style={styles.primaryText}>Calcular impacto</Text>
                    </Pressable>

                    {impactQuery.isPending && analysisRequested ? (
                        <View accessibilityRole="progressbar" accessibilityLabel="Calculando impacto do Recall" style={styles.loading}>
                            <ActivityIndicator color="#092955" />
                        </View>
                    ) : null}
                    {impactError ? (
                        <View accessibilityRole="alert">
                            <Text style={styles.error}>{impactError}</Text>
                            <Pressable accessibilityRole="button" accessibilityLabel="Tentar calcular impacto novamente" onPress={() => void impactQuery.refetch()} style={styles.clearButton}>
                                <Text style={styles.clearText}>Tentar novamente</Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {firstImpact ? (
                        <>
                            <DistributionField label="Corte calculado pelo backend" value={formatDistributionTimestamp(firstImpact.analysisCutoff)} />
                            <Text style={styles.distinction}>Os campos atuais e os campos no corte têm semânticas distintas.</Text>
                            {materials.length
                                ? materials.map((material, index) => <MaterialImpact key={`${material.embryoId}-${material.packageId ?? 'no-package'}-${index}`} material={material} />)
                                : <Text style={styles.help}>Nenhum material afetado nesta análise.</Text>}
                            {impactQuery.hasNextPage ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Carregar mais materiais afetados"
                                    accessibilityState={{ busy: impactQuery.isFetchingNextPage, disabled: impactQuery.isFetchingNextPage }}
                                    disabled={impactQuery.isFetchingNextPage}
                                    onPress={() => void impactQuery.fetchNextPage()}
                                    style={styles.clearButton}
                                >
                                    <Text style={styles.clearText}>{impactQuery.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}</Text>
                                </Pressable>
                            ) : null}
                        </>
                    ) : null}
                </DistributionSection>
            </ScrollView>
            <DateTimePickerModal
                date={cutoff ?? new Date()}
                isVisible={pickerVisible}
                maximumDate={new Date()}
                minimumDate={new Date(recall.openedAt)}
                mode="datetime"
                onCancel={() => setPickerVisible(false)}
                onConfirm={(date) => {
                    setCutoff(date)
                    setSubmittedCutoff(null)
                    setAnalysisRequested(false)
                    setPickerVisible(false)
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 90 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 13 },
    help: { marginTop: 5, color: '#475569', fontSize: 13, lineHeight: 19 },
    distinction: { marginVertical: 8, color: '#7C2D12', fontSize: 13, fontWeight: '600', lineHeight: 19 },
    card: { marginTop: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, backgroundColor: '#F8FAFC' },
    selectionButton: { minHeight: 48, justifyContent: 'center', marginTop: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#64748B', borderRadius: 10, backgroundColor: '#FFFFFF' },
    selectionText: { color: '#0F172A', fontSize: 15 },
    primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 24, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontWeight: '700' },
    clearButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 },
    clearText: { color: '#092955', fontWeight: '700' },
    disabled: { opacity: 0.5 },
    loading: { paddingVertical: 14 },
    error: { marginTop: 10, color: '#991B1B', fontSize: 14, lineHeight: 20 },
})
