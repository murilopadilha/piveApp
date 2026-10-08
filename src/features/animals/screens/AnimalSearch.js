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
    ANIMAL_PERMISSIONS,
    hasAnimalPermission,
} from '../animalPermissions'
import { getAnimalErrorMessage } from '../animalPresentation'
import AnimalListItem from '../components/AnimalListItem'
import AnimalStateMessage from '../components/AnimalStateMessage'
import { useAnimalsQuery } from '../hooks/useAnimalQueries'
import { ANIMAL_ROUTES } from '../routes'

const SEARCH_DELAY_MS = 500

export default function AnimalSearch({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [searchText, setSearchText] = React.useState('')
    const [query, setQuery] = React.useState('')
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasAnimalPermission(
        effectiveContextQuery.data,
        ANIMAL_PERMISSIONS.READ
    )
    const animalsQuery = useAnimalsQuery({
        organizationId: activeOrganizationId,
        query,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })

    React.useEffect(() => {
        const timeout = setTimeout(() => setQuery(searchText.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [searchText])

    const animals = animalsQuery.data?.pages.flatMap(page => page.items) ?? []
    const initialLoading = effectiveContextQuery.isPending ||
        (canRead && animalsQuery.isPending)
    const error = effectiveContextQuery.error ?? animalsQuery.error
    const errorMessage = getAnimalErrorMessage(error)

    const loadNextPage = React.useCallback(() => {
        if (animalsQuery.hasNextPage && !animalsQuery.isFetchingNextPage) {
            void animalsQuery.fetchNextPage()
        }
    }, [animalsQuery])

    const retry = React.useCallback(() => {
        if (effectiveContextQuery.error) {
            void effectiveContextQuery.refetch()
            return
        }

        void animalsQuery.refetch()
    }, [animalsQuery, effectiveContextQuery])

    const renderItem = React.useCallback(({ item }) => (
        <AnimalListItem
            animal={item}
            onOpen={() => navigation.navigate(ANIMAL_ROUTES.DETAIL, {
                animalId: item.id,
            })}
        />
    ), [navigation])

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando animais"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando animais...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <AnimalStateMessage message="Você não tem permissão para consultar animais." />
            </SafeAreaView>
        )
    }

    if (errorMessage && animals.length === 0) {
        return (
            <SafeAreaView style={styles.screen}>
                <AnimalStateMessage message={errorMessage} onRetry={retry} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                    Diretório de animais
                </Text>
                <Text style={styles.subtitle}>
                    Consulte a identidade canônica dos animais.
                </Text>
                <TextInput
                    accessibilityLabel="Buscar animais"
                    accessibilityHint="Busca por nome ou identificador ativo"
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
                    <AnimalStateMessage message={errorMessage} onRetry={retry} />
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={animals.length === 0
                    ? styles.emptyList
                    : styles.listContent}
                data={animals}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={(
                    <Text accessibilityRole="text" style={styles.emptyText}>
                        {query
                            ? 'Nenhum animal encontrado para esta busca.'
                            : 'Nenhum animal cadastrado.'}
                    </Text>
                )}
                ListFooterComponent={animalsQuery.isFetchingNextPage ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Carregando mais animais"
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
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 15, marginTop: 4 },
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
    stateText: { color: '#475569', fontSize: 15, marginTop: 12 },
    listContent: { paddingTop: 4, paddingBottom: 120 },
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
    footer: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
    inlineError: { minHeight: 140 },
})
