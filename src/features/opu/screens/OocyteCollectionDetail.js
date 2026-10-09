import React from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAnimalDetailQuery } from '../../animals/hooks/useAnimalQueries'
import { getAnimalName } from '../../animals/animalPresentation'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import {
    MATING_PERMISSIONS,
    canAllocateMatings,
    hasMatingPermission,
} from '../../fertilization/matingPermissions'
import { MATING_ROUTES } from '../../fertilization/routes'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    OpuDetailField,
    OpuDetailSection,
    OpuSectionError,
    OpuSectionLoading,
} from '../components/OpuDetailElements'
import OpuStateMessage from '../components/OpuStateMessage'
import {
    useOocyteCollectionDetailQuery,
    useOocyteCollectionDonorSnapshotQuery,
    useOpuSessionDetailQuery,
} from '../hooks/useOpuQueries'
import { useCorrectOocyteCollectionMutation } from '../hooks/useOpuMutations'
import { createCollectionCorrectionIntent } from '../opuIntents'
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
} from '../opuPresentation'

const donorName = (snapshot, animal) => {
    if (snapshot) {
        return snapshot.name?.trim() || 'Animal sem nome'
    }

    return animal ? getAnimalName(animal) : 'Doadora não disponível'
}

export default function OocyteCollectionDetail({ navigation, route }) {
    const oocyteCollectionId = route.params?.oocyteCollectionId
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
    const canWrite = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.WRITE
    )
    const canReadMatings = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.READ
    )
    const canCreateMatings = canAllocateMatings(effectiveContextQuery.data) &&
        hasMatingPermission(
            effectiveContextQuery.data,
            MATING_PERMISSIONS.SEMEN_READ
        ) &&
        canReadMasterData
    const [editing, setEditing] = React.useState(false)
    const [totalRecovered, setTotalRecovered] = React.useState('')
    const [viable, setViable] = React.useState('')
    const [folliclesAspirated, setFolliclesAspirated] = React.useState('')
    const [notes, setNotes] = React.useState('')
    const [reason, setReason] = React.useState('')
    const [pendingIntent, setPendingIntent] = React.useState(null)
    const [validationMessage, setValidationMessage] = React.useState(null)
    const detailEnabled = effectiveContextQuery.isSuccess && canRead
    const collectionQuery = useOocyteCollectionDetailQuery({
        organizationId: activeOrganizationId,
        oocyteCollectionId,
        enabled: detailEnabled,
    })
    const collection = collectionQuery.data
    const sessionQuery = useOpuSessionDetailQuery({
        organizationId: activeOrganizationId,
        opuSessionId: collection?.sessionId,
        enabled: detailEnabled && Boolean(collection?.sessionId),
    })
    const correctionMutation = useCorrectOocyteCollectionMutation({
        organizationId: activeOrganizationId,
        opuSessionId: collection?.sessionId,
        oocyteCollectionId,
    })
    const snapshotQuery = useOocyteCollectionDonorSnapshotQuery({
        organizationId: activeOrganizationId,
        oocyteCollectionId,
        enabled: detailEnabled && collection?.status === 'COMPLETED',
    })
    const currentAnimalQuery = useAnimalDetailQuery({
        organizationId: activeOrganizationId,
        animalId: collection?.donorId,
        enabled: detailEnabled && canReadMasterData &&
            collection?.status !== 'COMPLETED',
    })
    const initialLoading = effectiveContextQuery.isPending ||
        (canRead && collectionQuery.isPending)
    const mainError = effectiveContextQuery.error ?? collectionQuery.error
    const mainErrorMessage = getOpuErrorMessage(
        mainError,
        'Coleta de oócitos não encontrada nesta organização.'
    )

    if (!oocyteCollectionId) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Coleta de oócitos não identificada." />
            </SafeAreaView>
        )
    }

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando coleta de oócitos"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando coleta...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Você não tem permissão para consultar esta coleta." />
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

                        void collectionQuery.refetch()
                    }}
                />
            </SafeAreaView>
        )
    }

    if (!collection) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Não foi possível carregar a coleta." />
            </SafeAreaView>
        )
    }

    const donorError = getOpuErrorMessage(
        snapshotQuery.error ?? currentAnimalQuery.error,
        'Identidade da doadora não disponível.'
    )
    const donorLoading = collection.status === 'COMPLETED'
        ? snapshotQuery.isPending
        : canReadMasterData && currentAnimalQuery.isPending
    const donor = snapshotQuery.data ?? currentAnimalQuery.data
    const canCorrect = canWrite && collection.status === 'RECORDED' &&
        sessionQuery.data?.status === 'IN_PROGRESS'

    const beginCorrection = () => {
        setTotalRecovered(String(collection.totalRecovered))
        setViable(String(collection.viable))
        setFolliclesAspirated(collection.folliclesAspirated == null
            ? ''
            : String(collection.folliclesAspirated))
        setNotes(collection.notes ?? '')
        setReason('')
        setPendingIntent(null)
        setValidationMessage(null)
        correctionMutation.reset()
        setEditing(true)
    }

    const submitCorrection = () => {
        let intent = pendingIntent

        if (!intent) {
            try {
                intent = createCollectionCorrectionIntent({
                    oocyteCollectionId,
                    expectedVersion: collection.version,
                    totalRecovered,
                    viable,
                    folliclesAspirated,
                    notes,
                    reason,
                })
                setPendingIntent(intent)
            } catch {
                setValidationMessage('Revise os counts e informe o motivo da correção.')
                return
            }
        }

        setValidationMessage(null)
        correctionMutation.mutate(intent, {
            onSuccess: () => {
                setPendingIntent(null)
                setEditing(false)
            },
        })
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.pageHeader}>
                    <Text accessibilityRole="header" style={styles.title}>
                        Coleta de oócitos
                    </Text>
                    <Text style={styles.status}>
                        {getCollectionStatusLabel(collection.status)}
                    </Text>
                </View>

                <OpuDetailSection title="Resultado">
                    <OpuDetailField
                        label="Coletada em"
                        value={formatOpuTimestamp(collection.collectedAt)}
                    />
                    <OpuDetailField
                        label="Total recuperado"
                        value={String(collection.totalRecovered)}
                    />
                    <OpuDetailField
                        label="Viáveis"
                        value={String(collection.viable)}
                    />
                    <OpuDetailField
                        label="Folículos aspirados"
                        value={collection.folliclesAspirated == null
                            ? 'Não informado'
                            : String(collection.folliclesAspirated)}
                    />
                    {collection.notes ? (
                        <OpuDetailField label="Observações" value={collection.notes} />
                    ) : null}
                    {canCorrect && !editing ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Corrigir coleta de oócitos"
                            onPress={beginCorrection}
                            style={styles.correctButton}
                        >
                            <Text style={styles.correctText}>Corrigir coleta</Text>
                        </Pressable>
                    ) : null}
                    {editing ? (
                        <View style={styles.correctionForm}>
                            <Text style={styles.formTitle}>Correção pré-conclusão</Text>
                            <TextInput
                                accessibilityLabel="Total recuperado corrigido"
                                editable={!pendingIntent}
                                keyboardType="number-pad"
                                onChangeText={setTotalRecovered}
                                style={styles.input}
                                value={totalRecovered}
                            />
                            <TextInput
                                accessibilityLabel="Oócitos viáveis corrigidos"
                                editable={!pendingIntent}
                                keyboardType="number-pad"
                                onChangeText={setViable}
                                style={styles.input}
                                value={viable}
                            />
                            <TextInput
                                accessibilityLabel="Folículos aspirados corrigidos"
                                editable={!pendingIntent}
                                keyboardType="number-pad"
                                onChangeText={setFolliclesAspirated}
                                placeholder="Folículos aspirados (opcional)"
                                placeholderTextColor="#64748B"
                                style={styles.input}
                                value={folliclesAspirated}
                            />
                            <TextInput
                                accessibilityLabel="Observações corrigidas"
                                editable={!pendingIntent}
                                maxLength={2000}
                                multiline
                                onChangeText={setNotes}
                                placeholder="Observações (opcional)"
                                placeholderTextColor="#64748B"
                                style={[styles.input, styles.multiline]}
                                value={notes}
                            />
                            <TextInput
                                accessibilityLabel="Motivo da correção"
                                editable={!pendingIntent}
                                maxLength={500}
                                multiline
                                onChangeText={setReason}
                                placeholder="Motivo obrigatório"
                                placeholderTextColor="#64748B"
                                style={[styles.input, styles.multiline]}
                                value={reason}
                            />
                            {validationMessage ? (
                                <Text accessibilityRole="alert" style={styles.error}>{validationMessage}</Text>
                            ) : null}
                            {correctionMutation.error ? (
                                <Text accessibilityRole="alert" style={styles.error}>
                                    {getOpuCommandErrorMessage(correctionMutation.error)}
                                </Text>
                            ) : null}
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ busy: correctionMutation.isPending, disabled: correctionMutation.isPending }}
                                disabled={correctionMutation.isPending}
                                onPress={submitCorrection}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveText}>
                                    {correctionMutation.isPending
                                        ? 'Salvando...'
                                        : pendingIntent
                                            ? 'Tentar novamente com a mesma intenção'
                                            : 'Salvar correção'}
                                </Text>
                            </Pressable>
                            {pendingIntent && correctionMutation.isError ? (
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={() => {
                                        setPendingIntent(null)
                                        correctionMutation.reset()
                                    }}
                                    style={styles.editButton}
                                >
                                    <Text style={styles.editText}>Editar como nova intenção</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    ) : null}
                </OpuDetailSection>

                <OpuDetailSection title="Doadora">
                    {donorLoading ? (
                        <OpuSectionLoading label="Carregando doadora" />
                    ) : donorError ? (
                        <OpuSectionError
                            message={donorError}
                            onRetry={() => {
                                if (collection.status === 'COMPLETED') {
                                    void snapshotQuery.refetch()
                                    return
                                }

                                void currentAnimalQuery.refetch()
                            }}
                        />
                    ) : (
                        <>
                            <OpuDetailField
                                label={collection.status === 'COMPLETED'
                                    ? 'Identidade registrada na conclusão'
                                    : 'Animal'}
                                value={donorName(snapshotQuery.data, currentAnimalQuery.data)}
                            />
                            {snapshotQuery.data ? (
                                <>
                                    <OpuDetailField label="Sexo" value={snapshotQuery.data.sex} />
                                    <OpuDetailField
                                        label="Situação registrada"
                                        value={snapshotQuery.data.status}
                                    />
                                    {snapshotQuery.data.identifiers.map(identifier => (
                                        <OpuDetailField
                                            key={`${identifier.type}:${identifier.issuer ?? ''}:${identifier.value}`}
                                            label={identifier.type}
                                            value={identifier.value}
                                        />
                                    ))}
                                </>
                            ) : null}
                        </>
                    )}
                </OpuDetailSection>

                {canReadMatings ? (
                    <OpuDetailSection title="Fertilizações">
                        <Text style={styles.integrationText}>
                            Consulte as alocações vinculadas a esta coleta.
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Ver fertilizações da coleta"
                            onPress={() => navigation.navigate(MATING_ROUTES.LIST, {
                                oocyteCollectionId,
                            })}
                            style={styles.correctButton}
                        >
                            <Text style={styles.correctText}>Ver fertilizações</Text>
                        </Pressable>
                        {collection.status === 'COMPLETED' && canCreateMatings ? (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Criar nova alocação para a coleta"
                                onPress={() => navigation.navigate(
                                    MATING_ROUTES.BATCH_CREATE,
                                    { oocyteCollectionId }
                                )}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveText}>Nova alocação</Text>
                            </Pressable>
                        ) : null}
                    </OpuDetailSection>
                ) : null}

                <OpuDetailSection title="Proveniência">
                    <OpuDetailField
                        label="Origem"
                        value={getOpuOriginLabel(collection.provenance.originType)}
                    />
                    <OpuDetailField
                        label="Registrada em"
                        value={formatOpuTimestamp(collection.provenance.recordedAt)}
                    />
                    <OpuDetailField
                        label="Versão"
                        value={String(collection.version)}
                    />
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
        marginHorizontal: 20,
        marginBottom: 16,
    },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    status: { color: '#475569', fontSize: 15, fontWeight: '700', marginTop: 6 },
    correctButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 1, borderColor: '#092955', borderRadius: 24 },
    correctText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    correctionForm: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    formTitle: { color: '#092955', fontSize: 16, fontWeight: '700' },
    input: { minHeight: 48, marginTop: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 15 },
    multiline: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' },
    error: { color: '#9F1239', fontSize: 14, lineHeight: 20, marginTop: 10 },
    saveButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderRadius: 24, backgroundColor: '#092955' },
    saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    editButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    editText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    integrationText: { color: '#475569', fontSize: 14, lineHeight: 20 },
})
