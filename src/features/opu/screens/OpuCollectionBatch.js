import React from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAnimalsQuery } from '../../animals/hooks/useAnimalQueries'
import {
    getAnimalName,
    getAnimalSexLabel,
    getAnimalStatusLabel,
} from '../../animals/animalPresentation'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import OpuStateMessage from '../components/OpuStateMessage'
import {
    useOpuSessionDetailQuery,
} from '../hooks/useOpuQueries'
import {
    isAmbiguousCommandError,
    isStaleCommandError,
    useOpuCollectionsDryRunMutation,
    useRecordOpuCollectionsMutation,
} from '../hooks/useOpuMutations'
import {
    createCollectionBatchIntent,
    createCollectionDraftItem,
    renewCollectionBatchIntent,
    updateCollectionBatchIntent,
    updateCollectionDraftItem,
} from '../opuIntents'
import {
    OPU_PERMISSIONS,
    hasOpuPermission,
} from '../opuPermissions'
import { getOpuCommandErrorMessage } from '../opuPresentation'
import { OPU_ROUTES } from '../routes'

const SEARCH_DELAY_MS = 500

const isEligibleAnimal = animal => (
    animal.sex === 'FEMALE' && animal.status === 'ACTIVE'
)

const DraftEditor = ({ item, disabled, onChange, onPickDate, onRemove }) => (
    <View style={styles.editor}>
        <Text style={styles.editorTitle}>Dados da coleta</Text>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar data e hora da coleta"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPickDate}
            style={styles.dateButton}
        >
            <Text style={styles.dateText}>
                {new Date(item.collectedAt).toLocaleString('pt-BR')}
            </Text>
        </Pressable>
        <TextInput
            accessibilityLabel="Total recuperado"
            editable={!disabled}
            keyboardType="number-pad"
            onChangeText={value => onChange({ totalRecovered: value })}
            placeholder="Total recuperado"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={String(item.totalRecovered)}
        />
        <TextInput
            accessibilityLabel="Oócitos viáveis"
            editable={!disabled}
            keyboardType="number-pad"
            onChangeText={value => onChange({ viable: value })}
            placeholder="Viáveis"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={String(item.viable)}
        />
        <TextInput
            accessibilityLabel="Folículos aspirados"
            editable={!disabled}
            keyboardType="number-pad"
            onChangeText={value => onChange({ folliclesAspirated: value })}
            placeholder="Folículos aspirados (opcional)"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={String(item.folliclesAspirated)}
        />
        <TextInput
            accessibilityLabel="Observações da coleta"
            editable={!disabled}
            maxLength={2000}
            multiline
            onChangeText={value => onChange({ notes: value })}
            placeholder="Observações (opcional)"
            placeholderTextColor="#64748B"
            style={[styles.input, styles.notes]}
            value={item.notes}
        />
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover coleta do draft"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onRemove}
            style={styles.removeButton}
        >
            <Text style={styles.removeText}>Remover coleta</Text>
        </Pressable>
    </View>
)

export default function OpuCollectionBatch({ navigation, route }) {
    const opuSessionId = route.params?.opuSessionId
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const [items, setItems] = React.useState([])
    const [selectedItemId, setSelectedItemId] = React.useState(null)
    const [datePickerVisible, setDatePickerVisible] = React.useState(false)
    const [batchIntent, setBatchIntent] = React.useState(null)
    const [preview, setPreview] = React.useState(null)
    const [validatedDraftRevision, setValidatedDraftRevision] = React.useState(null)
    const [validationMessage, setValidationMessage] = React.useState(null)
    const [bulkAttempted, setBulkAttempted] = React.useState(false)
    const draftRevisionRef = React.useRef(0)
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canWrite = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.WRITE
    )
    const canReadAnimals = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.MASTER_DATA_READ
    )
    const sessionQuery = useOpuSessionDetailQuery({
        organizationId: activeOrganizationId,
        opuSessionId,
        enabled: effectiveContextQuery.isSuccess && canWrite,
    })
    const animalsQuery = useAnimalsQuery({
        organizationId: activeOrganizationId,
        query,
        enabled: effectiveContextQuery.isSuccess && canWrite && canReadAnimals &&
            sessionQuery.data?.status === 'IN_PROGRESS',
    })
    const dryRunMutation = useOpuCollectionsDryRunMutation()
    const bulkMutation = useRecordOpuCollectionsMutation({
        organizationId: activeOrganizationId,
        opuSessionId,
    })
    const selectedItem = items.find(item => item.itemId === selectedItemId) ?? null
    const ambiguousBulk = isAmbiguousCommandError(bulkMutation.error)
    const draftLocked = bulkMutation.isPending || (bulkAttempted && ambiguousBulk)
    const dryRunIsCurrent = Boolean(preview) &&
        preview.batchId === batchIntent?.payload.batchId &&
        validatedDraftRevision === draftRevisionRef.current
    const canRecordBatch = dryRunIsCurrent &&
        preview.items.every(item => item.status === 'VALID')

    React.useEffect(() => {
        const timeout = setTimeout(() => setQuery(searchText.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [searchText])

    const invalidateDraftValidation = () => {
        draftRevisionRef.current += 1
        setValidatedDraftRevision(null)
        setPreview(null)
        dryRunMutation.reset()

        if (bulkAttempted) {
            setBatchIntent(null)
            setBulkAttempted(false)
            bulkMutation.reset()
        }
    }

    const changeDraft = (itemId, changes) => {
        if (draftLocked) {
            return
        }

        setItems(current => current.map(item => (
            item.itemId === itemId
                ? updateCollectionDraftItem(item, changes)
                : item
        )))
        invalidateDraftValidation()
    }

    const addDonor = (animal) => {
        if (!isEligibleAnimal(animal) ||
            items.some(item => item.donorId === animal.id) ||
            items.length >= 100) {
            return
        }

        const item = createCollectionDraftItem({
            donorId: animal.id,
            donorName: getAnimalName(animal),
            collectedAt: new Date().toISOString(),
        })
        setItems(current => [...current, item])
        setSelectedItemId(item.itemId)
        invalidateDraftValidation()
    }

    const prepareIntent = ({
        renew = false,
        expectedVersion = sessionQuery.data.version,
    } = {}) => {
        if (items.length === 0) {
            throw new TypeError('Adicione ao menos uma coleta.')
        }

        if (renew && batchIntent) {
            return renewCollectionBatchIntent(batchIntent, {
                expectedSessionVersion: expectedVersion,
                items,
            })
        }

        if (batchIntent) {
            return updateCollectionBatchIntent(batchIntent, {
                expectedSessionVersion: expectedVersion,
                items,
            })
        }

        return createCollectionBatchIntent({
            opuSessionId,
            expectedSessionVersion: expectedVersion,
            items,
        })
    }

    const runDryRun = ({ renew = false, expectedVersion } = {}) => {
        try {
            const intent = prepareIntent({ renew, expectedVersion })
            const draftRevision = draftRevisionRef.current
            setBatchIntent(intent)
            setValidationMessage(null)
            setValidatedDraftRevision(null)
            setPreview(null)
            dryRunMutation.mutate(intent, {
                onSuccess: (result) => {
                    if (draftRevisionRef.current === draftRevision) {
                        setPreview(result)
                        setValidatedDraftRevision(draftRevision)
                    }
                },
            })
        } catch (error) {
            setValidationMessage(
                error.message === 'Adicione ao menos uma coleta.'
                    ? error.message
                    : 'Revise os counts. Use somente inteiros não negativos e mantenha viáveis até o total recuperado.'
            )
        }
    }

    const recordBatch = () => {
        if (!batchIntent || !canRecordBatch) {
            setValidationMessage('Valide todos os itens antes de registrar o lote.')
            return
        }

        setBulkAttempted(true)
        bulkMutation.mutate(batchIntent, {
            onSuccess: () => navigation.replace(OPU_ROUTES.DETAIL, {
                opuSessionId,
            }),
        })
    }

    if (!opuSessionId) {
        return <OpuStateMessage message="OPU não identificada." />
    }

    if (effectiveContextQuery.isPending || sessionQuery.isPending) {
        return (
            <SafeAreaView style={styles.screen}>
                <ActivityIndicator color="#092955" size="large" style={styles.loading} />
            </SafeAreaView>
        )
    }

    if (!canWrite || !canReadAnimals) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Você não tem permissão para registrar coletas ou consultar animais." />
            </SafeAreaView>
        )
    }

    if (sessionQuery.error || !sessionQuery.data) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage
                    message="Não foi possível carregar a OPU."
                    onRetry={() => void sessionQuery.refetch()}
                />
            </SafeAreaView>
        )
    }

    if (sessionQuery.data.status !== 'IN_PROGRESS') {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="As coletas só podem ser registradas enquanto a OPU está em andamento." />
            </SafeAreaView>
        )
    }

    const animals = animalsQuery.data?.pages.flatMap(page => page.items) ?? []
    const resultByItem = new Map(
        preview?.items.map(result => [result.itemId, result]) ?? []
    )

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text accessibilityRole="header" style={styles.title}>Coletas da OPU</Text>
                <Text style={styles.subtitle}>Selecione Animals doadores e valide o lote antes de gravar.</Text>

                <TextInput
                    accessibilityLabel="Buscar Animal doador"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!draftLocked}
                    maxLength={200}
                    onChangeText={setSearchText}
                    placeholder="Nome ou identificador ativo"
                    placeholderTextColor="#64748B"
                    style={styles.search}
                    value={searchText}
                />
                {animalsQuery.isPending ? (
                    <ActivityIndicator color="#092955" style={styles.inlineLoading} />
                ) : (
                    <FlatList
                        data={animals}
                        horizontal
                        keyExtractor={animal => animal.id}
                        onEndReached={() => {
                            if (animalsQuery.hasNextPage && !animalsQuery.isFetchingNextPage) {
                                void animalsQuery.fetchNextPage()
                            }
                        }}
                        renderItem={({ item: animal }) => {
                            const eligible = isEligibleAnimal(animal)
                            const alreadyAdded = items.some(item => item.donorId === animal.id)

                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`${getAnimalName(animal)}, ${eligible ? 'elegível' : 'não elegível'}`}
                                    accessibilityState={{ disabled: !eligible || alreadyAdded || draftLocked }}
                                    disabled={!eligible || alreadyAdded || draftLocked}
                                    onPress={() => addDonor(animal)}
                                    style={[styles.animalCard, (!eligible || alreadyAdded) && styles.disabled]}
                                >
                                    <Text style={styles.animalName}>{getAnimalName(animal)}</Text>
                                    <Text style={styles.animalInfo}>
                                        {getAnimalSexLabel(animal.sex)} · {getAnimalStatusLabel(animal.status)}
                                    </Text>
                                    {alreadyAdded ? <Text style={styles.added}>Adicionada</Text> : null}
                                </Pressable>
                            )
                        }}
                        showsHorizontalScrollIndicator={false}
                    />
                )}

                <Text style={styles.sectionTitle}>Draft local ({items.length}/100)</Text>
                {items.length === 0 ? (
                    <Text style={styles.empty}>Nenhuma doadora adicionada.</Text>
                ) : items.map((item, index) => {
                    const result = resultByItem.get(item.itemId)

                    return (
                        <Pressable
                            key={item.itemId}
                            accessibilityRole="button"
                            accessibilityLabel={`Editar coleta ${index + 1}`}
                            onPress={() => setSelectedItemId(item.itemId)}
                            style={[
                                styles.draftRow,
                                selectedItemId === item.itemId && styles.selectedRow,
                            ]}
                        >
                            <View style={styles.draftHeading}>
                                <Text style={styles.draftTitle}>Coleta {index + 1}</Text>
                                {result ? (
                                    <Text style={result.status === 'VALID'
                                        ? styles.valid
                                        : styles.rejected}>
                                        {result.status === 'VALID' ? 'Válida' : result.errorCode}
                                    </Text>
                                ) : null}
                            </View>
                            <Text style={styles.draftInfo}>Animal: {item.donorName}</Text>
                        </Pressable>
                    )
                })}

                {selectedItem ? (
                    <DraftEditor
                        disabled={draftLocked}
                        item={selectedItem}
                        onChange={changes => changeDraft(selectedItem.itemId, changes)}
                        onPickDate={() => setDatePickerVisible(true)}
                        onRemove={() => {
                            setItems(current => current.filter(
                                item => item.itemId !== selectedItem.itemId
                            ))
                            setSelectedItemId(null)
                            invalidateDraftValidation()
                        }}
                    />
                ) : null}

                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.error}>{validationMessage}</Text>
                ) : null}
                {dryRunMutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getOpuCommandErrorMessage(dryRunMutation.error)}
                    </Text>
                ) : null}
                {bulkMutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getOpuCommandErrorMessage(bulkMutation.error)}
                    </Text>
                ) : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: dryRunMutation.isPending, disabled: draftLocked || dryRunMutation.isPending }}
                    disabled={draftLocked || dryRunMutation.isPending}
                    onPress={() => runDryRun()}
                    style={[styles.secondaryButton, (draftLocked || dryRunMutation.isPending) && styles.disabled]}
                >
                    <Text style={styles.secondaryText}>
                        {dryRunMutation.isPending ? 'Validando...' : 'Validar lote'}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Registrar lote atômico"
                    accessibilityState={{ busy: bulkMutation.isPending, disabled: bulkMutation.isPending || !canRecordBatch }}
                    disabled={bulkMutation.isPending || !canRecordBatch}
                    onPress={recordBatch}
                    style={[styles.primaryButton, (bulkMutation.isPending || !canRecordBatch) && styles.disabled]}
                >
                    <Text style={styles.primaryText}>
                        {bulkMutation.isPending
                            ? 'Registrando lote...'
                            : ambiguousBulk
                                ? 'Tentar novamente com os mesmos IDs'
                                : 'Registrar lote atômico'}
                    </Text>
                </Pressable>
                {isStaleCommandError(bulkMutation.error) ? (
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                            void sessionQuery.refetch().then((result) => {
                                if (result.data) {
                                    runDryRun({
                                        renew: true,
                                        expectedVersion: result.data.version,
                                    })
                                }
                            })
                        }}
                        style={styles.reconcileButton}
                    >
                        <Text style={styles.reconcileText}>Recarregar e criar nova intenção para revisão</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
            <DateTimePickerModal
                date={selectedItem ? new Date(selectedItem.collectedAt) : new Date()}
                isVisible={datePickerVisible}
                mode="datetime"
                onCancel={() => setDatePickerVisible(false)}
                onConfirm={(date) => {
                    if (selectedItem) {
                        changeDraft(selectedItem.itemId, { collectedAt: date.toISOString() })
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
    loading: { flex: 1 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 6 },
    search: {
        minHeight: 48,
        marginTop: 16,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 16,
    },
    inlineLoading: { marginVertical: 24 },
    animalCard: {
        width: 190,
        minHeight: 90,
        marginTop: 12,
        marginRight: 10,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    animalName: { color: '#092955', fontSize: 15, fontWeight: '700' },
    animalInfo: { color: '#475569', fontSize: 13, marginTop: 6 },
    added: { color: '#166534', fontSize: 13, fontWeight: '700', marginTop: 6 },
    sectionTitle: { color: '#092955', fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 8 },
    empty: { color: '#475569', fontSize: 14 },
    draftRow: { padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#FFFFFF' },
    selectedRow: { borderWidth: 2, borderColor: '#092955' },
    draftHeading: { flexDirection: 'row', justifyContent: 'space-between' },
    draftTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
    draftInfo: { color: '#475569', fontSize: 13, marginTop: 5 },
    valid: { color: '#166534', fontSize: 12, fontWeight: '700' },
    rejected: { color: '#9F1239', fontSize: 12, fontWeight: '700' },
    editor: { marginTop: 14, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' },
    editorTitle: { color: '#092955', fontSize: 17, fontWeight: '700' },
    dateButton: { minHeight: 48, justifyContent: 'center', marginTop: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8 },
    dateText: { color: '#0F172A', fontSize: 15 },
    input: { minHeight: 48, marginTop: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, color: '#0F172A', fontSize: 15 },
    notes: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
    removeButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    removeText: { color: '#9F1239', fontSize: 14, fontWeight: '700' },
    error: { color: '#9F1239', fontSize: 14, lineHeight: 20, marginTop: 12 },
    primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 26, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
    secondaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#092955', borderRadius: 25 },
    secondaryText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    reconcileButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    reconcileText: { color: '#092955', fontSize: 14, fontWeight: '700', textAlign: 'center' },
    disabled: { opacity: 0.5 },
})
