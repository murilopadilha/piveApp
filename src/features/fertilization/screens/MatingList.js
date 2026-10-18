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
import MatingListItem from '../components/MatingListItem'
import { useMatingsQuery } from '../hooks/useMatingQueries'
import {
    MATING_PERMISSIONS,
    canAllocateMatings,
    hasMatingPermission,
} from '../matingPermissions'
import { getMatingErrorMessage } from '../matingPresentation'
import { MATING_ROUTES } from '../routes'

export default function MatingList({ navigation, route }) {
    const oocyteCollectionId = route.params?.oocyteCollectionId ?? null
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.READ
    )
    const canCreate = canAllocateMatings(effectiveContextQuery.data) &&
        hasMatingPermission(
            effectiveContextQuery.data,
            MATING_PERMISSIONS.SEMEN_READ
        ) &&
        hasMatingPermission(
            effectiveContextQuery.data,
            MATING_PERMISSIONS.MASTER_DATA_READ
        )
    const matingsQuery = useMatingsQuery({
        organizationId: activeOrganizationId,
        collectionId: oocyteCollectionId,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })
    const matings = matingsQuery.data?.pages.flatMap(page => page.items) ?? []
    const errorMessage = getMatingErrorMessage(
        effectiveContextQuery.error ?? matingsQuery.error
    )

    if (effectiveContextQuery.isPending || (canRead && matingsQuery.isPending)) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="progressbar" accessibilityLabel="Carregando alocações" style={styles.centered}>
                    <ActivityIndicator color="#092955" size="large" />
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <View accessibilityRole="alert" style={styles.centered}>
                    <Text style={styles.message}>Você não tem permissão para consultar alocações.</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.heading}>
                    <View style={styles.headingText}>
                        <Text accessibilityRole="header" style={styles.title}>Fertilizações</Text>
                        <Text style={styles.subtitle}>Alocações registradas para a coleta</Text>
                    </View>
                    {oocyteCollectionId && canCreate ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Criar nova alocação"
                            onPress={() => navigation.navigate(
                                MATING_ROUTES.BATCH_CREATE,
                                { oocyteCollectionId }
                            )}
                            style={styles.createButton}
                        >
                            <Text style={styles.createText}>Nova alocação</Text>
                        </Pressable>
                    ) : null}
                </View>
                {hasMatingPermission(
                    effectiveContextQuery.data,
                    MATING_PERMISSIONS.SEMEN_READ
                ) ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Consultar lotes de sêmen"
                        onPress={() => navigation.navigate(
                            MATING_ROUTES.SEMEN_BATCH_SEARCH
                        )}
                        style={styles.semenLink}
                    >
                        <Text style={styles.semenLinkText}>Consultar lotes de sêmen</Text>
                    </Pressable>
                ) : null}
            </View>
            <FlatList
                contentContainerStyle={matings.length === 0
                    ? styles.emptyList
                    : styles.list}
                data={matings}
                keyExtractor={mating => mating.id}
                ListEmptyComponent={(
                    <Text style={styles.message}>Nenhuma fertilização registrada.</Text>
                )}
                ListFooterComponent={matingsQuery.isFetchingNextPage ? (
                    <ActivityIndicator color="#092955" style={styles.footer} />
                ) : errorMessage ? (
                    <View accessibilityRole="alert" style={styles.footer}>
                        <Text style={styles.message}>{errorMessage}</Text>
                    </View>
                ) : null}
                onEndReached={() => {
                    if (matingsQuery.hasNextPage && !matingsQuery.isFetchingNextPage) {
                        void matingsQuery.fetchNextPage()
                    }
                }}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                    <MatingListItem
                        mating={item}
                        onPress={() => navigation.navigate(MATING_ROUTES.DETAIL, {
                            matingId: item.id,
                        })}
                    />
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headingText: { flex: 1, paddingRight: 12 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 14, marginTop: 4 },
    list: { paddingTop: 4, paddingBottom: 80 },
    emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    message: { color: '#475569', fontSize: 15, textAlign: 'center' },
    footer: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
    createButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#092955' },
    createText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    semenLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 6 },
    semenLinkText: { color: '#092955', fontSize: 14, fontWeight: '700' },
})
