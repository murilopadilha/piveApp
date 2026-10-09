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
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAnimalDetailQuery } from '../../animals/hooks/useAnimalQueries'
import { getAnimalName } from '../../animals/animalPresentation'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import OpuLookupModal from '../../opu/components/OpuLookupModal'
import { useProfessionalsLookup } from '../../opu/hooks/useOpuLookupQueries'
import { useOocyteCollectionDetailQuery } from '../../opu/hooks/useOpuQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    useExternalEstablishmentDetailQuery,
    useSemenBatchDetailQuery,
} from '../../semen/hooks/useSemenQueries'
import SemenBatchSelectorModal from '../components/SemenBatchSelectorModal'
import {
    isAmbiguousMatingCommandError,
    isMatingConcurrencyError,
    useAllocateMatingsMutation,
} from '../hooks/useMatingMutations'
import { useMatingsQuery } from '../hooks/useMatingQueries'
import {
    createMatingBatchIntent,
    createMatingDraftItem,
    markMatingBatchIntentSent,
    renewMatingDraftItems,
    updateMatingDraftItem,
} from '../matingIntents'
import {
    MATING_PERMISSIONS,
    canAllocateMatings,
    hasMatingPermission,
} from '../matingPermissions'
import { getMatingCommandErrorMessage } from '../matingPresentation'
import { MATING_ROUTES } from '../routes'

const DraftEditor = ({
    item,
    disabled,
    sire,
    producer,
    onChange,
    onPickDate,
    onPickProfessional,
    onRemove,
}) => (
    <View style={styles.editor}>
        <Text accessibilityRole="header" style={styles.editorTitle}>Dados da alocação</Text>
        <Text style={styles.reviewText}>Lote: {item.semenBatchCode}</Text>
        <Text style={styles.reviewText}>Reprodutor: {sire ? getAnimalName(sire) : 'Carregando ou indisponível'}</Text>
        <Text style={styles.reviewText}>Produtor: {producer?.name ?? 'Carregando ou indisponível'}</Text>
        <TextInput
            accessibilityLabel="Oócitos alocados"
            editable={!disabled}
            keyboardType="number-pad"
            onChangeText={value => onChange({ allocatedOocytes: value })}
            placeholder="Quantidade maior que zero"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={String(item.allocatedOocytes)}
        />
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar data e hora da fertilização"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPickDate}
            style={styles.selectButton}
        >
            <Text style={styles.selectText}>
                Fertilização: {new Date(item.fertilizedAt).toLocaleString('pt-BR')}
            </Text>
        </Pressable>
        <TextInput
            accessibilityLabel="Método de fertilização"
            autoCapitalize="characters"
            editable={!disabled}
            maxLength={48}
            onChangeText={value => onChange({ method: value })}
            placeholder="Método"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={item.method}
        />
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Profissional responsável: ${item.responsibleProfessionalName ?? 'não informado'}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPickProfessional}
            style={styles.selectButton}
        >
            <Text style={styles.selectText}>
                Profissional: {item.responsibleProfessionalName ?? 'Não informado'}
            </Text>
        </Pressable>
        {item.responsibleProfessionalId ? (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remover profissional responsável"
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => onChange({
                    responsibleProfessionalId: null,
                    responsibleProfessionalName: null,
                })}
                style={styles.clearButton}
            >
                <Text style={styles.clearText}>Remover profissional</Text>
            </Pressable>
        ) : null}
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover alocação do lote"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onRemove}
            style={styles.removeButton}
        >
            <Text style={styles.removeText}>Remover alocação</Text>
        </Pressable>
    </View>
)

export default function MatingBatchCreate({ navigation, route }) {
    const oocyteCollectionId = route.params?.oocyteCollectionId
    const { activeOrganizationId } = useOrganization()
    const [items, setItems] = React.useState([])
    const [selectedItemId, setSelectedItemId] = React.useState(null)
    const [semenSelectorVisible, setSemenSelectorVisible] = React.useState(false)
    const [professionalSelectorVisible, setProfessionalSelectorVisible] = React.useState(false)
    const [professionalQuery, setProfessionalQuery] = React.useState('')
    const [datePickerVisible, setDatePickerVisible] = React.useState(false)
    const [attempted, setAttempted] = React.useState(false)
    const [validationMessage, setValidationMessage] = React.useState(null)
    const pendingIntentRef = React.useRef(null)
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canWrite = canAllocateMatings(effectiveContextQuery.data)
    const canReadSemen = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.SEMEN_READ
    )
    const canReadMasterData = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.MASTER_DATA_READ
    )
    const allowed = canWrite && canReadSemen && canReadMasterData
    const collectionQuery = useOocyteCollectionDetailQuery({
        organizationId: activeOrganizationId,
        oocyteCollectionId,
        enabled: effectiveContextQuery.isSuccess && allowed,
    })
    const matingsQuery = useMatingsQuery({
        organizationId: activeOrganizationId,
        collectionId: oocyteCollectionId,
        size: 100,
        enabled: effectiveContextQuery.isSuccess && allowed &&
            collectionQuery.data?.status === 'COMPLETED',
    })
    const selectedItem = items.find(item => item.itemId === selectedItemId) ?? null
    const selectedBatchQuery = useSemenBatchDetailQuery({
        organizationId: activeOrganizationId,
        semenBatchId: selectedItem?.semenBatchId,
        enabled: Boolean(selectedItem),
    })
    const sireQuery = useAnimalDetailQuery({
        organizationId: activeOrganizationId,
        animalId: selectedBatchQuery.data?.sireId,
        enabled: Boolean(selectedBatchQuery.data?.sireId),
    })
    const producerQuery = useExternalEstablishmentDetailQuery({
        organizationId: activeOrganizationId,
        externalEstablishmentId: selectedBatchQuery.data?.producerEstablishmentId,
        enabled: Boolean(selectedBatchQuery.data?.producerEstablishmentId),
    })
    const professionalsQuery = useProfessionalsLookup({
        organizationId: activeOrganizationId,
        query: professionalQuery,
        enabled: professionalSelectorVisible && allowed,
    })
    const mutation = useAllocateMatingsMutation({
        organizationId: activeOrganizationId,
        oocyteCollectionId,
    })
    const ambiguous = isAmbiguousMatingCommandError(mutation.error)
    const sameIntentRetry = ambiguous ||
        mutation.error?.code === 'COMMAND_IN_PROGRESS'
    const concurrencyConflict = isMatingConcurrencyError(mutation.error)
    const draftLocked = attempted || mutation.isPending
    const loadedMatings = matingsQuery.data?.pages.flatMap(page => page.items) ?? []
    const loadedAllocation = loadedMatings.reduce(
        (sum, mating) => sum + (
            mating.status === 'CANCELLED' ? 0 : mating.allocatedOocytes
        ),
        0
    )
    const completeAllocationRead = matingsQuery.isSuccess &&
        !matingsQuery.hasNextPage
    const knownRemaining = completeAllocationRead
        ? Math.max(0, (collectionQuery.data?.viable ?? 0) - loadedAllocation)
        : null

    const changeDraft = (itemId, changes) => {
        if (draftLocked) {
            return
        }

        setItems(current => current.map(item => (
            item.itemId === itemId
                ? updateMatingDraftItem(item, changes)
                : item
        )))
        setValidationMessage(null)
    }

    const addBatch = (batch) => {
        if (draftLocked || items.length >= 100 || batch.status !== 'ACTIVE') {
            return
        }

        const item = createMatingDraftItem({
            collectionId: oocyteCollectionId,
            semenBatchId: batch.id,
            semenBatchCode: batch.batchCode,
            fertilizedAt: new Date().toISOString(),
        })
        setItems(current => [...current, item])
        setSelectedItemId(item.itemId)
        setSemenSelectorVisible(false)
    }

    const submit = () => {
        let intent = pendingIntentRef.current

        if (!intent) {
            try {
                intent = markMatingBatchIntentSent(createMatingBatchIntent({
                    items,
                    collectedAt: collectionQuery.data.collectedAt,
                }))
                pendingIntentRef.current = intent
                setAttempted(true)
            } catch {
                setValidationMessage('Revise quantidade, data de fertilização e método em todas as alocações.')
                return
            }
        }

        setValidationMessage(null)
        mutation.mutate(intent, {
            onSuccess: () => navigation.replace(MATING_ROUTES.LIST, {
                oocyteCollectionId,
            }),
        })
    }

    const createNewIntentionForEditing = () => {
        const selectedIndex = items.findIndex(
            item => item.itemId === selectedItemId
        )
        const renewedItems = renewMatingDraftItems(items)

        setItems(renewedItems)
        setSelectedItemId(renewedItems[selectedIndex]?.itemId ?? null)
        pendingIntentRef.current = null
        setAttempted(false)
        setValidationMessage(null)
        mutation.reset()
    }

    const reconcileConflict = async () => {
        await Promise.all([
            collectionQuery.refetch(),
            matingsQuery.refetch(),
        ])
        createNewIntentionForEditing()
    }

    if (!oocyteCollectionId) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="alert" style={styles.centered}>
                    <Text style={styles.message}>Coleta de oócitos não identificada.</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isPending || (allowed && collectionQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="progressbar" accessibilityLabel="Carregando coleta" style={styles.centered}>
                    <ActivityIndicator color="#092955" size="large" />
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !allowed) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="alert" style={styles.centered}>
                    <Text style={styles.message}>Você não tem as permissões necessárias para registrar alocações.</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (collectionQuery.error || !collectionQuery.data) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="alert" style={styles.centered}>
                    <Text style={styles.message}>Não foi possível carregar a coleta de oócitos.</Text>
                    <Pressable accessibilityRole="button" onPress={() => void collectionQuery.refetch()} style={styles.primaryButton}>
                        <Text style={styles.primaryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        )
    }

    if (collectionQuery.data.status !== 'COMPLETED') {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="alert" style={styles.centered}>
                    <Text style={styles.message}>A coleta precisa estar concluída para receber fertilizações.</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text accessibilityRole="header" style={styles.title}>Nova alocação</Text>
                <Text style={styles.subtitle}>Revise o lote atômico antes de enviar. A capacidade final é confirmada pelo servidor.</Text>

                <View style={styles.capacityCard}>
                    <Text style={styles.capacityTitle}>Capacidade informativa</Text>
                    <Text style={styles.capacityText}>Viáveis na coleta: {collectionQuery.data.viable}</Text>
                    <Text style={styles.capacityText}>Alocados nas páginas carregadas: {loadedAllocation}</Text>
                    <Text style={styles.capacityText}>
                        {knownRemaining == null
                            ? 'Há mais alocações a carregar; o saldo não é exibido como definitivo.'
                            : `Saldo aparente: ${knownRemaining}`}
                    </Text>
                    <Text style={styles.capacityWarning}>O backend recalcula a capacidade sob lock no envio.</Text>
                    {matingsQuery.hasNextPage ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Carregar mais alocações para a estimativa"
                            accessibilityState={{ busy: matingsQuery.isFetchingNextPage }}
                            disabled={matingsQuery.isFetchingNextPage}
                            onPress={() => void matingsQuery.fetchNextPage()}
                            style={styles.inlineButton}
                        >
                            <Text style={styles.inlineText}>Carregar mais alocações</Text>
                        </Pressable>
                    ) : null}
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Adicionar lote de sêmen"
                    accessibilityState={{ disabled: draftLocked || items.length >= 100 }}
                    disabled={draftLocked || items.length >= 100}
                    onPress={() => setSemenSelectorVisible(true)}
                    style={[styles.secondaryButton, draftLocked && styles.disabled]}
                >
                    <Text style={styles.secondaryText}>Adicionar lote de sêmen</Text>
                </Pressable>

                <Text style={styles.sectionTitle}>Lote local ({items.length}/100)</Text>
                {items.length === 0 ? (
                    <Text style={styles.message}>Nenhuma alocação adicionada.</Text>
                ) : items.map((item, index) => (
                    <Pressable
                        key={item.itemId}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar alocação ${index + 1}, lote ${item.semenBatchCode}`}
                        accessibilityState={{ disabled: draftLocked }}
                        disabled={draftLocked}
                        onPress={() => setSelectedItemId(item.itemId)}
                        style={[
                            styles.draftRow,
                            selectedItemId === item.itemId && styles.selectedRow,
                        ]}
                    >
                        <Text style={styles.draftTitle}>Alocação {index + 1}</Text>
                        <Text style={styles.draftInfo}>Lote: {item.semenBatchCode}</Text>
                        <Text style={styles.draftInfo}>Quantidade: {item.allocatedOocytes || 'não informada'}</Text>
                    </Pressable>
                ))}

                {selectedItem ? (
                    <DraftEditor
                        disabled={draftLocked}
                        item={selectedItem}
                        producer={producerQuery.data}
                        sire={sireQuery.data}
                        onChange={changes => changeDraft(selectedItem.itemId, changes)}
                        onPickDate={() => setDatePickerVisible(true)}
                        onPickProfessional={() => setProfessionalSelectorVisible(true)}
                        onRemove={() => {
                            setItems(current => current.filter(
                                item => item.itemId !== selectedItem.itemId
                            ))
                            setSelectedItemId(null)
                        }}
                    />
                ) : null}

                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.error}>{validationMessage}</Text>
                ) : null}
                {mutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getMatingCommandErrorMessage(mutation.error)}
                    </Text>
                ) : null}

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Registrar lote atômico de fertilizações"
                    accessibilityState={{ busy: mutation.isPending, disabled: mutation.isPending || items.length === 0 }}
                    disabled={mutation.isPending || items.length === 0}
                    onPress={submit}
                    style={[styles.primaryButton, (mutation.isPending || items.length === 0) && styles.disabled]}
                >
                    <Text style={styles.primaryText}>
                        {mutation.isPending
                            ? 'Registrando...'
                            : sameIntentRetry
                                ? 'Tentar novamente com a mesma intenção'
                                : 'Registrar lote atômico'}
                    </Text>
                </Pressable>

                {concurrencyConflict ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recarregar capacidade e revisar nova intenção"
                        onPress={() => void reconcileConflict()}
                        style={styles.reconcileButton}
                    >
                        <Text style={styles.reconcileText}>Recarregar capacidade e revisar nova intenção</Text>
                    </Pressable>
                ) : attempted && mutation.isError &&
                    !sameIntentRetry && !concurrencyConflict &&
                    mutation.error?.code !== 'COMMAND_IN_PROGRESS' ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Editar como nova intenção"
                        onPress={createNewIntentionForEditing}
                        style={styles.reconcileButton}
                    >
                        <Text style={styles.reconcileText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}
            </ScrollView>

            <SemenBatchSelectorModal
                organizationId={activeOrganizationId}
                visible={semenSelectorVisible}
                onClose={() => setSemenSelectorVisible(false)}
                onSelect={addBatch}
            />
            <OpuLookupModal
                itemLabel={professional => professional.name}
                onClose={() => setProfessionalSelectorVisible(false)}
                onQueryChange={setProfessionalQuery}
                onSelect={(professional) => {
                    if (selectedItem) {
                        changeDraft(selectedItem.itemId, {
                            responsibleProfessionalId: professional.id,
                            responsibleProfessionalName: professional.name,
                        })
                    }
                    setProfessionalSelectorVisible(false)
                }}
                query={professionalsQuery}
                title="profissional"
                visible={professionalSelectorVisible}
            />
            <DateTimePickerModal
                date={selectedItem ? new Date(selectedItem.fertilizedAt) : new Date()}
                isVisible={datePickerVisible}
                mode="datetime"
                onCancel={() => setDatePickerVisible(false)}
                onConfirm={(date) => {
                    if (selectedItem) {
                        changeDraft(selectedItem.itemId, {
                            fertilizedAt: date.toISOString(),
                        })
                    }
                    setDatePickerVisible(false)
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { padding: 20, paddingBottom: 100 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 6 },
    message: { color: '#475569', fontSize: 15, textAlign: 'center', marginVertical: 16 },
    capacityCard: { marginTop: 18, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' },
    capacityTitle: { color: '#092955', fontSize: 17, fontWeight: '700', marginBottom: 8 },
    capacityText: { color: '#334155', fontSize: 14, marginTop: 4 },
    capacityWarning: { color: '#92400E', fontSize: 13, lineHeight: 18, marginTop: 10 },
    inlineButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 8 },
    inlineText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderWidth: 1, borderColor: '#092955', borderRadius: 24, backgroundColor: '#FFFFFF' },
    secondaryText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    sectionTitle: { color: '#092955', fontSize: 18, fontWeight: '700', marginTop: 22, marginBottom: 10 },
    draftRow: { marginBottom: 9, padding: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF' },
    selectedRow: { borderColor: '#092955', borderWidth: 2 },
    draftTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
    draftInfo: { color: '#475569', fontSize: 14, marginTop: 4 },
    editor: { marginTop: 14, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' },
    editorTitle: { color: '#092955', fontSize: 18, fontWeight: '700', marginBottom: 10 },
    reviewText: { color: '#334155', fontSize: 14, marginBottom: 5 },
    input: { minHeight: 48, marginTop: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, color: '#0F172A', fontSize: 16 },
    selectButton: { minHeight: 48, justifyContent: 'center', marginTop: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10 },
    selectText: { color: '#0F172A', fontSize: 15 },
    clearButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 },
    clearText: { color: '#475569', fontSize: 14, fontWeight: '600' },
    removeButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 10 },
    removeText: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
    primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingHorizontal: 20, borderRadius: 25, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
    reconcileButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: '#92400E', borderRadius: 24 },
    reconcileText: { color: '#92400E', fontSize: 14, fontWeight: '700', textAlign: 'center' },
    error: { color: '#B91C1C', fontSize: 14, lineHeight: 20, marginTop: 14 },
    disabled: { opacity: 0.5 },
})
