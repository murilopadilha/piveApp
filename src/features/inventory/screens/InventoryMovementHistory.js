import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { InventoryState } from '../components/InventoryElements'
import {
    useEmbryoPackageDetailQuery,
    useInventoryMovementsQuery,
    useInventoryProjectionQuery,
} from '../hooks/useInventoryQueries'
import { INVENTORY_PERMISSIONS, hasInventoryPermission } from '../inventoryPermissions'
import {
    formatInventoryTimestamp,
    getInventoryErrorMessage,
    getMovementTypeLabel,
} from '../inventoryPresentation'
import { INVENTORY_ROUTES } from '../routes'

export default function InventoryMovementHistory({ navigation, route }) {
    const packageId = route.params?.packageId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.READ)
    const canWrite = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.WRITE)
    const packageQuery = useEmbryoPackageDetailQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const ledgerQuery = useInventoryMovementsQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const projectionQuery = useInventoryProjectionQuery({
        organizationId: activeOrganizationId,
        packageId,
        enabled: contextQuery.isSuccess && canRead,
    })

    if (!packageId) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Package não identificado." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && ledgerQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><InventoryState loading message="Carregando movimentos" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Você não tem permissão para consultar o ledger." /></SafeAreaView>
    }
    const movements = ledgerQuery.data?.pages.flatMap(page => page.items) ?? []
    const error = getInventoryErrorMessage(contextQuery.error ?? ledgerQuery.error)
    if (error && movements.length === 0) {
        return <SafeAreaView style={styles.screen}><InventoryState message={error} onRetry={() => void ledgerQuery.refetch()} /></SafeAreaView>
    }

    const canMove = canWrite && packageQuery.data?.status === 'SEALED'
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.heading}>
                    <View style={styles.headingText}>
                        <Text accessibilityRole="header" style={styles.title}>Movimentos</Text>
                        <Text style={styles.subtitle}>{packageQuery.data?.packageCode ?? packageId}</Text>
                    </View>
                    {canMove ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Registrar novo movimento" onPress={() => navigation.navigate(INVENTORY_ROUTES.MOVEMENT_CREATE, { packageId })} style={styles.primaryButton}>
                            <Text style={styles.primaryText}>Novo</Text>
                        </Pressable>
                    ) : null}
                </View>
                <View accessibilityRole="text" style={[styles.projection, projectionQuery.data?.matchesLedger === false && styles.projectionError]}>
                    <Text style={styles.projectionText}>
                        {projectionQuery.isPending
                            ? 'Verificando projeção...'
                            : projectionQuery.error
                                ? 'Projection-check indisponível.'
                                : projectionQuery.data?.matchesLedger
                                    ? 'Projeção consistente com o ledger.'
                                    : 'Divergência entre projeção e ledger.'}
                    </Text>
                </View>
            </View>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <FlatList
                contentContainerStyle={movements.length ? styles.list : styles.empty}
                data={movements}
                keyExtractor={movement => movement.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum movimento registrado.</Text>}
                ListFooterComponent={ledgerQuery.isFetchingNextPage ? <ActivityIndicator accessibilityLabel="Carregando mais movimentos" color="#092955" style={styles.footer} /> : null}
                onEndReached={() => {
                    if (ledgerQuery.hasNextPage && !ledgerQuery.isFetchingNextPage) {
                        void ledgerQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <View accessibilityRole="text" accessibilityLabel={`Movimento ${item.sequence}, ${getMovementTypeLabel(item.type)}`} style={styles.movement}>
                        <View style={styles.movementHeading}>
                            <Text style={styles.movementTitle}>#{item.sequence} · {getMovementTypeLabel(item.type)}</Text>
                            <Text style={styles.movementDate}>{formatInventoryTimestamp(item.occurredAt)}</Text>
                        </View>
                        <Text style={styles.movementMeta}>Origem: {item.fromLocationId ?? 'Sem localização'}</Text>
                        <Text style={styles.movementMeta}>Destino: {item.toLocationId ?? 'Sem localização'}</Text>
                        {item.reason ? <Text style={styles.movementReason}>{item.reason}</Text> : null}
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headingText: { flex: 1, paddingRight: 12 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginTop: 4, color: '#475569', fontSize: 13 },
    primaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    projection: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: '#DCFCE7' },
    projectionError: { backgroundColor: '#FEE2E2' },
    projectionText: { color: '#334155', fontSize: 13, fontWeight: '600' },
    error: { marginHorizontal: 20, color: '#991B1B', fontSize: 14 },
    list: { paddingTop: 4, paddingBottom: 100 },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#475569', fontSize: 16 },
    footer: { marginVertical: 20 },
    movement: { marginHorizontal: 16, marginVertical: 6, padding: 15, borderRadius: 12, backgroundColor: '#FFFFFF' },
    movementHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    movementTitle: { flex: 1, color: '#092955', fontSize: 15, fontWeight: '700' },
    movementDate: { marginLeft: 8, color: '#64748B', fontSize: 11 },
    movementMeta: { marginTop: 5, color: '#475569', fontSize: 12 },
    movementReason: { marginTop: 8, color: '#0F172A', fontSize: 13 },
})
