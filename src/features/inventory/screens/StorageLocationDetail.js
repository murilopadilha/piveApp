import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { InventoryField, InventorySection, InventoryState } from '../components/InventoryElements'
import { useStorageLocationDetailQuery } from '../hooks/useInventoryQueries'
import { INVENTORY_PERMISSIONS, hasInventoryPermission } from '../inventoryPermissions'
import { getInventoryErrorMessage } from '../inventoryPresentation'

export default function StorageLocationDetail({ route }) {
    const storageLocationId = route.params?.storageLocationId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasInventoryPermission(contextQuery.data, INVENTORY_PERMISSIONS.READ)
    const locationQuery = useStorageLocationDetailQuery({
        organizationId: activeOrganizationId,
        storageLocationId,
        enabled: contextQuery.isSuccess && canRead,
    })

    if (!storageLocationId) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Localização não identificada." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && locationQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><InventoryState loading message="Carregando localização" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Você não tem permissão para consultar locais de armazenamento." /></SafeAreaView>
    }
    const error = getInventoryErrorMessage(contextQuery.error ?? locationQuery.error)
    if (error || !locationQuery.data) {
        return <SafeAreaView style={styles.screen}><InventoryState message={error ?? 'Não foi possível carregar a localização.'} onRetry={() => void locationQuery.refetch()} /></SafeAreaView>
    }

    const location = locationQuery.data
    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>{location.name || location.code}</Text>
                <Text style={styles.subtitle}>{location.status}</Text>
                <InventorySection title="Local de armazenamento">
                    <InventoryField label="Código" value={location.code} />
                    <InventoryField label="Nome" value={location.name ?? 'Não informado'} />
                    <InventoryField label="Tipo" value={location.typeCode} />
                    <InventoryField label="Estabelecimento" value={location.establishmentId} />
                    <InventoryField label="Operational location" value={location.operationalLocationId ?? 'Não informado'} />
                    <InventoryField label="Parent" value={location.parentId ?? 'Raiz'} />
                    <InventoryField label="Versão" value={String(location.version)} />
                </InventorySection>
                <Text style={styles.note}>A listagem mobile é plana. Parent é apenas uma referência técnica; nenhuma árvore ou capacidade é inferida.</Text>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 14, fontWeight: '700' },
    note: { marginHorizontal: 20, color: '#64748B', fontSize: 13, lineHeight: 19 },
})
