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
import { useMatingDetailQuery } from '../../fertilization/hooks/useMatingQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import EmbryoListItem from '../components/EmbryoListItem'
import { EmbryoState } from '../components/EmbryoElements'
import {
    EMBRYO_PERMISSIONS,
    hasEmbryoPermission,
} from '../embryoPermissions'
import { getEmbryoErrorMessage } from '../embryoPresentation'
import { useEmbryosQuery } from '../hooks/useEmbryoQueries'
import { EMBRYO_ROUTES } from '../routes'

const SEARCH_DELAY_MS = 500

export default function EmbryoList({ navigation, route }) {
    const matingId = route.params?.matingId ?? null
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.READ
    )
    const canIdentify = hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.WRITE
    ) && hasEmbryoPermission(
        effectiveContextQuery.data,
        EMBRYO_PERMISSIONS.MATING_READ
    )
    const embryosQuery = useEmbryosQuery({
        organizationId: activeOrganizationId,
        matingId,
        query,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })
    const matingQuery = useMatingDetailQuery({
        organizationId: activeOrganizationId,
        matingId,
        enabled: effectiveContextQuery.isSuccess && Boolean(matingId) &&
            canIdentify,
    })

    React.useEffect(() => {
        const timeout = setTimeout(() => setQuery(searchText.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [searchText])

    const embryos = embryosQuery.data?.pages.flatMap(page => page.items) ?? []
    const errorMessage = getEmbryoErrorMessage(
        effectiveContextQuery.error ?? embryosQuery.error
    )
    const canOpenIdentification = Boolean(matingId) && canIdentify &&
        matingQuery.data?.mating.status === 'FERTILIZED'

    const retry = () => {
        if (effectiveContextQuery.error) {
            void effectiveContextQuery.refetch()
            return
        }

        void embryosQuery.refetch()
    }

    if (effectiveContextQuery.isPending || (canRead && embryosQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState loading message="Carregando embriões" />
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message="Você não tem permissão para consultar embriões." />
            </SafeAreaView>
        )
    }

    if (errorMessage && embryos.length === 0) {
        return (
            <SafeAreaView style={styles.screen}>
                <EmbryoState message={errorMessage} onRetry={retry} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.heading}>
                    <View style={styles.headingText}>
                        <Text accessibilityRole="header" style={styles.title}>
                            Embriões
                        </Text>
                        <Text style={styles.subtitle}>
                            {matingId
                                ? 'Identidades vinculadas à fertilização.'
                                : 'Diretório de embriões individualizados.'}
                        </Text>
                    </View>
                    {canOpenIdentification ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Identificar embriões"
                            accessibilityHint="Abre a identificação atômica para esta fertilização"
                            onPress={() => navigation.navigate(
                                EMBRYO_ROUTES.BATCH_IDENTIFY,
                                { matingId }
                            )}
                            style={styles.identifyButton}
                        >
                            <Text style={styles.identifyText}>Identificar</Text>
                        </Pressable>
                    ) : null}
                </View>
                <TextInput
                    accessibilityLabel="Buscar embriões"
                    accessibilityHint="Busca pelo código humano do embrião"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setSearchText}
                    placeholder="Código do embrião"
                    placeholderTextColor="#64748B"
                    returnKeyType="search"
                    style={styles.searchInput}
                    value={searchText}
                />
            </View>
            {matingId && canIdentify && matingQuery.isSuccess &&
            matingQuery.data?.mating.status !== 'FERTILIZED' ? (
                <Text accessibilityRole="text" style={styles.closedMessage}>
                    Esta fertilização não está aberta para novas identificações.
                </Text>
            ) : null}
            {errorMessage ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Tentar novamente"
                        onPress={retry}
                        style={styles.retryButton}
                    >
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={embryos.length === 0
                    ? styles.emptyList
                    : styles.list}
                data={embryos}
                keyExtractor={embryo => embryo.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={(
                    <Text style={styles.emptyText}>
                        {query
                            ? 'Nenhum embrião encontrado para esta busca.'
                            : 'Nenhum embrião individualizado.'}
                    </Text>
                )}
                ListFooterComponent={embryosQuery.isFetchingNextPage ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Carregando mais embriões"
                        style={styles.footer}
                    >
                        <ActivityIndicator color="#092955" />
                    </View>
                ) : null}
                onEndReached={() => {
                    if (embryosQuery.hasNextPage && !embryosQuery.isFetchingNextPage) {
                        void embryosQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <EmbryoListItem
                        embryo={item}
                        onOpen={() => navigation.navigate(EMBRYO_ROUTES.DETAIL, {
                            embryoId: item.id,
                        })}
                    />
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headingText: { flex: 1, paddingRight: 12 },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 15, marginTop: 4 },
    identifyButton: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderRadius: 22,
        backgroundColor: '#092955',
    },
    identifyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
    closedMessage: {
        marginHorizontal: 20,
        marginBottom: 8,
        color: '#92400E',
        fontSize: 14,
    },
    inlineError: { marginHorizontal: 20, paddingVertical: 10 },
    errorText: { color: '#991B1B', fontSize: 14, lineHeight: 20 },
    retryButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    list: { paddingTop: 4, paddingBottom: 100 },
    emptyList: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyText: { color: '#475569', fontSize: 16, textAlign: 'center' },
    footer: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
})
