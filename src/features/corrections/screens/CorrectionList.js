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
import { CorrectionState } from '../components/CorrectionElements'
import CorrectionListItem from '../components/CorrectionListItem'
import {
    CORRECTION_PERMISSIONS,
    hasCorrectionPermission,
} from '../correctionPermissions'
import { getCorrectionErrorMessage } from '../correctionPresentation'
import { useCorrectionsQuery } from '../hooks/useCorrectionQueries'
import { CORRECTION_ROUTES } from '../routes'

export default function CorrectionList({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasCorrectionPermission(
        contextQuery.data,
        CORRECTION_PERMISSIONS.READ
    )
    const correctionsQuery = useCorrectionsQuery({
        organizationId: activeOrganizationId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const corrections = correctionsQuery.data?.pages.flatMap(
        page => page.items
    ) ?? []
    const errorMessage = getCorrectionErrorMessage(
        contextQuery.error ?? correctionsQuery.error
    )

    if (contextQuery.isPending || (canRead && correctionsQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState
                    loading
                    message="Carregando solicitações de correção"
                />
            </SafeAreaView>
        )
    }
    if (contextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState message="Você não tem permissão para consultar solicitações de correção." />
            </SafeAreaView>
        )
    }
    if (errorMessage && corrections.length === 0) {
        const retry = contextQuery.error
            ? contextQuery.refetch
            : correctionsQuery.refetch

        return (
            <SafeAreaView style={styles.screen}>
                <CorrectionState
                    message={errorMessage}
                    onRetry={() => void retry()}
                />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                    Solicitações de correção histórica
                </Text>
                <Text style={styles.subtitle}>
                    Registro imutável das solicitações; nenhuma alteração é aplicada por esta tela.
                </Text>
            </View>
            {errorMessage ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Tentar carregar solicitações novamente"
                        accessibilityState={{
                            busy: correctionsQuery.isFetching,
                            disabled: correctionsQuery.isFetching,
                        }}
                        disabled={correctionsQuery.isFetching}
                        onPress={() => void correctionsQuery.refetch()}
                        style={styles.retry}
                    >
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={corrections.length
                    ? styles.list
                    : styles.empty}
                data={corrections}
                keyExtractor={item => item.id}
                ListEmptyComponent={(
                    <Text style={styles.emptyText}>
                        Nenhuma solicitação de correção encontrada.
                    </Text>
                )}
                ListFooterComponent={correctionsQuery.isFetchingNextPage ? (
                    <ActivityIndicator
                        accessibilityLabel="Carregando mais solicitações de correção"
                        color="#092955"
                        style={styles.footer}
                    />
                ) : null}
                onEndReached={() => {
                    if (
                        correctionsQuery.hasNextPage &&
                        !correctionsQuery.isFetchingNextPage
                    ) {
                        void correctionsQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <CorrectionListItem
                        correction={item}
                        onPress={() => navigation.navigate(
                            CORRECTION_ROUTES.DETAIL,
                            { correctionId: item.id }
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
    subtitle: { marginTop: 4, color: '#475569', fontSize: 14, lineHeight: 20 },
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
    emptyText: { color: '#475569', fontSize: 16, textAlign: 'center' },
    footer: { marginVertical: 20 },
})
