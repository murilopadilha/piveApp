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
import {
    EMBRYO_PERMISSIONS,
    canReadEmbryoTraceability,
    hasEmbryoPermission,
} from '../embryoPermissions'
import { formatEmbryoTimestamp, getEmbryoErrorMessage } from '../embryoPresentation'
import {
    useEmbryoAuditEventsQuery,
    useEmbryoTimelineQuery,
    useEmbryoTraceabilityQuery,
} from '../hooks/useEmbryoQueries'

const LINEAGE_FIELDS = Object.freeze([
    ['embryoId', 'Embrião'],
    ['matingId', 'Fertilização'],
    ['collectionId', 'Coleta de oócitos'],
    ['donorId', 'Doadora'],
    ['opuSessionId', 'Sessão OPU'],
    ['farmPropertyId', 'Propriedade'],
    ['semenBatchId', 'Lote de sêmen'],
    ['sireId', 'Reprodutor'],
    ['producerEstablishmentId', 'Produtor externo'],
    ['currentPackageId', 'Package atual'],
    ['currentLocationId', 'Localização atual'],
    ['transferId', 'Transferência'],
    ['recipientCycleId', 'Ciclo da receptora'],
    ['recipientAnimalId', 'Receptora'],
])

function LoadMoreButton({ label, loading, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ busy: loading, disabled: loading }}
            disabled={loading}
            onPress={onPress}
            style={styles.loadMore}
        >
            {loading ? (
                <ActivityIndicator color="#092955" />
            ) : (
                <Text style={styles.loadMoreText}>Carregar mais</Text>
            )}
        </Pressable>
    )
}

function QueryFailure({ message, onRetry }) {
    return (
        <View accessibilityRole="alert" style={styles.stateBox}>
            <Text style={styles.error}>{message}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente"
                onPress={onRetry}
                style={styles.retryButton}
            >
                <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
        </View>
    )
}

export default function EmbryoTraceability({ route }) {
    const embryoId = route.params?.embryoId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canTrace = canReadEmbryoTraceability(contextQuery.data)
    const canAudit = hasEmbryoPermission(
        contextQuery.data,
        EMBRYO_PERMISSIONS.COMPLIANCE_READ
    )
    const capabilitiesReady = contextQuery.isSuccess
    const lineageQuery = useEmbryoTraceabilityQuery({
        organizationId: activeOrganizationId,
        embryoId,
        enabled: capabilitiesReady && canTrace,
    })
    const timelineQuery = useEmbryoTimelineQuery({
        organizationId: activeOrganizationId,
        embryoId,
        enabled: capabilitiesReady && canTrace,
    })
    const auditQuery = useEmbryoAuditEventsQuery({
        organizationId: activeOrganizationId,
        embryoId,
        enabled: capabilitiesReady && canAudit,
    })
    const timelineEntries = React.useMemo(
        () => timelineQuery.data?.pages.flatMap(page => page.items) ?? [],
        [timelineQuery.data]
    )
    const auditEvents = React.useMemo(
        () => auditQuery.data?.pages.flatMap(page => page.items) ?? [],
        [auditQuery.data]
    )

    if (!embryoId) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Embrião não identificado." />
            </SafeAreaView>
        )
    }

    if (contextQuery.isPending) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState loading message="Carregando permissões" />
            </SafeAreaView>
        )
    }

    if (contextQuery.error) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState
                    message={getEmbryoErrorMessage(contextQuery.error)}
                    onRetry={() => void contextQuery.refetch()}
                />
            </SafeAreaView>
        )
    }

    if (!canTrace && !canAudit) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Você não tem permissão para consultar rastreabilidade ou auditoria." />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    Rastreabilidade do embrião
                </Text>
                <Text style={styles.subtitle}>{embryoId}</Text>

                {canTrace ? (
                    <>
                        <EmbryoSection title="Lineage canônica">
                            {lineageQuery.isPending ? (
                                <View accessibilityRole="progressbar" style={styles.stateBox}>
                                    <ActivityIndicator color="#092955" />
                                    <Text style={styles.stateText}>Carregando lineage</Text>
                                </View>
                            ) : lineageQuery.error ? (
                                <QueryFailure
                                    message={getEmbryoErrorMessage(
                                        lineageQuery.error,
                                        'Rastreabilidade não encontrada nesta organização.'
                                    )}
                                    onRetry={() => void lineageQuery.refetch()}
                                />
                            ) : (
                                <>
                                    <EmbryoField
                                        label="Código humano"
                                        value={lineageQuery.data?.humanCode ?? 'Não informado'}
                                    />
                                    {LINEAGE_FIELDS.map(([field, label]) => (
                                        lineageQuery.data?.[field] ? (
                                            <EmbryoField
                                                key={field}
                                                label={label}
                                                value={lineageQuery.data[field]}
                                            />
                                        ) : null
                                    ))}
                                </>
                            )}
                        </EmbryoSection>

                        <EmbryoSection title="Timeline de domínio">
                            <Text style={styles.semanticNote}>
                                Fatos canônicos na ordem fornecida pelo backend.
                            </Text>
                            {timelineQuery.isPending ? (
                                <View accessibilityRole="progressbar" style={styles.stateBox}>
                                    <ActivityIndicator color="#092955" />
                                    <Text style={styles.stateText}>Carregando timeline</Text>
                                </View>
                            ) : timelineQuery.error && timelineEntries.length === 0 ? (
                                <QueryFailure
                                    message={getEmbryoErrorMessage(
                                        timelineQuery.error,
                                        'Timeline não encontrada nesta organização.'
                                    )}
                                    onRetry={() => void timelineQuery.refetch()}
                                />
                            ) : timelineEntries.length === 0 ? (
                                <Text style={styles.emptyText}>Nenhum fato na timeline.</Text>
                            ) : (
                                timelineEntries.map((entry, index) => (
                                    <View
                                        accessibilityLabel={`Evento ${entry.type}`}
                                        key={`${entry.factId}-${index}`}
                                        style={styles.card}
                                    >
                                        <Text style={styles.cardTitle}>{entry.type}</Text>
                                        <Text style={styles.cardText}>
                                            Ocorrido em {formatEmbryoTimestamp(entry.occurredAt)}
                                        </Text>
                                        <Text style={styles.cardText}>
                                            Registrado em {formatEmbryoTimestamp(entry.recordedAt)}
                                        </Text>
                                        {entry.relatedId ? (
                                            <Text style={styles.cardMeta}>Relacionado: {entry.relatedId}</Text>
                                        ) : null}
                                    </View>
                                ))
                            )}
                            {timelineQuery.hasNextPage ? (
                                <LoadMoreButton
                                    label="Carregar mais eventos da timeline"
                                    loading={timelineQuery.isFetchingNextPage}
                                    onPress={() => void timelineQuery.fetchNextPage()}
                                />
                            ) : null}
                        </EmbryoSection>
                    </>
                ) : (
                    <EmbryoSection title="Rastreabilidade">
                        <Text style={styles.permissionText}>
                            Lineage e timeline não estão disponíveis com suas permissões atuais.
                        </Text>
                    </EmbryoSection>
                )}

                {canAudit ? (
                    <EmbryoSection title="Auditoria operacional">
                        <Text style={styles.semanticNote}>
                            Eventos operacionais; esta lista não é combinada com a timeline de domínio.
                        </Text>
                        {auditQuery.isPending ? (
                            <View accessibilityRole="progressbar" style={styles.stateBox}>
                                <ActivityIndicator color="#092955" />
                                <Text style={styles.stateText}>Carregando auditoria</Text>
                            </View>
                        ) : auditQuery.error && auditEvents.length === 0 ? (
                            <QueryFailure
                                message={getEmbryoErrorMessage(
                                    auditQuery.error,
                                    'Auditoria não encontrada nesta organização.'
                                )}
                                onRetry={() => void auditQuery.refetch()}
                            />
                        ) : auditEvents.length === 0 ? (
                            <Text style={styles.emptyText}>Nenhum evento de auditoria.</Text>
                        ) : (
                            auditEvents.map(event => (
                                <View
                                    accessibilityLabel={`Auditoria ${event.action}`}
                                    key={event.id}
                                    style={styles.auditCard}
                                >
                                    <Text style={styles.cardTitle}>{event.action}</Text>
                                    <Text style={styles.cardText}>
                                        {formatEmbryoTimestamp(event.occurredAt)}
                                    </Text>
                                    <Text style={styles.cardMeta}>Ator: {event.actorId}</Text>
                                    {event.entityVersion != null ? (
                                        <Text style={styles.cardMeta}>
                                            Versão da entidade: {event.entityVersion}
                                        </Text>
                                    ) : null}
                                    {event.reason ? (
                                        <Text style={styles.cardText}>Motivo: {event.reason}</Text>
                                    ) : null}
                                    <Text style={styles.cardMeta}>
                                        Correlação: {event.correlationId}
                                    </Text>
                                </View>
                            ))
                        )}
                        {auditQuery.hasNextPage ? (
                            <LoadMoreButton
                                label="Carregar mais eventos de auditoria"
                                loading={auditQuery.isFetchingNextPage}
                                onPress={() => void auditQuery.fetchNextPage()}
                            />
                        ) : null}
                    </EmbryoSection>
                ) : null}
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
        color: '#64748B',
        fontSize: 12,
    },
    semanticNote: { color: '#475569', fontSize: 13, lineHeight: 19, marginBottom: 12 },
    permissionText: { color: '#92400E', fontSize: 14, lineHeight: 20 },
    emptyText: { color: '#475569', fontSize: 14, lineHeight: 20 },
    stateBox: { alignItems: 'flex-start', paddingVertical: 8 },
    stateText: { color: '#475569', fontSize: 14, marginTop: 6 },
    error: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
    retryButton: { minHeight: 44, justifyContent: 'center' },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    card: {
        marginBottom: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#2563EB',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    auditCard: {
        marginBottom: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#7C3AED',
        borderRadius: 8,
        backgroundColor: '#FAF5FF',
    },
    cardTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
    cardText: { color: '#334155', fontSize: 14, lineHeight: 20, marginTop: 3 },
    cardMeta: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 3 },
    loadMore: {
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#092955',
        borderRadius: 23,
    },
    loadMoreText: { color: '#092955', fontSize: 14, fontWeight: '700' },
})
