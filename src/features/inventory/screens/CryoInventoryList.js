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
import { InventoryState } from '../components/InventoryElements'
import PackageListItem from '../components/PackageListItem'
import StorageLocationSelector from '../components/StorageLocationSelector'
import {
    useEmbryoPackagesQuery,
    useStorageLocationsQuery,
} from '../hooks/useInventoryQueries'
import {
    INVENTORY_PERMISSIONS,
    hasInventoryPermission,
} from '../inventoryPermissions'
import { getInventoryErrorMessage } from '../inventoryPresentation'
import { INVENTORY_ROUTES } from '../routes'

const SEARCH_DELAY_MS = 500

export default function CryoInventoryList({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const [locationId, setLocationId] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasInventoryPermission(
        contextQuery.data,
        INVENTORY_PERMISSIONS.READ
    )
    const packagesQuery = useEmbryoPackagesQuery({
        organizationId: activeOrganizationId,
        query,
        locationId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const locationsQuery = useStorageLocationsQuery({
        organizationId: activeOrganizationId,
        enabled: contextQuery.isSuccess && canRead,
    })

    React.useEffect(() => {
        const timeout = setTimeout(() => setQuery(searchText.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [searchText])

    React.useEffect(() => {
        setSearchText('')
        setQuery('')
        setLocationId(null)
    }, [activeOrganizationId])

    const packages = packagesQuery.data?.pages.flatMap(page => page.items) ?? []
    const locations = locationsQuery.data?.pages.flatMap(page => page.items) ?? []
    const error = contextQuery.error ?? packagesQuery.error
    const errorMessage = getInventoryErrorMessage(error)

    if (contextQuery.isPending || (canRead && packagesQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><InventoryState loading message="Carregando inventário criogênico" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><InventoryState message="Você não tem permissão para consultar o inventário." /></SafeAreaView>
    }
    if (errorMessage && packages.length === 0) {
        return <SafeAreaView style={styles.screen}><InventoryState message={errorMessage} onRetry={() => void packagesQuery.refetch()} /></SafeAreaView>
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>Inventário criogênico</Text>
                <Text style={styles.subtitle}>Packages, localização atual e movimentos físicos</Text>
                <TextInput
                    accessibilityLabel="Buscar packages"
                    accessibilityHint="Busca pelo código do package"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setSearchText}
                    placeholder="Código do package"
                    placeholderTextColor="#64748B"
                    returnKeyType="search"
                    style={styles.search}
                    value={searchText}
                />
                <Text accessibilityRole="header" style={styles.filterTitle}>Localização</Text>
                {locationsQuery.error && locations.length === 0 ? (
                    <Text accessibilityRole="alert" style={styles.filterError}>
                        Não foi possível carregar o filtro de localização.
                    </Text>
                ) : (
                    <StorageLocationSelector
                        allowClear
                        hasNextPage={locationsQuery.hasNextPage}
                        loadingMore={locationsQuery.isFetchingNextPage}
                        locations={locations}
                        onLoadMore={() => void locationsQuery.fetchNextPage()}
                        onSelect={setLocationId}
                        selectedId={locationId}
                    />
                )}
            </View>
            {errorMessage ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Tentar carregar packages novamente" onPress={() => void packagesQuery.refetch()} style={styles.retry}>
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={packages.length ? styles.list : styles.empty}
                data={packages}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={styles.emptyText}>{query || locationId ? 'Nenhum package encontrado para estes filtros.' : 'Nenhum package encontrado.'}</Text>}
                ListFooterComponent={packagesQuery.isFetchingNextPage ? <ActivityIndicator accessibilityLabel="Carregando mais packages" color="#092955" style={styles.footer} /> : null}
                onEndReached={() => {
                    if (packagesQuery.hasNextPage && !packagesQuery.isFetchingNextPage) {
                        void packagesQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <PackageListItem
                        packageItem={item}
                        onPress={() => navigation.navigate(
                            INVENTORY_ROUTES.PACKAGE_DETAIL,
                            { packageId: item.id }
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
    search: { minHeight: 48, marginTop: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 16 },
    filterTitle: { marginTop: 14, color: '#092955', fontSize: 15, fontWeight: '700' },
    filterError: { marginTop: 8, color: '#991B1B', fontSize: 13 },
    inlineError: { marginHorizontal: 20, paddingVertical: 8 },
    errorText: { color: '#991B1B', fontSize: 14 },
    retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    list: { paddingTop: 4, paddingBottom: 100 },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#475569', fontSize: 16, textAlign: 'center' },
    footer: { marginVertical: 20 },
})
