import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { EMBRYO_ROUTES } from '../../embryology/routes'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    InventoryField,
    InventorySection,
    InventoryState,
} from '../components/InventoryElements'
import {
    useEmbryoPackageDetailQuery,
    useEmbryoPackageItemsQuery,
    useInventoryProjectionQuery,
    useStorageLocationDetailQuery,
} from '../hooks/useInventoryQueries'
import {
    INVENTORY_PERMISSIONS,
    hasInventoryPermission,
} from '../inventoryPermissions'
import {
    formatInventoryTimestamp,
    getInventoryErrorMessage,
    getPackageStatusLabel,
} from '../inventoryPresentation'
import { INVENTORY_ROUTES } from '../routes'

export default function EmbryoPackageDetail({ navigation, route }) {
    const packageId = route.params?.packageId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.READ)
    const canWrite = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.WRITE)
    const canReadEmbryos = hasInventoryPermission(
        contextQuery.data,
        INVENTORY_PERMISSIONS.EMBRYO_READ
    )
    const packageQuery = useEmbryoPackageDetailQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const itemsQuery = useEmbryoPackageItemsQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const projectionQuery = useInventoryProjectionQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const locationQuery = useStorageLocationDetailQuery({
        organizationId: activeOrganizationId,
        storageLocationId: packageQuery.data?.currentLocationId,
        enabled: contextQuery.isSuccess && canRead && Boolean(
            packageQuery.data?.currentLocationId
        ),
    })

    if (!packageId) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Package não identificado." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && packageQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><InventoryState loading message="Carregando package" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Você não tem permissão para consultar este package." /></SafeAreaView>
    }
    const mainError = getInventoryErrorMessage(contextQuery.error ?? packageQuery.error)
    if (mainError || !packageQuery.data) {
        return <SafeAreaView style={styles.screen}><InventoryState message={mainError ?? 'Não foi possível carregar o package.'} onRetry={() => void packageQuery.refetch()} /></SafeAreaView>
    }

    const item = packageQuery.data
    const packageItems = itemsQuery.data ?? []
    const locationLabel = locationQuery.data
        ? `${locationQuery.data.code}${locationQuery.data.name ? ` — ${locationQuery.data.name}` : ''}`
        : item.currentLocationId ?? 'Sem localização atual'

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>{item.packageCode}</Text>
                <Text style={styles.subtitle}>{getPackageStatusLabel(item.status)}</Text>

                <InventorySection title="Package">
                    <InventoryField label="Tipo de embalagem" value={item.packagingType} />
                    <InventoryField label="Estabelecimento" value={item.establishmentId} />
                    <InventoryField label="Owner Party" value={item.ownerPartyId ?? 'Não informado'} />
                    <InventoryField label="Selado em" value={formatInventoryTimestamp(item.sealedAt)} />
                    <InventoryField label="Versão" value={String(item.version)} />
                    <InventoryField label="Última sequência" value={String(item.lastMovementSequence)} />
                </InventorySection>

                <InventorySection title="Localização atual">
                    <InventoryField label="Local" value={locationLabel} />
                    {item.currentLocationId ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Abrir localização atual" onPress={() => navigation.navigate(INVENTORY_ROUTES.STORAGE_LOCATION_DETAIL, { storageLocationId: item.currentLocationId })} style={styles.linkButton}>
                            <Text style={styles.linkText}>Ver localização</Text>
                        </Pressable>
                    ) : null}
                    {locationQuery.error ? <Text accessibilityRole="alert" style={styles.warning}>O identificador é válido, mas o detalhe auxiliar da localização não pôde ser carregado.</Text> : null}
                </InventorySection>

                <InventorySection title="Consistência da projeção">
                    {projectionQuery.isPending ? <Text style={styles.help}>Verificando ledger...</Text> : projectionQuery.error ? (
                        <View><Text accessibilityRole="alert" style={styles.warning}>{getInventoryErrorMessage(projectionQuery.error)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Verificar projeção novamente" accessibilityState={{ busy: projectionQuery.isFetching, disabled: projectionQuery.isFetching }} disabled={projectionQuery.isFetching} onPress={() => void projectionQuery.refetch()} style={styles.linkButton}><Text style={styles.linkText}>Tentar novamente</Text></Pressable></View>
                    ) : (
                        <Text accessibilityRole="text" style={projectionQuery.data?.matchesLedger ? styles.consistent : styles.inconsistent}>
                            {projectionQuery.data?.matchesLedger ? 'Projeção consistente com o ledger.' : 'Divergência detectada entre projeção e ledger.'}
                        </Text>
                    )}
                </InventorySection>

                <InventorySection title="Conteúdo ativo">
                    {itemsQuery.isPending ? <Text style={styles.help}>Carregando conteúdo...</Text> : itemsQuery.error ? <Text accessibilityRole="alert" style={styles.warning}>{getInventoryErrorMessage(itemsQuery.error)}</Text> : packageItems.length === 0 ? <Text style={styles.help}>Nenhum membro ativo.</Text> : packageItems.map(packageItem => (
                        <Pressable
                            key={packageItem.id}
                            accessibilityRole={canReadEmbryos ? 'button' : 'text'}
                            accessibilityLabel={`Embrião ${packageItem.embryoId}`}
                            accessibilityHint={canReadEmbryos ? 'Abre o detalhe do embrião' : undefined}
                            accessibilityState={{ disabled: !canReadEmbryos }}
                            disabled={!canReadEmbryos}
                            onPress={() => navigation.navigate(EMBRYO_ROUTES.DETAIL, { embryoId: packageItem.embryoId })}
                            style={styles.member}
                        >
                            <Text style={styles.memberTitle}>Embrião {packageItem.embryoId}</Text>
                            <Text style={styles.memberMeta}>Posição: {packageItem.positionCode ?? 'Não informada'}</Text>
                        </Pressable>
                    ))}
                </InventorySection>

                <View style={styles.actions}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Abrir histórico de movimentos" onPress={() => navigation.navigate(INVENTORY_ROUTES.MOVEMENT_HISTORY, { packageId })} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Histórico de movimentos</Text>
                    </Pressable>
                    {canWrite && item.status === 'SEALED' ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Registrar novo movimento" accessibilityHint="Abre RECEIVE, STORE, MOVE ou WITHDRAW conforme a localização atual" onPress={() => navigation.navigate(INVENTORY_ROUTES.MOVEMENT_CREATE, { packageId })} style={styles.primaryButton}>
                            <Text style={styles.primaryText}>Nova movimentação</Text>
                        </Pressable>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#166534', fontSize: 14, fontWeight: '700' },
    help: { color: '#475569', fontSize: 14, lineHeight: 20 },
    warning: { color: '#92400E', fontSize: 14, lineHeight: 20 },
    consistent: { color: '#166534', fontSize: 14, fontWeight: '700' },
    inconsistent: { color: '#991B1B', fontSize: 14, fontWeight: '700' },
    linkButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    linkText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    member: { minHeight: 58, justifyContent: 'center', marginBottom: 8, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 },
    memberTitle: { color: '#0F172A', fontSize: 13, fontWeight: '600' },
    memberMeta: { marginTop: 3, color: '#64748B', fontSize: 12 },
    actions: { marginHorizontal: 16 },
    primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 24, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#092955', borderRadius: 24, backgroundColor: '#FFFFFF' },
    secondaryText: { color: '#092955', fontSize: 15, fontWeight: '700' },
})
