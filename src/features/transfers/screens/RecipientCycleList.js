import React from 'react'
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
import RecipientCycleListItem from '../components/RecipientCycleListItem'
import { TransferState } from '../components/TransferElements'
import { useRecipientCyclesQuery } from '../hooks/useTransferQueries'
import { TRANSFER_PERMISSIONS, hasTransferPermission } from '../transferPermissions'
import { TRANSFER_ROUTES } from '../routes'
import { getTransferErrorMessage } from '../transferPresentation'

const FILTERS = [
    { value: null, label: 'Todos' },
    { value: 'OPEN', label: 'Abertos' },
    { value: 'CLOSED', label: 'Fechados' },
]

export default function RecipientCycleList({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [status, setStatus] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.READ)
    const canWrite = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.WRITE)
    const cyclesQuery = useRecipientCyclesQuery({
        organizationId: activeOrganizationId,
        status,
        enabled: contextQuery.isSuccess && canRead,
    })
    const cycles = cyclesQuery.data?.pages.flatMap(page => page.items) ?? []
    const errorMessage = getTransferErrorMessage(contextQuery.error ?? cyclesQuery.error)

    if (contextQuery.isPending || (canRead && cyclesQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando ciclos de receptoras" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><TransferState message="Você não tem permissão para consultar ciclos de receptoras." /></SafeAreaView>
    }
    if (errorMessage && cycles.length === 0) {
        return <SafeAreaView style={styles.screen}><TransferState message={errorMessage} onRetry={() => void cyclesQuery.refetch()} /></SafeAreaView>
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.heading}>
                    <View style={styles.headingText}>
                        <Text accessibilityRole="header" style={styles.title}>Ciclos de receptoras</Text>
                        <Text style={styles.subtitle}>Ciclos e transferências já realizadas</Text>
                    </View>
                    {canWrite ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Abrir novo ciclo de receptora" accessibilityHint="Seleciona uma Animal e abre um RecipientCycle" onPress={() => navigation.navigate(TRANSFER_ROUTES.RECIPIENT_CYCLE_CREATE)} style={styles.primaryButton}>
                            <Text style={styles.primaryText}>Novo ciclo</Text>
                        </Pressable>
                    ) : null}
                </View>
                <View accessibilityRole="radiogroup" style={styles.filters}>
                    {FILTERS.map(filter => (
                        <Pressable
                            key={filter.label}
                            accessibilityRole="radio"
                            accessibilityLabel={`Filtrar ciclos: ${filter.label}`}
                            accessibilityState={{ selected: status === filter.value }}
                            onPress={() => setStatus(filter.value)}
                            style={[styles.filter, status === filter.value && styles.filterSelected]}
                        >
                            <Text style={[styles.filterText, status === filter.value && styles.filterTextSelected]}>{filter.label}</Text>
                        </Pressable>
                    ))}
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Consultar acompanhamentos D30 e D60" onPress={() => navigation.navigate(TRANSFER_ROUTES.PREGNANCY_FOLLOW_UPS)} style={styles.followUpButton}>
                    <Text style={styles.followUpText}>Acompanhamentos D30/D60</Text>
                </Pressable>
            </View>
            <FlatList
                contentContainerStyle={cycles.length ? styles.list : styles.empty}
                data={cycles}
                keyExtractor={cycle => cycle.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum ciclo encontrado.</Text>}
                ListFooterComponent={cyclesQuery.isFetchingNextPage ? <ActivityIndicator accessibilityLabel="Carregando mais ciclos" color="#092955" style={styles.footer} /> : null}
                onEndReached={() => {
                    if (cyclesQuery.hasNextPage && !cyclesQuery.isFetchingNextPage) {
                        void cyclesQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => <RecipientCycleListItem cycle={item} onPress={() => navigation.navigate(TRANSFER_ROUTES.RECIPIENT_CYCLE_DETAIL, { recipientCycleId: item.id })} />}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headingText: { flex: 1, paddingRight: 10 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginTop: 4, color: '#475569', fontSize: 14 },
    primaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 22, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    filters: { flexDirection: 'row', marginTop: 14 },
    filter: { minHeight: 44, justifyContent: 'center', marginRight: 8, paddingHorizontal: 13, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 22, backgroundColor: '#FFFFFF' },
    filterSelected: { borderColor: '#092955', backgroundColor: '#DBEAFE' },
    filterText: { color: '#475569', fontSize: 13, fontWeight: '600' },
    filterTextSelected: { color: '#092955' },
    followUpButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    followUpText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    list: { paddingTop: 4, paddingBottom: 100 },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#475569', fontSize: 16 },
    footer: { marginVertical: 20 },
})
