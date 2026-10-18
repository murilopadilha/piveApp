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
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    CLIENT_PERMISSIONS,
    hasClientPermission,
} from '../clientPermissions'
import { getClientErrorMessage } from '../clientPresentation'
import ClientListItem from '../components/ClientListItem'
import ClientStateMessage from '../components/ClientStateMessage'
import { useClientsQuery } from '../hooks/useClientQueries'
import { CLIENT_ROUTES } from '../routes'

const SEARCH_DELAY_MS = 500

export default function ClientSearch({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canList = hasClientPermission(
        effectiveContextQuery.data,
        CLIENT_PERMISSIONS.LIST
    )
    const canOpenDetail = hasClientPermission(
        effectiveContextQuery.data,
        CLIENT_PERMISSIONS.DETAIL
    )
    const clientsQuery = useClientsQuery({
        organizationId: activeOrganizationId,
        query,
        enabled: effectiveContextQuery.isSuccess && canList,
    })

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setQuery(searchText.trim())
        }, SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [searchText])

    const clients = clientsQuery.data?.pages.flatMap(page => page.items) ?? []
    const initialLoading = effectiveContextQuery.isPending ||
        (canList && clientsQuery.isPending)
    const error = effectiveContextQuery.error ?? clientsQuery.error
    const errorMessage = getClientErrorMessage(error)

    const loadNextPage = React.useCallback(() => {
        if (clientsQuery.hasNextPage && !clientsQuery.isFetchingNextPage) {
            void clientsQuery.fetchNextPage()
        }
    }, [clientsQuery])

    const retry = React.useCallback(() => {
        if (effectiveContextQuery.error) {
            void effectiveContextQuery.refetch()
            return
        }

        void clientsQuery.refetch()
    }, [clientsQuery, effectiveContextQuery])

    const renderItem = React.useCallback(({ item }) => (
        <ClientListItem
            client={item}
            canOpen={canOpenDetail}
            onOpen={() => navigation.navigate(CLIENT_ROUTES.DETAIL, {
                clientId: item.id,
            })}
        />
    ), [canOpenDetail, navigation])

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando clientes"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando clientes...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canList) {
        return (
            <SafeAreaView style={styles.screen}>
                <ClientStateMessage message="Você não tem permissão para listar clientes." />
            </SafeAreaView>
        )
    }

    if (errorMessage && clients.length === 0) {
        return (
            <SafeAreaView style={styles.screen}>
                <ClientStateMessage message={errorMessage} onRetry={retry} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                    Clientes
                </Text>
                <Text style={styles.subtitle}>
                    Consulte clientes da organização ativa.
                </Text>
                <TextInput
                    accessibilityLabel="Buscar clientes"
                    accessibilityHint="Busca por nome ou identificador"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setSearchText}
                    placeholder="Nome ou identificador"
                    placeholderTextColor="#64748B"
                    returnKeyType="search"
                    style={styles.searchInput}
                    value={searchText}
                />
            </View>
            {errorMessage ? (
                <View style={styles.inlineError}>
                    <ClientStateMessage message={errorMessage} onRetry={retry} />
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={clients.length === 0
                    ? styles.emptyList
                    : styles.listContent}
                data={clients}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={(
                    <Text accessibilityRole="text" style={styles.emptyText}>
                        {query
                            ? 'Nenhum cliente encontrado para esta busca.'
                            : 'Nenhum cliente cadastrado.'}
                    </Text>
                )}
                ListFooterComponent={clientsQuery.isFetchingNextPage ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Carregando mais clientes"
                        style={styles.footer}
                    >
                        <ActivityIndicator size="small" color="#092955" />
                    </View>
                ) : null}
                onEndReached={loadNextPage}
                onEndReachedThreshold={0.4}
                renderItem={renderItem}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 10,
    },
    title: {
        color: '#092955',
        fontSize: 26,
        fontWeight: '700',
    },
    subtitle: {
        color: '#475569',
        fontSize: 15,
        marginTop: 4,
    },
    searchInput: {
        minHeight: 48,
        marginTop: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 16,
    },
    stateText: {
        color: '#475569',
        fontSize: 15,
        marginTop: 12,
    },
    listContent: {
        paddingTop: 4,
        paddingBottom: 120,
    },
    emptyList: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 80,
    },
    emptyText: {
        color: '#475569',
        fontSize: 16,
        lineHeight: 23,
        textAlign: 'center',
    },
    footer: {
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineError: {
        minHeight: 140,
    },
})
