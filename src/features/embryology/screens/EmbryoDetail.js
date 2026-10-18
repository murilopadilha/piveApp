import React from 'react'
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
    EmbryoField,
    EmbryoSection,
    EmbryoState,
} from '../components/EmbryoElements'
import EmbryoHoldManager from '../components/EmbryoHoldManager'
import {
    EMBRYO_PERMISSIONS,
    canReadEmbryoTraceability,
    hasEmbryoPermission,
} from '../embryoPermissions'
import {
    findAssessmentCode,
    formatEmbryoTimestamp,
    getAvailabilityLabel,
    getEmbryoErrorMessage,
    getPreservationLabel,
} from '../embryoPresentation'
import {
    useAssessmentVersionsQueries,
    useEmbryoDetailQuery,
    useEmbryoEvaluationsQuery,
} from '../hooks/useEmbryoQueries'
import { EMBRYO_ROUTES } from '../routes'

function SectionState({ message, onRetry, loading = false }) {
    return (
        <View
            accessibilityRole={loading ? 'progressbar' : 'alert'}
            accessibilityLabel={message}
            style={styles.sectionState}
        >
            {loading ? <ActivityIndicator color="#092955" /> : null}
            <Text style={styles.sectionStateText}>{message}</Text>
            {onRetry ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tentar novamente"
                    onPress={onRetry}
                    style={styles.retryButton}
                >
                    <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

function EvaluationCard({ evaluation, versionQuery }) {
    const version = versionQuery?.data
    const stage = findAssessmentCode(
        version,
        evaluation.developmentStageCodeId
    )
    const grade = findAssessmentCode(
        version,
        evaluation.qualityGradeCodeId
    )

    return (
        <View style={styles.historyItem}>
            <Text style={styles.historyTitle}>
                {formatEmbryoTimestamp(evaluation.evaluatedAt)}
            </Text>
            <Text style={styles.historyText}>
                Esquema: {version?.versionLabel ?? 'Catálogo histórico indisponível'}
            </Text>
            <Text style={styles.historyText}>
                Estágio: {stage?.displayName ?? 'Código histórico indisponível'}
            </Text>
            <Text style={styles.historyText}>
                Qualidade: {grade?.displayName ?? 'Código histórico indisponível'}
            </Text>
            {evaluation.notes ? (
                <Text style={styles.historyText}>Observações: {evaluation.notes}</Text>
            ) : null}
            {versionQuery?.error ? (
                <Text accessibilityRole="alert" style={styles.partialText}>
                    Não foi possível resolver os rótulos desta versão.
                </Text>
            ) : null}
        </View>
    )
}

export default function EmbryoDetail({ navigation, route }) {
    const embryoId = route.params?.embryoId
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.READ
    )
    const canWrite = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.WRITE
    )
    const canTrace = canReadEmbryoTraceability(effectiveContextQuery.data)
    const canAudit = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.COMPLIANCE_READ
    )
    const detailEnabled = effectiveContextQuery.isSuccess && canRead
    const embryoQuery = useEmbryoDetailQuery({
        organizationId: activeOrganizationId,
        embryoId,
        enabled: detailEnabled,
    })
    const historyQuery = useEmbryoEvaluationsQuery({
        organizationId: activeOrganizationId,
        embryoId,
        enabled: detailEnabled && embryoQuery.isSuccess,
    })
    const evaluations = React.useMemo(
        () => historyQuery.data ?? [],
        [historyQuery.data]
    )
    const referencedEvaluations = React.useMemo(() => {
        const byId = new Map()

        if (embryoQuery.data?.currentEvaluation) {
            byId.set(
                embryoQuery.data.currentEvaluation.id,
                embryoQuery.data.currentEvaluation
            )
        }
        evaluations.forEach(evaluation => byId.set(evaluation.id, evaluation))

        return [...byId.values()]
    }, [embryoQuery.data?.currentEvaluation, evaluations])
    const versionQueries = useAssessmentVersionsQueries({
        organizationId: activeOrganizationId,
        evaluations: referencedEvaluations,
        enabled: detailEnabled && embryoQuery.isSuccess,
    })

    if (!embryoId) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Embrião não identificado." />
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isPending || (canRead && embryoQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState loading message="Carregando embrião" />
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Você não tem permissão para consultar este embrião." />
            </SafeAreaView>
        )
    }

    const mainErrorMessage = getEmbryoErrorMessage(
        effectiveContextQuery.error ?? embryoQuery.error
    )

    if (mainErrorMessage || !embryoQuery.data) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState
                    message={mainErrorMessage ?? 'Não foi possível carregar o embrião.'}
                    onRetry={() => void embryoQuery.refetch()}
                />
            </SafeAreaView>
        )
    }

    const embryo = embryoQuery.data
    const historyError = getEmbryoErrorMessage(
        historyQuery.error,
        'Histórico de avaliações não encontrado.'
    )

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    {embryo.humanCode}
                </Text>
                <Text style={styles.subtitle}>Identidade do embrião</Text>

                {canTrace || canAudit ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Abrir rastreabilidade do embrião"
                        accessibilityHint="Mostra lineage, timeline e auditoria conforme suas permissões"
                        onPress={() => navigation?.navigate(
                            EMBRYO_ROUTES.TRACEABILITY,
                            { embryoId }
                        )}
                        style={styles.traceabilityButton}
                    >
                        <Text style={styles.traceabilityText}>
                            Rastreabilidade e auditoria
                        </Text>
                    </Pressable>
                ) : null}

                <EmbryoSection title="Identificação">
                    <EmbryoField
                        label="Identificado em"
                        value={formatEmbryoTimestamp(embryo.identifiedAt)}
                    />
                    <EmbryoField label="Fertilização" value={embryo.matingId} />
                    {embryo.ownerId ? (
                        <EmbryoField
                            label="Identificador do proprietário"
                            value={embryo.ownerId}
                        />
                    ) : (
                        <Text style={styles.emptyText}>Proprietário não informado.</Text>
                    )}
                    <EmbryoField label="Versão" value={String(embryo.version)} />
                </EmbryoSection>

                <EmbryoSection title="Disponibilidade">
                    <EmbryoField
                        label="Disponibilidade"
                        value={getAvailabilityLabel(embryo.availability)}
                    />
                </EmbryoSection>

                <EmbryoSection title="Preservação">
                    <EmbryoField
                        label="Estado de preservação"
                        value={getPreservationLabel(embryo.preservation)}
                    />
                </EmbryoSection>

                <EmbryoSection title="Holds">
                    <EmbryoHoldManager
                        canWrite={canWrite}
                        embryo={embryo}
                        onRefetch={embryoQuery.refetch}
                        organizationId={activeOrganizationId}
                    />
                </EmbryoSection>

                <EmbryoSection title="Localização atual">
                    <Text style={styles.emptyText}>
                        {embryo.currentLocationId
                            ? `Identificador técnico: ${embryo.currentLocationId}`
                            : 'Localização não informada.'}
                    </Text>
                </EmbryoSection>

                <EmbryoSection title="Avaliação atual">
                    {embryo.currentEvaluation ? (
                        <EvaluationCard
                            evaluation={embryo.currentEvaluation}
                            versionQuery={versionQueries.find(
                                query => query.schemeVersionId ===
                                    embryo.currentEvaluation.schemeVersionId
                            )}
                        />
                    ) : (
                        <Text style={styles.emptyText}>Nenhuma avaliação registrada.</Text>
                    )}
                </EmbryoSection>

                <EmbryoSection title="Histórico de avaliações">
                    {historyQuery.isPending ? (
                        <SectionState loading message="Carregando avaliações" />
                    ) : historyError && evaluations.length === 0 ? (
                        <SectionState
                            message={historyError}
                            onRetry={() => void historyQuery.refetch()}
                        />
                    ) : evaluations.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhuma avaliação registrada.</Text>
                    ) : (
                        evaluations.map(evaluation => (
                            <EvaluationCard
                                key={evaluation.id}
                                evaluation={evaluation}
                                versionQuery={versionQueries.find(
                                    query => query.schemeVersionId ===
                                        evaluation.schemeVersionId
                                )}
                            />
                        ))
                    )}
                </EmbryoSection>

                <EmbryoSection title="Proveniência">
                    <EmbryoField label="Origem" value={embryo.provenance.originType} />
                    <EmbryoField
                        label="Registrado em"
                        value={formatEmbryoTimestamp(embryo.provenance.recordedAt)}
                    />
                </EmbryoSection>
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
        fontSize: 14,
    },
    emptyText: { color: '#475569', fontSize: 14, lineHeight: 20 },
    historyItem: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    historyTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
    historyText: { color: '#475569', fontSize: 14, marginTop: 4 },
    partialText: { color: '#92400E', fontSize: 13, marginTop: 6 },
    traceabilityButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#092955',
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
    },
    traceabilityText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    sectionState: { alignItems: 'flex-start', paddingVertical: 8 },
    sectionStateText: { color: '#475569', fontSize: 14, marginTop: 6 },
    retryButton: { minHeight: 44, justifyContent: 'center' },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
})
