import React from 'react'
import {
    ActivityIndicator,
    Alert,
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
    OpuDetailField,
    OpuDetailSection,
    OpuSectionError,
    OpuSectionLoading,
} from '../components/OpuDetailElements'
import OpuStateMessage from '../components/OpuStateMessage'
import {
    useOpuTransitionMutation,
} from '../hooks/useOpuMutations'
import {
    useOpuReferenceQueries,
    useOpuSessionCollectionsQuery,
    useOpuSessionDetailQuery,
    useOpuSessionSummaryQuery,
} from '../hooks/useOpuQueries'
import { createSessionTransitionIntent } from '../opuIntents'
import {
    OPU_PERMISSIONS,
    hasOpuPermission,
} from '../opuPermissions'
import {
    formatOpuTimestamp,
    getCollectionStatusLabel,
    getOpuErrorMessage,
    getOpuCommandErrorMessage,
    getOpuOriginLabel,
    getOpuStatusLabel,
} from '../opuPresentation'
import { OPU_ROUTES } from '../routes'

const referenceLabel = (reference, field, unavailable) => {
    if (reference?.isPending) {
        return 'Carregando...'
    }

    return reference?.data?.[field] ?? unavailable
}

export default function OpuSessionDetail({ navigation, route }) {
    const opuSessionId = route.params?.opuSessionId
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.READ
    )
    const canReadMasterData = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.MASTER_DATA_READ
    )
    const canReadClient = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.CLIENT_READ
    )
    const canWrite = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.WRITE
    )
    const detailEnabled = effectiveContextQuery.isSuccess && canRead
    const sessionQuery = useOpuSessionDetailQuery({
        organizationId: activeOrganizationId,
        opuSessionId,
        enabled: detailEnabled,
    })
    const relatedEnabled = detailEnabled && sessionQuery.isSuccess
    const summaryQuery = useOpuSessionSummaryQuery({
        organizationId: activeOrganizationId,
        opuSessionId,
        enabled: relatedEnabled,
    })
    const collectionsQuery = useOpuSessionCollectionsQuery({
        organizationId: activeOrganizationId,
        opuSessionId,
        enabled: relatedEnabled,
    })
    const references = useOpuReferenceQueries({
        organizationId: activeOrganizationId,
        session: sessionQuery.data,
        canReadMasterData,
        canReadClient,
        enabled: relatedEnabled,
    })
    const collections = React.useMemo(
        () => collectionsQuery.data?.pages.flatMap(page => page.items) ?? [],
        [collectionsQuery.data]
    )
    const initialLoading = effectiveContextQuery.isPending ||
        (canRead && sessionQuery.isPending)
    const mainError = effectiveContextQuery.error ?? sessionQuery.error
    const mainErrorMessage = getOpuErrorMessage(mainError)
    const [pendingIntent, setPendingIntent] = React.useState(null)
    const transitionMutation = useOpuTransitionMutation({
        organizationId: activeOrganizationId,
        opuSessionId,
    })

    if (!opuSessionId) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="OPU não identificada." />
            </SafeAreaView>
        )
    }

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando detalhes da OPU"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando OPU...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Você não tem permissão para consultar esta OPU." />
            </SafeAreaView>
        )
    }

    if (mainErrorMessage) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage
                    message={mainErrorMessage}
                    onRetry={() => {
                        if (effectiveContextQuery.error) {
                            void effectiveContextQuery.refetch()
                            return
                        }

                        void sessionQuery.refetch()
                    }}
                />
            </SafeAreaView>
        )
    }

    const session = sessionQuery.data

    if (!session) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Não foi possível carregar a OPU." />
            </SafeAreaView>
        )
    }

    const summaryError = getOpuErrorMessage(
        summaryQuery.error,
        'Resumo da OPU não encontrado.'
    )
    const collectionsError = getOpuErrorMessage(
        collectionsQuery.error,
        'Coletas da OPU não encontradas.'
    )

    const executeAction = (action) => {
        const intent = pendingIntent?.action === action
            ? pendingIntent
            : createSessionTransitionIntent({
                opuSessionId,
                expectedVersion: session.version,
                action,
            })

        setPendingIntent(intent)
        transitionMutation.mutate(intent, {
            onSuccess: () => setPendingIntent(null),
        })
    }

    const requestAction = (action) => {
        if (action === 'start') {
            executeAction(action)
            return
        }

        const completingEmpty = action === 'complete' &&
            summaryQuery.data?.collections === 0
        const message = action === 'cancel'
            ? 'A OPU será cancelada. Coletas existentes não impedem esta operação.'
            : completingEmpty
                ? 'Esta OPU não possui coletas. O backend permite concluí-la mesmo assim. Deseja continuar?'
                : 'A OPU e suas coletas serão concluídas e ficarão somente para consulta.'

        Alert.alert(
            action === 'cancel' ? 'Cancelar OPU?' : 'Concluir OPU?',
            message,
            [
                { text: 'Voltar', style: 'cancel' },
                {
                    text: action === 'cancel' ? 'Cancelar OPU' : 'Concluir OPU',
                    style: action === 'cancel' ? 'destructive' : 'default',
                    onPress: () => executeAction(action),
                },
            ]
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.pageHeader}>
                    <Text accessibilityRole="header" style={styles.title}>OPU</Text>
                    <Text style={styles.status}>{getOpuStatusLabel(session.status)}</Text>
                </View>

                {canWrite && (session.status === 'DRAFT' || session.status === 'IN_PROGRESS') ? (
                    <OpuDetailSection title="Ações">
                        {transitionMutation.error ? (
                            <Text accessibilityRole="alert" style={styles.commandError}>
                                {getOpuCommandErrorMessage(transitionMutation.error)}
                            </Text>
                        ) : null}
                        {pendingIntent && transitionMutation.isError ? (
                            <>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{ busy: transitionMutation.isPending }}
                                    onPress={() => executeAction(pendingIntent.action)}
                                    style={styles.actionPrimary}
                                >
                                    <Text style={styles.actionPrimaryText}>
                                        Tentar novamente com a mesma intenção
                                    </Text>
                                </Pressable>
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={() => {
                                        setPendingIntent(null)
                                        transitionMutation.reset()
                                        void sessionQuery.refetch()
                                    }}
                                    style={styles.actionSecondary}
                                >
                                    <Text style={styles.actionSecondaryText}>Descartar intenção e revisar estado</Text>
                                </Pressable>
                            </>
                        ) : (
                            <View style={styles.actionsRow}>
                                {session.status === 'DRAFT' ? (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Iniciar OPU"
                                        accessibilityState={{ busy: transitionMutation.isPending, disabled: transitionMutation.isPending }}
                                        disabled={transitionMutation.isPending}
                                        onPress={() => requestAction('start')}
                                        style={styles.actionPrimary}
                                    >
                                        <Text style={styles.actionPrimaryText}>Iniciar</Text>
                                    </Pressable>
                                ) : (
                                    <>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Registrar coletas da OPU"
                                            onPress={() => navigation.navigate(
                                                OPU_ROUTES.COLLECTION_BATCH,
                                                { opuSessionId }
                                            )}
                                            style={styles.actionPrimary}
                                        >
                                            <Text style={styles.actionPrimaryText}>Registrar coletas</Text>
                                        </Pressable>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Concluir OPU"
                                            disabled={transitionMutation.isPending}
                                            onPress={() => requestAction('complete')}
                                            style={styles.actionSecondary}
                                        >
                                            <Text style={styles.actionSecondaryText}>Concluir</Text>
                                        </Pressable>
                                    </>
                                )}
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Cancelar OPU"
                                    disabled={transitionMutation.isPending}
                                    onPress={() => requestAction('cancel')}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelText}>Cancelar OPU</Text>
                                </Pressable>
                            </View>
                        )}
                    </OpuDetailSection>
                ) : null}

                <OpuDetailSection title="Sessão">
                    <OpuDetailField
                        label="Realizada em"
                        value={formatOpuTimestamp(session.performedAt)}
                    />
                    <OpuDetailField label="Fuso horário" value={session.timezone} />
                    <OpuDetailField
                        label="Estabelecimento"
                        value={canReadMasterData
                            ? referenceLabel(
                                references.establishment,
                                'legalDisplayName',
                                'Estabelecimento não disponível'
                            )
                            : 'Sem permissão para consultar'}
                    />
                    {session.operationalLocationId ? (
                        <OpuDetailField
                            label="Local operacional"
                            value={canReadMasterData
                                ? referenceLabel(
                                    references.operationalLocation,
                                    'name',
                                    'Local não disponível'
                                )
                                : 'Sem permissão para consultar'}
                        />
                    ) : null}
                    <OpuDetailField
                        label="Propriedade"
                        value={canReadMasterData
                            ? referenceLabel(
                                references.farmProperty,
                                'name',
                                'Propriedade não disponível'
                            )
                            : 'Sem permissão para consultar'}
                    />
                    <OpuDetailField
                        label="Profissional responsável"
                        value={canReadMasterData
                            ? referenceLabel(
                                references.professional,
                                'name',
                                'Profissional não disponível'
                            )
                            : 'Sem permissão para consultar'}
                    />
                    {session.clientId ? (
                        <OpuDetailField
                            label="Cliente"
                            value={canReadClient
                                ? referenceLabel(
                                    references.client,
                                    'displayName',
                                    'Cliente não disponível'
                                )
                                : 'Sem permissão para consultar'}
                        />
                    ) : null}
                    {session.notes ? (
                        <OpuDetailField label="Observações" value={session.notes} />
                    ) : null}
                </OpuDetailSection>

                <OpuDetailSection title="Resumo">
                    {summaryQuery.isPending ? (
                        <OpuSectionLoading label="Carregando resumo" />
                    ) : summaryError ? (
                        <OpuSectionError
                            message={summaryError}
                            onRetry={() => void summaryQuery.refetch()}
                        />
                    ) : summaryQuery.data ? (
                        <>
                            <OpuDetailField
                                label="Coletas"
                                value={String(summaryQuery.data.collections)}
                            />
                            <OpuDetailField
                                label="Total recuperado"
                                value={String(summaryQuery.data.totalRecovered)}
                            />
                            <OpuDetailField
                                label="Viáveis"
                                value={String(summaryQuery.data.viable)}
                            />
                            {summaryQuery.data.farmSnapshot ? (
                                <OpuDetailField
                                    label="Origem registrada"
                                    value={summaryQuery.data.farmSnapshot.name}
                                />
                            ) : null}
                        </>
                    ) : null}
                </OpuDetailSection>

                <OpuDetailSection title="Coletas">
                    {collectionsQuery.isPending ? (
                        <OpuSectionLoading label="Carregando coletas" />
                    ) : collectionsError && collections.length === 0 ? (
                        <OpuSectionError
                            message={collectionsError}
                            onRetry={() => void collectionsQuery.refetch()}
                        />
                    ) : collections.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhuma coleta registrada.</Text>
                    ) : (
                        collections.map((collection, index) => (
                            <Pressable
                                key={collection.id}
                                accessibilityRole="button"
                                accessibilityLabel={`Coleta ${index + 1}, ${getCollectionStatusLabel(collection.status)}`}
                                accessibilityHint="Abre os detalhes da coleta"
                                onPress={() => navigation.navigate(
                                    OPU_ROUTES.COLLECTION_DETAIL,
                                    { oocyteCollectionId: collection.id }
                                )}
                                style={({ pressed }) => [
                                    styles.collection,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text style={styles.collectionTitle}>Coleta {index + 1}</Text>
                                <Text style={styles.collectionText}>
                                    {collection.totalRecovered} recuperados · {collection.viable} viáveis
                                </Text>
                                <Text style={styles.collectionText}>
                                    {getCollectionStatusLabel(collection.status)}
                                </Text>
                            </Pressable>
                        ))
                    )}
                    {collectionsError && collections.length > 0 ? (
                        <OpuSectionError
                            message={collectionsError}
                            onRetry={() => void collectionsQuery.refetch()}
                        />
                    ) : null}
                    {collectionsQuery.hasNextPage ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Carregar mais coletas"
                            accessibilityState={{
                                busy: collectionsQuery.isFetchingNextPage,
                                disabled: collectionsQuery.isFetchingNextPage,
                            }}
                            disabled={collectionsQuery.isFetchingNextPage}
                            onPress={() => void collectionsQuery.fetchNextPage()}
                            style={styles.loadMore}
                        >
                            <Text style={styles.loadMoreText}>
                                {collectionsQuery.isFetchingNextPage
                                    ? 'Carregando...'
                                    : 'Carregar mais'}
                            </Text>
                        </Pressable>
                    ) : null}
                </OpuDetailSection>

                <OpuDetailSection title="Proveniência">
                    <OpuDetailField
                        label="Origem"
                        value={getOpuOriginLabel(session.provenance.originType)}
                    />
                    <OpuDetailField
                        label="Registrado em"
                        value={formatOpuTimestamp(session.provenance.recordedAt)}
                    />
                    {session.completedAt ? (
                        <OpuDetailField
                            label="Concluída em"
                            value={formatOpuTimestamp(session.completedAt)}
                        />
                    ) : null}
                </OpuDetailSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 16, paddingBottom: 120 },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    stateText: { color: '#475569', fontSize: 15, marginTop: 12 },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    status: { color: '#092955', fontSize: 15, fontWeight: '700' },
    emptyText: { color: '#475569', fontSize: 15 },
    collection: {
        minHeight: 72,
        justifyContent: 'center',
        marginBottom: 10,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    pressed: { opacity: 0.72 },
    collectionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
    collectionText: { color: '#475569', fontSize: 14, marginTop: 4 },
    loadMore: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        borderRadius: 24,
        backgroundColor: '#092955',
    },
    loadMoreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    actionsRow: { gap: 8 },
    actionPrimary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#092955' },
    actionPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
    actionSecondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#092955', borderRadius: 24, paddingHorizontal: 12 },
    actionSecondaryText: { color: '#092955', fontSize: 14, fontWeight: '700', textAlign: 'center' },
    cancelButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: '#9F1239', fontSize: 14, fontWeight: '700' },
    commandError: { color: '#9F1239', fontSize: 14, lineHeight: 20, marginBottom: 10 },
})
