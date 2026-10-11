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

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useMatingDetailQuery } from '../../fertilization/hooks/useMatingQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { EmbryoState } from '../components/EmbryoElements'
import {
    createEmbryoBatchIntent,
    createEmbryoDraftItem,
    markEmbryoBatchIntentSent,
    renewEmbryoDraftItems,
    updateEmbryoDraftItem,
} from '../embryoIntents'
import {
    EMBRYO_PERMISSIONS,
    hasEmbryoPermission,
} from '../embryoPermissions'
import {
    formatEmbryoTimestamp,
    getEmbryoCommandErrorMessage,
} from '../embryoPresentation'
import {
    isAmbiguousEmbryoCommandError,
    isEmbryoConcurrencyError,
    useIdentifyEmbryosMutation,
} from '../hooks/useEmbryoMutations'
import { useEmbryosQuery } from '../hooks/useEmbryoQueries'
import { EMBRYO_ROUTES } from '../routes'

function DraftEditor({
    disabled,
    index,
    item,
    onChange,
    onPickDate,
    onRemove,
}) {
    return (
        <View style={styles.editor}>
            <Text accessibilityRole="header" style={styles.editorTitle}>
                Embrião {index + 1}
            </Text>
            <TextInput
                accessibilityLabel={`Código do embrião ${index + 1}`}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!disabled}
                maxLength={160}
                onChangeText={humanCode => onChange({ humanCode })}
                placeholder="Código único na organização"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={item.humanCode}
            />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Alterar data de identificação do embrião ${index + 1}`}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={onPickDate}
                style={styles.dateButton}
            >
                <Text style={styles.dateText}>
                    Identificado em {formatEmbryoTimestamp(item.identifiedAt)}
                </Text>
            </Pressable>
            <Text style={styles.ownerText}>Proprietário: não informado</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover embrião ${index + 1} do lote`}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={onRemove}
                style={styles.removeButton}
            >
                <Text style={styles.removeText}>Remover</Text>
            </Pressable>
        </View>
    )
}

export default function EmbryoBatchIdentify({ navigation, route }) {
    const matingId = route.params?.matingId
    const { activeOrganizationId } = useOrganization()
    const [items, setItems] = React.useState([])
    const [selectedItemId, setSelectedItemId] = React.useState(null)
    const [datePickerVisible, setDatePickerVisible] = React.useState(false)
    const [attempted, setAttempted] = React.useState(false)
    const [validationMessage, setValidationMessage] = React.useState(null)
    const pendingIntentRef = React.useRef(null)
    const draftOrganizationRef = React.useRef(activeOrganizationId)
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canWrite = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.WRITE
    )
    const canReadMating = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.MATING_READ
    )
    const allowed = canWrite && canReadMating
    const matingQuery = useMatingDetailQuery({
        organizationId: activeOrganizationId,
        matingId,
        enabled: effectiveContextQuery.isSuccess && allowed,
    })
    const embryosQuery = useEmbryosQuery({
        organizationId: activeOrganizationId,
        matingId,
        size: 100,
        enabled: effectiveContextQuery.isSuccess && allowed &&
            matingQuery.data?.mating.status === 'FERTILIZED',
    })
    const mutation = useIdentifyEmbryosMutation({
        organizationId: activeOrganizationId,
        matingId,
    })

    React.useEffect(() => {
        if (draftOrganizationRef.current === activeOrganizationId) {
            return
        }

        draftOrganizationRef.current = activeOrganizationId
        pendingIntentRef.current = null
        setItems([])
        setSelectedItemId(null)
        setDatePickerVisible(false)
        setAttempted(false)
        setValidationMessage(null)
        mutation.reset()
    }, [activeOrganizationId, mutation.reset])
    const ambiguous = isAmbiguousEmbryoCommandError(mutation.error)
    const sameIntentRetry = ambiguous ||
        mutation.error?.code === 'COMMAND_IN_PROGRESS'
    const concurrencyConflict = isEmbryoConcurrencyError(mutation.error)
    const draftLocked = attempted || mutation.isPending
    const loadedEmbryos = embryosQuery.data?.pages.flatMap(page => page.items) ?? []
    const completeCountRead = embryosQuery.isSuccess && !embryosQuery.hasNextPage
    const apparentRemaining = completeCountRead && matingQuery.data
        ? Math.max(
            0,
            matingQuery.data.mating.allocatedOocytes - loadedEmbryos.length
        )
        : null
    const selectedItem = items.find(item => item.itemId === selectedItemId) ?? null

    const addItem = () => {
        if (draftLocked || items.length >= 200) {
            return
        }

        setItems(current => [...current, createEmbryoDraftItem({ matingId })])
        setValidationMessage(null)
    }

    const changeItem = (itemId, changes) => {
        if (draftLocked) {
            return
        }

        setItems(current => current.map(item => (
            item.itemId === itemId
                ? updateEmbryoDraftItem(item, changes)
                : item
        )))
        setValidationMessage(null)
    }

    const removeItem = itemId => {
        if (draftLocked) {
            return
        }

        setItems(current => current.filter(item => item.itemId !== itemId))
        setValidationMessage(null)
    }

    const submit = () => {
        let intent = pendingIntentRef.current

        if (!intent) {
            try {
                intent = markEmbryoBatchIntentSent(
                    createEmbryoBatchIntent(items)
                )
                pendingIntentRef.current = intent
                setAttempted(true)
            } catch {
                setValidationMessage(
                    'Inclua de um a duzentos embriões com código e data válidos.'
                )
                return
            }
        }

        setValidationMessage(null)
        mutation.mutate(intent, {
            onSuccess: () => navigation.replace(EMBRYO_ROUTES.LIST, {
                matingId,
            }),
        })
    }

    const createNewIntentionForEditing = () => {
        setItems(current => renewEmbryoDraftItems(current))
        pendingIntentRef.current = null
        setAttempted(false)
        setValidationMessage(null)
        mutation.reset()
    }

    const reconcileConflict = async () => {
        await Promise.all([
            matingQuery.refetch(),
            embryosQuery.refetch(),
        ])
        createNewIntentionForEditing()
    }

    if (!matingId) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Fertilização não identificada." />
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isPending || (allowed && matingQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState loading message="Carregando fertilização" />
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !allowed) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Você não tem as permissões necessárias para identificar embriões." />
            </SafeAreaView>
        )
    }

    if (matingQuery.error || !matingQuery.data) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState
                    message="Não foi possível carregar a fertilização."
                    onRetry={() => void matingQuery.refetch()}
                />
            </SafeAreaView>
        )
    }

    if (matingQuery.data.mating.status !== 'FERTILIZED') {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="A fertilização não está aberta para identificação de embriões." />
            </SafeAreaView>
        )
    }

    const commandMessage = getEmbryoCommandErrorMessage(mutation.error)

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    Identificar embriões
                </Text>
                <Text style={styles.subtitle}>
                    O lote é gravado integralmente ou não grava nenhum item.
                </Text>

                <View style={styles.capacityCard}>
                    <Text style={styles.capacityTitle}>Capacidade informativa</Text>
                    <Text style={styles.capacityText}>
                        Oócitos alocados: {matingQuery.data.mating.allocatedOocytes}
                    </Text>
                    <Text style={styles.capacityText}>
                        Embriões carregados: {loadedEmbryos.length}
                    </Text>
                    <Text style={styles.capacityText}>
                        {apparentRemaining == null
                            ? 'Há mais páginas possíveis; o saldo não é definitivo.'
                            : `Capacidade aparente restante: ${apparentRemaining}`}
                    </Text>
                    <Text style={styles.capacityNotice}>
                        O backend recalcula a capacidade sob lock no envio.
                    </Text>
                    {embryosQuery.hasNextPage ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Carregar mais embriões existentes"
                            accessibilityState={{
                                busy: embryosQuery.isFetchingNextPage,
                                disabled: embryosQuery.isFetchingNextPage,
                            }}
                            disabled={embryosQuery.isFetchingNextPage}
                            onPress={() => void embryosQuery.fetchNextPage()}
                            style={styles.loadButton}
                        >
                            <Text style={styles.loadText}>Carregar mais existentes</Text>
                        </Pressable>
                    ) : null}
                </View>

                <View style={styles.draftHeader}>
                    <Text accessibilityRole="header" style={styles.draftTitle}>
                        Lote local ({items.length}/200)
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Adicionar embrião ao lote"
                        accessibilityState={{
                            disabled: draftLocked || items.length >= 200,
                        }}
                        disabled={draftLocked || items.length >= 200}
                        onPress={addItem}
                        style={styles.addButton}
                    >
                        <Text style={styles.addText}>Adicionar</Text>
                    </Pressable>
                </View>

                {items.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhum embrião no lote.</Text>
                ) : items.map((item, index) => (
                    <DraftEditor
                        key={item.itemId}
                        disabled={draftLocked}
                        index={index}
                        item={item}
                        onChange={changes => changeItem(item.itemId, changes)}
                        onPickDate={() => {
                            setSelectedItemId(item.itemId)
                            setDatePickerVisible(true)
                        }}
                        onRemove={() => removeItem(item.itemId)}
                    />
                ))}

                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                        {validationMessage}
                    </Text>
                ) : null}
                {commandMessage ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                        {commandMessage}
                    </Text>
                ) : null}

                {concurrencyConflict ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recarregar fertilização e revisar nova intenção"
                        onPress={() => void reconcileConflict()}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                    </Pressable>
                ) : attempted && mutation.isError && !sameIntentRetry ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Editar como nova intenção"
                        onPress={createNewIntentionForEditing}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Registrar lote atômico de embriões"
                    accessibilityHint="Envia todos os itens como uma única operação"
                    accessibilityState={{
                        busy: mutation.isPending,
                        disabled: mutation.isPending || items.length === 0 ||
                            (attempted && !sameIntentRetry),
                    }}
                    disabled={mutation.isPending || items.length === 0 ||
                        (attempted && !sameIntentRetry)}
                    onPress={submit}
                    style={styles.submitButton}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitText}>
                            {sameIntentRetry
                                ? 'Tentar novamente a mesma intenção'
                                : 'Registrar lote atômico'}
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
            <DateTimePickerModal
                date={selectedItem
                    ? new Date(selectedItem.identifiedAt)
                    : new Date()}
                isVisible={datePickerVisible}
                mode="datetime"
                onCancel={() => setDatePickerVisible(false)}
                onConfirm={(date) => {
                    if (selectedItemId) {
                        changeItem(selectedItemId, {
                            identifiedAt: date.toISOString(),
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
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 4 },
    capacityCard: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    capacityTitle: { color: '#092955', fontSize: 17, fontWeight: '700' },
    capacityText: { color: '#475569', fontSize: 14, marginTop: 6 },
    capacityNotice: { color: '#92400E', fontSize: 13, marginTop: 8 },
    loadButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    loadText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    draftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    draftTitle: { color: '#092955', fontSize: 18, fontWeight: '700' },
    addButton: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 22,
        backgroundColor: '#092955',
    },
    addText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    emptyText: { color: '#64748B', fontSize: 14, marginTop: 18 },
    editor: {
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    editorTitle: { color: '#092955', fontSize: 16, fontWeight: '700' },
    input: {
        minHeight: 48,
        marginTop: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        color: '#0F172A',
        fontSize: 16,
    },
    dateButton: {
        minHeight: 48,
        justifyContent: 'center',
        marginTop: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
    },
    dateText: { color: '#0F172A', fontSize: 14 },
    ownerText: { color: '#64748B', fontSize: 13, marginTop: 10 },
    removeButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    removeText: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
    errorText: { color: '#B91C1C', fontSize: 14, lineHeight: 20, marginTop: 14 },
    secondaryButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#092955',
        borderRadius: 24,
    },
    secondaryText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    submitButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        borderRadius: 25,
        backgroundColor: '#092955',
    },
    submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})
