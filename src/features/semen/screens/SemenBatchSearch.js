import React from 'react'
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import {
    MATING_PERMISSIONS,
    hasMatingPermission,
} from '../../fertilization/matingPermissions'
import { getMatingErrorMessage } from '../../fertilization/matingPresentation'
import { MATING_ROUTES } from '../../fertilization/routes'
import SemenBatchListItem from '../../fertilization/components/SemenBatchListItem'
import { useOrganization } from '../../organizations/OrganizationContext'
import { useSemenBatchesQuery } from '../hooks/useSemenQueries'

const SEARCH_DELAY_MS = 400

export default function SemenBatchSearch({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [text, setText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.SEMEN_READ
    )
    const batchesQuery = useSemenBatchesQuery({
        organizationId: activeOrganizationId,
        query,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })
    const batches = batchesQuery.data?.pages.flatMap(page => page.items) ?? []

    React.useEffect(() => {
        const timeout = setTimeout(() => setQuery(text.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [text])

    if (effectiveContextQuery.isPending || (canRead && batchesQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando lotes de sêmen"
                    style={styles.centered}
                >
                    <ActivityIndicator color="#092955" size="large" />
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="alert" style={styles.centered}>
                    <Text style={styles.message}>Você não tem permissão para consultar lotes de sêmen.</Text>
                </View>
            </SafeAreaView>
        )
    }

    const errorMessage = getMatingErrorMessage(
        effectiveContextQuery.error ?? batchesQuery.error
    )

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>Lotes de sêmen</Text>
                <Text style={styles.subtitle}>Consulta operacional por código de lote</Text>
                <TextInput
                    accessibilityLabel="Buscar lote de sêmen por código"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setText}
                    placeholder="Código do lote"
                    placeholderTextColor="#64748B"
                    style={styles.search}
                    value={text}
                />
            </View>
            <FlatList
                contentContainerStyle={batches.length === 0
                    ? styles.emptyList
                    : styles.list}
                data={batches}
                keyExtractor={batch => batch.id}
                ListEmptyComponent={(
                    <Text style={styles.message}>
                        {query ? 'Nenhum lote encontrado para a busca.' : 'Nenhum lote registrado.'}
                    </Text>
                )}
                ListFooterComponent={batchesQuery.isFetchingNextPage ? (
                    <ActivityIndicator color="#092955" style={styles.footer} />
                ) : errorMessage ? (
                    <Text accessibilityRole="alert" style={styles.message}>{errorMessage}</Text>
                ) : null}
                onEndReached={() => {
                    if (batchesQuery.hasNextPage && !batchesQuery.isFetchingNextPage) {
                        void batchesQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <SemenBatchListItem
                        batch={item}
                        onPress={() => navigation.navigate(
                            MATING_ROUTES.SEMEN_BATCH_DETAIL,
                            { semenBatchId: item.id }
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
    subtitle: { color: '#475569', fontSize: 14, marginTop: 4 },
    search: { minHeight: 48, marginTop: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    list: { paddingTop: 8, paddingBottom: 80 },
    emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    message: { color: '#475569', fontSize: 15, textAlign: 'center' },
    footer: { marginVertical: 20 },
})
