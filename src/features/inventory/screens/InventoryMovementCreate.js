import React from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { InventoryField, InventorySection, InventoryState } from '../components/InventoryElements'
import StorageLocationSelector from '../components/StorageLocationSelector'
import {
    isAmbiguousInventoryMovementError,
    isInventoryMovementConflict,
    useInventoryMovementMutation,
} from '../hooks/useInventoryMutations'
import {
    useEmbryoPackageDetailQuery,
    useStorageLocationsQuery,
} from '../hooks/useInventoryQueries'
import {
    createInventoryMovementIntent,
    markInventoryMovementIntentSent,
} from '../inventoryIntents'
import { INVENTORY_PERMISSIONS, hasInventoryPermission } from '../inventoryPermissions'
import {
    getInventoryCommandErrorMessage,
    getInventoryErrorMessage,
    getMovementTypeLabel,
} from '../inventoryPresentation'
import { INVENTORY_ROUTES } from '../routes'

const TYPE_HELP = Object.freeze({
    RECEIVE: 'Registra a entrada física de um package ainda sem localização.',
    STORE: 'Armazena um package ainda sem localização em um destino ativo.',
    MOVE: 'Move da localização atual para outro destino ativo.',
    WITHDRAW: 'Retira o package da localização atual, deixando-o sem localização.',
})

export default function InventoryMovementCreate({ navigation, route }) {
    const packageId = route.params?.packageId
    const { activeOrganizationId } = useOrganization()
    const [type, setType] = React.useState(null)
    const [destinationId, setDestinationId] = React.useState(null)
    const [occurredAt, setOccurredAt] = React.useState(() => new Date().toISOString())
    const [reason, setReason] = React.useState('')
    const [intent, setIntent] = React.useState(null)
    const [sent, setSent] = React.useState(false)
    const [localError, setLocalError] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.READ)
    const canWrite = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.WRITE)
    const packageQuery = useEmbryoPackageDetailQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const locationsQuery = useStorageLocationsQuery({
        organizationId: activeOrganizationId,
        enabled: contextQuery.isSuccess && canRead && canWrite,
    })
    const movementMutation = useInventoryMovementMutation({
        organizationId: activeOrganizationId,
        packageId,
    })

    React.useEffect(() => {
        setType(null)
        setDestinationId(null)
        setOccurredAt(new Date().toISOString())
        setReason('')
        setIntent(null)
        setSent(false)
        setLocalError(null)
        movementMutation.reset()
    }, [activeOrganizationId, packageId])

    const resetIntentionForEdit = React.useCallback(() => {
        if (intent || sent || movementMutation.isError) {
            setIntent(null)
            setSent(false)
            movementMutation.reset()
        }
        setLocalError(null)
    }, [intent, movementMutation, sent])
    const editField = setter => value => {
        resetIntentionForEdit()
        setter(value)
    }

    if (!packageId) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Package não identificado." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && packageQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><InventoryState loading message="Carregando package" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && (!canRead || !canWrite)) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Você não tem permissão para registrar movimentos." /></SafeAreaView>
    }
    const mainError = getInventoryErrorMessage(contextQuery.error ?? packageQuery.error)
    if (mainError || !packageQuery.data) {
        return <SafeAreaView style={styles.screen}><InventoryState message={mainError ?? 'Não foi possível carregar o package.'} onRetry={() => void packageQuery.refetch()} /></SafeAreaView>
    }

    const packageItem = packageQuery.data
    if (packageItem.status !== 'SEALED') {
        return <SafeAreaView style={styles.screen}><InventoryState message="Somente packages selados podem ser movimentados." /></SafeAreaView>
    }
    const hasLocation = Boolean(packageItem.currentLocationId)
    const allowedTypes = hasLocation
        ? ['MOVE', 'WITHDRAW']
        : ['RECEIVE', 'STORE']
    const requiresDestination = type != null && type !== 'WITHDRAW'
    const locations = locationsQuery.data?.pages.flatMap(page => page.items) ?? []
    const eligibleLocations = locations.filter(location => (
        location.id !== packageItem.currentLocationId
    ))

    const submit = () => {
        setLocalError(null)
        let prepared = intent
        try {
            if (!prepared) {
                prepared = createInventoryMovementIntent({
                    packageId,
                    type,
                    expectedLocationId: packageItem.currentLocationId,
                    destinationId: requiresDestination ? destinationId : null,
                    expectedVersion: packageItem.version,
                    occurredAt,
                    reason,
                })
                prepared = markInventoryMovementIntentSent(prepared)
                setIntent(prepared)
            }
        } catch {
            setLocalError('Revise o tipo, destino, data/hora e motivo do movimento.')
            return
        }
        setSent(true)
        movementMutation.mutate(prepared)
    }

    const reviewCurrentState = async () => {
        await Promise.all([packageQuery.refetch(), locationsQuery.refetch()])
        setIntent(null)
        setSent(false)
        movementMutation.reset()
        setLocalError(null)
    }

    const commandError = localError ?? getInventoryCommandErrorMessage(
        movementMutation.error
    )
    const conflict = isInventoryMovementConflict(movementMutation.error)
    const ambiguous = isAmbiguousInventoryMovementError(movementMutation.error)
    const busy = movementMutation.isPending
    const locked = sent && !movementMutation.isError

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text accessibilityRole="header" style={styles.title}>Nova movimentação</Text>
                <Text style={styles.subtitle}>{packageItem.packageCode}</Text>

                <InventorySection title="Estado esperado">
                    <InventoryField label="Versão do package" value={String(packageItem.version)} />
                    <InventoryField label="Localização atual" value={packageItem.currentLocationId ?? 'Sem localização'} />
                    <Text style={styles.help}>A versão e a localização são preservadas nesta intenção. O backend valida ambas sob lock.</Text>
                </InventorySection>

                <InventorySection title="Tipo de movimento">
                    <View accessibilityRole="radiogroup">
                        {allowedTypes.map(value => (
                            <Pressable
                                key={value}
                                accessibilityRole="radio"
                                accessibilityLabel={getMovementTypeLabel(value)}
                                accessibilityHint={TYPE_HELP[value]}
                                accessibilityState={{ selected: type === value, disabled: busy || locked }}
                                disabled={busy || locked}
                                onPress={() => {
                                    resetIntentionForEdit()
                                    setType(value)
                                    setDestinationId(null)
                                }}
                                style={[styles.typeButton, type === value && styles.typeSelected]}
                            >
                                <Text style={styles.typeText}>{getMovementTypeLabel(value)}</Text>
                                <Text style={styles.typeHelp}>{TYPE_HELP[value]}</Text>
                            </Pressable>
                        ))}
                    </View>
                </InventorySection>

                {requiresDestination ? (
                    <InventorySection title="Destino ativo">
                        {locationsQuery.isPending ? <Text style={styles.help}>Carregando locais...</Text> : locationsQuery.error && locations.length === 0 ? <Text accessibilityRole="alert" style={styles.error}>{getInventoryErrorMessage(locationsQuery.error)}</Text> : (
                            <StorageLocationSelector
                                activeOnly
                                disabled={busy || locked}
                                hasNextPage={locationsQuery.hasNextPage}
                                loadingMore={locationsQuery.isFetchingNextPage}
                                locations={eligibleLocations}
                                onLoadMore={() => void locationsQuery.fetchNextPage()}
                                onSelect={editField(setDestinationId)}
                                selectedId={destinationId}
                            />
                        )}
                    </InventorySection>
                ) : null}

                <InventorySection title="Fato físico">
                    <Text style={styles.inputLabel}>Data/hora ISO 8601</Text>
                    <TextInput accessibilityLabel="Data e hora do movimento" accessibilityHint="Informe um timestamp ISO 8601" accessibilityState={{ disabled: busy || locked }} editable={!busy && !locked} autoCapitalize="none" autoCorrect={false} onChangeText={editField(setOccurredAt)} placeholder="2026-10-12T12:00:00.000Z" placeholderTextColor="#64748B" style={styles.input} value={occurredAt} />
                    <Text style={styles.inputLabel}>Motivo opcional</Text>
                    <TextInput accessibilityLabel="Motivo do movimento" accessibilityState={{ disabled: busy || locked }} editable={!busy && !locked} maxLength={500} multiline onChangeText={editField(setReason)} placeholder="Motivo operacional, se aplicável" placeholderTextColor="#64748B" style={[styles.input, styles.reason]} value={reason} />
                </InventorySection>

                {commandError ? <Text accessibilityRole="alert" style={styles.commandError}>{commandError}</Text> : null}
                {movementMutation.isSuccess ? (
                    <View accessibilityRole="alert" style={styles.success}>
                        <Text style={styles.successText}>Movimento registrado. A localização será recarregada do backend.</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Abrir histórico atualizado" onPress={() => navigation.replace(INVENTORY_ROUTES.MOVEMENT_HISTORY, { packageId })} style={styles.secondaryButton}>
                            <Text style={styles.secondaryText}>Ver histórico</Text>
                        </Pressable>
                    </View>
                ) : null}
                {conflict ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Recarregar package e revisar movimento" onPress={() => void reviewCurrentState()} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                    </Pressable>
                ) : sent && movementMutation.isError && !ambiguous ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Editar como nova intenção de movimento" onPress={resetIntentionForEdit} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}
                {!movementMutation.isSuccess ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={ambiguous ? 'Reenviar a mesma intenção de movimento' : 'Registrar movimento'}
                        accessibilityHint="O backend confirmará versão, localização, hold e disponibilidade"
                        accessibilityState={{ busy, disabled: busy || conflict }}
                        disabled={busy || conflict}
                        onPress={submit}
                        style={[styles.primaryButton, (busy || conflict) && styles.disabled]}
                    >
                        <Text style={styles.primaryText}>{busy ? 'Enviando...' : ambiguous ? 'Tentar mesma intenção' : 'Registrar movimento'}</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 100 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 14 },
    help: { color: '#475569', fontSize: 13, lineHeight: 19 },
    typeButton: { minHeight: 68, justifyContent: 'center', marginBottom: 8, padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10 },
    typeSelected: { borderColor: '#092955', backgroundColor: '#DBEAFE' },
    typeText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    typeHelp: { marginTop: 3, color: '#475569', fontSize: 12, lineHeight: 17 },
    inputLabel: { marginTop: 4, color: '#334155', fontSize: 13, fontWeight: '600' },
    input: { minHeight: 48, marginTop: 6, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 15 },
    reason: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
    error: { color: '#991B1B', fontSize: 14 },
    commandError: { marginHorizontal: 20, marginBottom: 8, color: '#991B1B', fontSize: 14, lineHeight: 20 },
    success: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 10, backgroundColor: '#DCFCE7' },
    successText: { color: '#166534', fontSize: 14, fontWeight: '600' },
    primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 8, borderRadius: 25, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    secondaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderColor: '#092955', borderRadius: 23, backgroundColor: '#FFFFFF' },
    secondaryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    disabled: { opacity: 0.5 },
})
