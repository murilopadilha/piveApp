import React from 'react'
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
import OpuSessionListItem from '../components/OpuSessionListItem'
import OpuStateMessage from '../components/OpuStateMessage'
import { useOpuSessionsQuery } from '../hooks/useOpuQueries'
import {
    OPU_PERMISSIONS,
    hasOpuPermission,
} from '../opuPermissions'
import { getOpuErrorMessage } from '../opuPresentation'
import { OPU_ROUTES } from '../routes'

export default function OpuSessionList({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.READ
    )
    const canWrite = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.WRITE
    )
    const sessionsQuery = useOpuSessionsQuery({
        organizationId: activeOrganizationId,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })
    const sessions = React.useMemo(
        () => sessionsQuery.data?.pages.flatMap(page => page.items) ?? [],
        [sessionsQuery.data]
    )
    const error = effectiveContextQuery.error ?? sessionsQuery.error
    const errorMessage = getOpuErrorMessage(error)
    const initialLoading = effectiveContextQuery.isPending ||
        (canRead && sessionsQuery.isPending)

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando OPUs"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando OPUs...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Você não tem permissão para consultar OPUs." />
            </SafeAreaView>
        )
    }

    if (errorMessage && sessions.length === 0) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage
                    message={errorMessage}
                    onRetry={() => {
                        if (effectiveContextQuery.error) {
                            void effectiveContextQuery.refetch()
                            return
                        }

                        void sessionsQuery.refetch()
                    }}
                />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.heading}>
                    <View>
                        <Text accessibilityRole="header" style={styles.title}>OPU</Text>
                        <Text style={styles.subtitle}>Sessões de coleta de oócitos</Text>
                    </View>
                    {canWrite ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Criar nova OPU"
                            onPress={() => navigation.navigate(OPU_ROUTES.CREATE)}
                            style={styles.createButton}
                        >
                            <Text style={styles.createText}>Nova OPU</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
            <FlatList
                data={sessions}
                keyExtractor={session => session.id}
                contentContainerStyle={sessions.length === 0
                    ? styles.emptyList
                    : styles.listContent}
                onEndReached={() => {
                    if (
                        sessionsQuery.hasNextPage &&
                        !sessionsQuery.isFetchingNextPage
                    ) {
                        void sessionsQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <OpuSessionListItem
                        session={item}
                        onPress={() => navigation.navigate(OPU_ROUTES.DETAIL, {
                            opuSessionId: item.id,
                        })}
                    />
                )}
                ListEmptyComponent={(
                    <Text style={styles.emptyText}>Nenhuma OPU registrada.</Text>
                )}
                ListFooterComponent={sessionsQuery.isFetchingNextPage ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Carregando mais OPUs"
                        style={styles.footer}
                    >
                        <ActivityIndicator size="small" color="#092955" />
                    </View>
                ) : errorMessage ? (
                    <OpuStateMessage
                        message={errorMessage}
                        onRetry={() => void sessionsQuery.refetch()}
                    />
                ) : null}
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
    heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 15, marginTop: 4 },
    stateText: { color: '#475569', fontSize: 15, marginTop: 12 },
    listContent: { paddingTop: 4, paddingBottom: 120 },
    emptyList: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 80,
    },
    emptyText: { color: '#475569', fontSize: 16, textAlign: 'center' },
    footer: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
    createButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#092955' },
    createText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
})
