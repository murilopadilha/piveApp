import React from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { DistributionState } from '../components/DistributionElements'
import ShipmentListItem from '../components/ShipmentListItem'
import {
    DISTRIBUTION_PERMISSIONS,
    hasDistributionPermission,
} from '../distributionPermissions'
import { getShipmentErrorMessage } from '../distributionPresentation'
import { useShipmentsQuery } from '../hooks/useDistributionQueries'
import { DISTRIBUTION_ROUTES } from '../routes'

export default function ShipmentList({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const [localError, setLocalError] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasDistributionPermission(
        contextQuery.data,
        DISTRIBUTION_PERMISSIONS.SHIPMENT_READ
    )
    const shipmentsQuery = useShipmentsQuery({
        organizationId: activeOrganizationId,
        query,
        enabled: contextQuery.isSuccess && canRead,
    })
    const shipments = shipmentsQuery.data?.pages.flatMap(page => page.items) ?? []
    const errorMessage = localError ?? getShipmentErrorMessage(
        contextQuery.error ?? shipmentsQuery.error
    )

    React.useEffect(() => {
        setSearchText('')
        setQuery('')
        setLocalError(null)
    }, [activeOrganizationId])

    const submitSearch = () => {
        const normalized = searchText.trim()
        if (normalized.length > 200) {
            setLocalError('A busca deve ter no máximo 200 caracteres.')
            return
        }
        setLocalError(null)
        setQuery(normalized)
    }

    if (contextQuery.isPending || (canRead && shipmentsQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <DistributionState loading message="Carregando Shipments" />
            </SafeAreaView>
        )
    }
    if (contextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <DistributionState message="Você não tem permissão para consultar Shipments." />
            </SafeAreaView>
        )
    }
    if (errorMessage && shipments.length === 0 && !localError) {
        const retry = contextQuery.error ? contextQuery.refetch : shipmentsQuery.refetch
        return (
            <SafeAreaView style={styles.screen}>
                <DistributionState message={errorMessage} onRetry={() => void retry()} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>Distribution</Text>
                <Text style={styles.subtitle}>Shipments e readiness operacional atual</Text>
                <View style={styles.searchRow}>
                    <TextInput
                        accessibilityLabel="Buscar Shipments"
                        accessibilityHint="Busca no backend por ID, status ou nome do destinatário"
                        autoCapitalize="none"
                        maxLength={201}
                        onChangeText={(value) => {
                            setSearchText(value)
                            setLocalError(null)
                        }}
                        onSubmitEditing={submitSearch}
                        placeholder="ID, status ou destinatário"
                        placeholderTextColor="#64748B"
                        returnKeyType="search"
                        style={styles.search}
                        value={searchText}
                    />
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Executar busca de Shipments"
                        accessibilityState={{ busy: shipmentsQuery.isFetching }}
                        onPress={submitSearch}
                        style={styles.searchButton}
                    >
                        <Text style={styles.searchButtonText}>Buscar</Text>
                    </Pressable>
                </View>
            </View>
            {errorMessage ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    {!localError ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Tentar carregar Shipments novamente"
                            onPress={() => void shipmentsQuery.refetch()}
                            style={styles.retry}
                        >
                            <Text style={styles.retryText}>Tentar novamente</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={shipments.length ? styles.list : styles.empty}
                data={shipments}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={(
                    <Text style={styles.emptyText}>
                        {query ? 'Nenhum Shipment encontrado para esta busca.' : 'Nenhum Shipment encontrado.'}
                    </Text>
                )}
                ListFooterComponent={shipmentsQuery.isFetchingNextPage ? (
                    <ActivityIndicator accessibilityLabel="Carregando mais Shipments" color="#092955" />
                ) : null}
                onEndReached={() => {
                    if (shipmentsQuery.hasNextPage && !shipmentsQuery.isFetchingNextPage) {
                        void shipmentsQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <ShipmentListItem
                        shipment={item}
                        onPress={() => navigation.navigate(
                            DISTRIBUTION_ROUTES.SHIPMENT_DETAIL,
                            { shipmentId: item.id }
                        )}
                    />
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginTop: 4, color: '#475569', fontSize: 14 },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    search: { flex: 1, minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A' },
    searchButton: { minHeight: 48, justifyContent: 'center', marginLeft: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#092955' },
    searchButtonText: { color: '#FFFFFF', fontWeight: '700' },
    inlineError: { marginHorizontal: 20, paddingVertical: 8 },
    errorText: { color: '#991B1B', fontSize: 14 },
    retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    retryText: { color: '#092955', fontWeight: '700' },
    list: { paddingTop: 4, paddingBottom: 100 },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#475569', fontSize: 16, textAlign: 'center' },
})
