import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    CorrectionField,
    CorrectionSection,
    CorrectionState,
} from '../components/CorrectionElements'
import {
    CORRECTION_PERMISSIONS,
    hasCorrectionPermission,
} from '../correctionPermissions'
import {
    formatCorrectionStatus,
    formatCorrectionTimestamp,
    formatHistoricalSemantics,
    getCorrectionErrorMessage,
} from '../correctionPresentation'
import {
    useCorrectionDetailQuery,
    useCorrectionImpactQuery,
} from '../hooks/useCorrectionQueries'

function ImpactState({ query }) {
    if (query.isPending) {
        return (
            <View
                accessibilityRole="progressbar"
                accessibilityLabel="Carregando impacto atual"
                style={styles.impactState}
            >
                <ActivityIndicator color="#092955" />
                <Text style={styles.help}>Calculando impacto atual...</Text>
            </View>
        )
    }

    const errorMessage = getCorrectionErrorMessage(query.error)
    if (errorMessage) {
        return (
            <View accessibilityRole="alert" style={styles.impactState}>
                <Text style={styles.error}>{errorMessage}</Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tentar carregar impacto atual novamente"
                    accessibilityState={{
                        busy: query.isFetching,
                        disabled: query.isFetching,
                    }}
                    disabled={query.isFetching}
                    onPress={() => void query.refetch()}
                    style={styles.linkButton}
                >
                    <Text style={styles.linkText}>Tentar novamente</Text>
                </Pressable>
            </View>
        )
    }

    const impact = query.data
    return (
        <>
            <Text style={styles.semanticNote}>
                Projeção recalculada com a situação atual. Não representa uma alteração aplicada.
            </Text>
            <CorrectionField
                accessibilityLabel={`Embriões afetados atualmente: ${impact.affectedEmbryos}`}
                label="Embriões afetados"
                value={String(impact.affectedEmbryos)}
            />
            <CorrectionField
                accessibilityLabel={`Packages ativos atualmente: ${impact.activePackages}`}
                label="Packages ativos"
                value={String(impact.activePackages)}
            />
            <CorrectionField
                accessibilityLabel={`Transferências realizadas atualmente: ${impact.performedTransfers}`}
                label="Transferências realizadas"
                value={String(impact.performedTransfers)}
            />
            <CorrectionField
                accessibilityLabel={`Código de bloqueio registrado: ${impact.applicationBlocker}`}
                label="Código de bloqueio registrado"
                selectable
                value={impact.applicationBlocker}
            />
            <Text style={styles.blockerNote}>
                Este código não significa que a solicitação foi rejeitada ou falhou.
            </Text>
        </>
    )
}

export default function CorrectionDetail({ route }) {
    const correctionId = route.params?.correctionId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasCorrectionPermission(
        contextQuery.data,
        CORRECTION_PERMISSIONS.READ
    )
    const enabled = contextQuery.isSuccess && canRead
    const correctionQuery = useCorrectionDetailQuery({
        organizationId: activeOrganizationId,
        correctionId,
        enabled,
    })
    const impactQuery = useCorrectionImpactQuery({
        organizationId: activeOrganizationId,
        correctionId,
        enabled,
    })

    if (!correctionId) {
        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState message="Solicitação de correção não identificada." />
            </SafeAreaView>
        )
    }
    if (contextQuery.isPending || (canRead && correctionQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState
                    loading
                    message="Carregando solicitação de correção"
                />
            </SafeAreaView>
        )
    }
    if (contextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState message="Você não tem permissão para consultar esta solicitação de correção." />
            </SafeAreaView>
        )
    }
    const detailError = getCorrectionErrorMessage(
        contextQuery.error ?? correctionQuery.error
    )
    if (detailError || !correctionQuery.data) {
        const retry = contextQuery.error
            ? contextQuery.refetch
            : correctionQuery.refetch

        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState
                    message={detailError ?? 'Não foi possível carregar a solicitação.'}
                    onRetry={() => void retry()}
                />
            </SafeAreaView>
        )
    }

    const correction = correctionQuery.data
    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    Solicitação de correção histórica
                </Text>
                <Text style={styles.subtitle}>{correction.id}</Text>

                <CorrectionSection title="Solicitação registrada">
                    <CorrectionField label="ID" selectable value={correction.id} />
                    <CorrectionField
                        accessibilityLabel={`Tipo do subject: ${correction.subjectType}`}
                        label="Tipo do subject"
                        value={correction.subjectType}
                    />
                    <CorrectionField
                        accessibilityLabel={`ID do subject: ${correction.subjectId}`}
                        label="ID do subject"
                        selectable
                        value={correction.subjectId}
                    />
                    {correction.subjectVersion != null ? (
                        <CorrectionField
                            label="Versão do subject"
                            value={String(correction.subjectVersion)}
                        />
                    ) : null}
                    <CorrectionField label="Motivo" value={correction.reason} />
                    <CorrectionField
                        accessibilityLabel={`Status factual: ${correction.status}`}
                        label="Status"
                        value={formatCorrectionStatus(correction.status)}
                    />
                    <Text style={styles.rawStatus}>
                        Código retornado: {correction.status}
                    </Text>
                    <CorrectionField
                        label="Registrada em"
                        value={formatCorrectionTimestamp(correction.requestedAt)}
                    />
                </CorrectionSection>

                <CorrectionSection title="Semântica anterior">
                    <Text style={styles.semanticNote}>
                        Snapshot histórico read-only fornecido pelo backend.
                    </Text>
                    <Text
                        accessibilityLabel="Semântica anterior histórica"
                        selectable
                        style={styles.semantics}
                    >
                        {formatHistoricalSemantics(correction.previousSemantics)}
                    </Text>
                </CorrectionSection>

                <CorrectionSection title="Semântica proposta">
                    <Text style={styles.semanticNote}>
                        Proposta histórica read-only; não representa alteração aplicada.
                    </Text>
                    <Text
                        accessibilityLabel="Semântica proposta histórica"
                        selectable
                        style={styles.semantics}
                    >
                        {formatHistoricalSemantics(correction.proposedSemantics)}
                    </Text>
                </CorrectionSection>

                <CorrectionSection title="Impacto atual">
                    <ImpactState query={impactQuery} />
                </CorrectionSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: {
        marginHorizontal: 20,
        color: '#092955',
        fontSize: 25,
        fontWeight: '700',
    },
    subtitle: {
        marginHorizontal: 20,
        marginTop: 4,
        marginBottom: 18,
        color: '#475569',
        fontSize: 13,
    },
    semanticNote: {
        marginBottom: 12,
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
    semantics: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        fontSize: 13,
        lineHeight: 19,
    },
    rawStatus: { marginTop: -6, marginBottom: 10, color: '#64748B', fontSize: 12 },
    impactState: { paddingVertical: 8 },
    help: { marginTop: 8, color: '#475569', fontSize: 14 },
    error: { color: '#991B1B', fontSize: 14, lineHeight: 20 },
    linkButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    linkText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    blockerNote: {
        marginTop: -4,
        color: '#475569',
        fontSize: 13,
        lineHeight: 18,
    },
})
