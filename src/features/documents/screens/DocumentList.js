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
import { DocumentState } from '../components/DocumentElements'
import DocumentListItem from '../components/DocumentListItem'
import {
    DOCUMENT_PERMISSIONS,
    hasDocumentPermission,
} from '../documentPermissions'
import { getDocumentErrorMessage } from '../documentPresentation'
import { useDocumentsQuery } from '../hooks/useDocumentQueries'
import { DOCUMENT_ROUTES } from '../routes'

export default function DocumentList({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasDocumentPermission(
        contextQuery.data,
        DOCUMENT_PERMISSIONS.READ
    )
    const documentsQuery = useDocumentsQuery({
        organizationId: activeOrganizationId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const documents = documentsQuery.data?.pages.flatMap(
        page => page.items
    ) ?? []
    const errorMessage = getDocumentErrorMessage(
        contextQuery.error ?? documentsQuery.error
    )

    if (contextQuery.isPending || (canRead && documentsQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState loading message="Carregando documentos" />
            </SafeAreaView>
        )
    }
    if (contextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState message="Você não tem permissão para consultar documentos." />
            </SafeAreaView>
        )
    }
    if (errorMessage && documents.length === 0) {
        const retry = contextQuery.error
            ? contextQuery.refetch
            : documentsQuery.refetch

        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState
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
                    Documents
                </Text>
                <Text style={styles.subtitle}>
                    Diretório e histórico imutável de versões
                </Text>
            </View>
            {errorMessage ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Tentar carregar documentos novamente"
                        onPress={() => void documentsQuery.refetch()}
                        style={styles.retry}
                    >
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={documents.length
                    ? styles.list
                    : styles.empty}
                data={documents}
                keyExtractor={item => item.id}
                ListEmptyComponent={(
                    <Text style={styles.emptyText}>
                        Nenhum documento encontrado.
                    </Text>
                )}
                ListFooterComponent={documentsQuery.isFetchingNextPage ? (
                    <ActivityIndicator
                        accessibilityLabel="Carregando mais documentos"
                        color="#092955"
                        style={styles.footer}
                    />
                ) : null}
                onEndReached={() => {
                    if (
                        documentsQuery.hasNextPage &&
                        !documentsQuery.isFetchingNextPage
                    ) {
                        void documentsQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <DocumentListItem
                        document={item}
                        onPress={() => navigation.navigate(
                            DOCUMENT_ROUTES.DETAIL,
                            { documentId: item.id }
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
