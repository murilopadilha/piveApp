import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    DocumentField,
    DocumentSection,
    DocumentState,
} from '../components/DocumentElements'
import DocumentVersionItem from '../components/DocumentVersionItem'
import {
    DOCUMENT_PERMISSIONS,
    hasDocumentPermission,
} from '../documentPermissions'
import {
    formatDocumentTimestamp,
    getDocumentErrorMessage,
} from '../documentPresentation'
import {
    useDocumentDetailQuery,
    useDocumentVersionsQuery,
} from '../hooks/useDocumentQueries'

export default function DocumentDetail({ route }) {
    const documentId = route.params?.documentId
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasDocumentPermission(
        contextQuery.data,
        DOCUMENT_PERMISSIONS.READ
    )
    const documentQuery = useDocumentDetailQuery({
        organizationId: activeOrganizationId,
        documentId,
        enabled: contextQuery.isSuccess && canRead,
    })
    const versionsQuery = useDocumentVersionsQuery({
        organizationId: activeOrganizationId,
        documentId,
        enabled: contextQuery.isSuccess && canRead,
    })

    if (!documentId) {
        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState message="Documento não identificado." />
            </SafeAreaView>
        )
    }
    if (contextQuery.isPending || (canRead && documentQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState loading message="Carregando documento" />
            </SafeAreaView>
        )
    }
    if (contextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState message="Você não tem permissão para consultar este documento." />
            </SafeAreaView>
        )
    }
    const detailError = getDocumentErrorMessage(
        contextQuery.error ?? documentQuery.error
    )
    if (detailError || !documentQuery.data) {
        const retry = contextQuery.error
            ? contextQuery.refetch
            : documentQuery.refetch

        return (
            <SafeAreaView style={styles.screen}>
                <DocumentState
                    message={detailError ?? 'Não foi possível carregar o documento.'}
                    onRetry={() => void retry()}
                />
            </SafeAreaView>
        )
    }

    const document = documentQuery.data
    const versions = versionsQuery.data?.pages.flatMap(page => page.items) ?? []
    const versionsError = getDocumentErrorMessage(versionsQuery.error)

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    {document.typeCode}
                </Text>
                <Text style={styles.subtitle}>{document.status}</Text>

                <DocumentSection title="Document">
                    <DocumentField label="ID" selectable value={document.id} />
                    <DocumentField label="Código do tipo" value={document.typeCode} />
                    <DocumentField label="Status" value={document.status} />
                    <DocumentField
                        label="Versão atual"
                        selectable
                        value={document.currentVersionId ?? 'Nenhuma'}
                    />
                    <DocumentField
                        label="Versão do registro"
                        value={String(document.version)}
                    />
                    <DocumentField
                        label="Criado em"
                        value={formatDocumentTimestamp(document.createdAt)}
                    />
                </DocumentSection>

                <DocumentSection title="Histórico imutável de versões">
                    {versionsQuery.isPending ? (
                        <View
                            accessibilityRole="progressbar"
                            accessibilityLabel="Carregando histórico de versões"
                            style={styles.loading}
                        >
                            <ActivityIndicator color="#092955" />
                            <Text style={styles.help}>Carregando versões...</Text>
                        </View>
                    ) : null}
                    {versionsError ? (
                        <View accessibilityRole="alert">
                            <Text style={styles.error}>{versionsError}</Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Tentar carregar versões novamente"
                                onPress={() => void versionsQuery.refetch()}
                                style={styles.linkButton}
                            >
                                <Text style={styles.linkText}>Tentar novamente</Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {!versionsQuery.isPending && !versionsError && versions.length === 0 ? (
                        <Text style={styles.help}>Nenhuma versão registrada.</Text>
                    ) : null}
                    {versions.map(version => (
                        <DocumentVersionItem
                            current={version.id === document.currentVersionId}
                            key={version.id}
                            version={version}
                        />
                    ))}
                    {versionsQuery.hasNextPage ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Carregar mais versões"
                            accessibilityState={{
                                busy: versionsQuery.isFetchingNextPage,
                                disabled: versionsQuery.isFetchingNextPage,
                            }}
                            disabled={versionsQuery.isFetchingNextPage}
                            onPress={() => void versionsQuery.fetchNextPage()}
                            style={styles.moreButton}
                        >
                            {versionsQuery.isFetchingNextPage ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.moreText}>Carregar mais</Text>
                            )}
                        </Pressable>
                    ) : null}
                </DocumentSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: {
        marginHorizontal: 20,
        color: '#092955',
        fontSize: 25,
        fontWeight: '700',
    },
    subtitle: {
        marginHorizontal: 20,
        marginTop: 4,
        marginBottom: 18,
        color: '#334155',
        fontSize: 14,
        fontWeight: '700',
    },
    loading: { alignItems: 'center', paddingVertical: 16 },
    help: { marginTop: 8, color: '#475569', fontSize: 14, lineHeight: 20 },
    error: { color: '#991B1B', fontSize: 14, lineHeight: 20 },
    linkButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    linkText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    moreButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        backgroundColor: '#092955',
    },
    moreText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})
