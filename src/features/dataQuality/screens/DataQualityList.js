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
import { MAX_DATA_QUALITY_QUERY_LENGTH } from '../api/dataQualityApi'
import { DataQualityState } from '../components/DataQualityElements'
import DataQualityIssueItem from '../components/DataQualityIssueItem'
import { canReadDataQuality } from '../dataQualityPermissions'
import { getDataQualityErrorMessage } from '../dataQualityPresentation'
import { useDataQualityIssuesQuery } from '../hooks/useDataQualityQueries'

const SEARCH_DELAY_MS = 500

export default function DataQualityList() {
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = canReadDataQuality(contextQuery.data)
    const issuesQuery = useDataQualityIssuesQuery({
        organizationId: activeOrganizationId,
        query,
        enabled: contextQuery.isSuccess && canRead,
    })

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setQuery(searchText.trim())
        }, SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [searchText])

    React.useEffect(() => {
        setSearchText('')
        setQuery('')
    }, [activeOrganizationId])

    const issues = issuesQuery.data?.pages.flatMap(page => page.items) ?? []
    const error = contextQuery.error ?? issuesQuery.error
    const errorMessage = getDataQualityErrorMessage(error)
    const initialLoading = contextQuery.isPending ||
        (canRead && issuesQuery.isPending)

    const retry = React.useCallback(() => {
        if (contextQuery.error) {
            void contextQuery.refetch()
            return
        }

        void issuesQuery.refetch()
    }, [contextQuery, issuesQuery])

    const loadNextPage = React.useCallback(() => {
        if (issuesQuery.hasNextPage && !issuesQuery.isFetchingNextPage) {
            void issuesQuery.fetchNextPage()
        }
    }, [issuesQuery])

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <DataQualityState
                    loading
                    message="Carregando qualidade de dados"
                />
            </SafeAreaView>
        )
    }

    if (contextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <DataQualityState message="Você não tem as permissões necessárias para consultar qualidade de dados." />
            </SafeAreaView>
        )
    }

    if (errorMessage && issues.length === 0) {
        return (
            <SafeAreaView style={styles.screen}>
                <DataQualityState message={errorMessage} onRetry={retry} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                    Qualidade de dados
                </Text>
                <Text style={styles.subtitle}>
                    Issues derivados pela projeção atual de Embryos e Packages.
                </Text>
                <View style={styles.searchRow}>
                    <TextInput
                        accessibilityLabel="Buscar issues de qualidade de dados"
                        accessibilityHint="Busca no backend por código ou identificador do subject"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={MAX_DATA_QUALITY_QUERY_LENGTH}
                        onChangeText={setSearchText}
                        placeholder="Código ou identificador"
                        placeholderTextColor="#64748B"
                        returnKeyType="search"
                        style={styles.searchInput}
                        value={searchText}
                    />
                    {searchText ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Limpar busca de qualidade de dados"
                            accessibilityHint="Remove o texto e recarrega a projeção completa"
                            onPress={() => setSearchText('')}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearButtonText}>Limpar</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
            {errorMessage ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Tentar carregar qualidade de dados novamente"
                        accessibilityState={{
                            busy: issuesQuery.isFetching,
                            disabled: issuesQuery.isFetching,
                        }}
                        disabled={issuesQuery.isFetching}
                        onPress={retry}
                        style={styles.retry}
                    >
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={issues.length
                    ? styles.list
                    : styles.empty}
                data={issues}
                keyExtractor={issue => [
                    issue.subjectType,
                    issue.subjectId,
                    issue.code,
                ].join(':')}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={(
                    <Text accessibilityRole="text" style={styles.emptyText}>
                        {query
                            ? 'Nenhum issue foi retornado pela projeção atual para esta busca.'
                            : 'Nenhum issue foi retornado pela projeção atual de qualidade de dados.'}
                    </Text>
                )}
                ListFooterComponent={issuesQuery.isFetchingNextPage ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Carregando mais issues de qualidade de dados"
                        style={styles.footer}
                    >
                        <ActivityIndicator color="#092955" size="small" />
                    </View>
                ) : null}
                onEndReached={loadNextPage}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <DataQualityIssueItem issue={item} />
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    subtitle: { marginTop: 4, color: '#475569', fontSize: 14, lineHeight: 20 },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    searchInput: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 16,
    },
    clearButton: {
        minHeight: 48,
        justifyContent: 'center',
        marginLeft: 10,
        paddingHorizontal: 10,
    },
    clearButtonText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    inlineError: { marginHorizontal: 20, paddingVertical: 8 },
    errorText: { color: '#991B1B', fontSize: 14 },
    retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    list: { paddingTop: 4, paddingBottom: 100 },
    empty: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyText: { color: '#475569', fontSize: 16, lineHeight: 23, textAlign: 'center' },
    footer: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
})
