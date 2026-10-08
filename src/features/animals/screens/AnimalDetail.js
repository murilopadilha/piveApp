import React from 'react'
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
    ANIMAL_PERMISSIONS,
    hasAnimalPermission,
} from '../animalPermissions'
import {
    formatAnimalDate,
    formatAnimalTimestamp,
    getAnimalErrorMessage,
    getAnimalName,
    getAnimalSexLabel,
    getAnimalStatusLabel,
    getBreedStatusLabel,
    getIdentifierStatusLabel,
    getOriginTypeLabel,
} from '../animalPresentation'
import AnimalStateMessage from '../components/AnimalStateMessage'
import {
    useAnimalDetailQuery,
    useAnimalIdentifiersQuery,
    useAnimalOwnersQueries,
    useAnimalOwnershipQuery,
    useBreedDetailQuery,
} from '../hooks/useAnimalQueries'

function DetailField({ label, value }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    )
}

function DetailSection({ title, children }) {
    return (
        <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
                {title}
            </Text>
            {children}
        </View>
    )
}

function SectionLoading({ label }) {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel={label}
            style={styles.sectionLoading}
        >
            <ActivityIndicator size="small" color="#092955" />
            <Text style={styles.sectionStateText}>{label}</Text>
        </View>
    )
}

function SectionError({ message, onRetry }) {
    return (
        <View accessibilityRole="alert" style={styles.sectionState}>
            <Text style={styles.sectionStateText}>{message}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente"
                onPress={onRetry}
                style={styles.secondaryButton}
            >
                <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
        </View>
    )
}

function LoadMoreButton({ label, loading, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ busy: loading, disabled: loading }}
            disabled={loading}
            onPress={onPress}
            style={({ pressed }) => [
                styles.loadMoreButton,
                pressed && styles.buttonPressed,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <Text style={styles.loadMoreText}>{label}</Text>
            )}
        </Pressable>
    )
}

function IdentifierHistory({ entries, query }) {
    if (query.isPending) {
        return <SectionLoading label="Carregando identificadores" />
    }

    const errorMessage = getAnimalErrorMessage(
        query.error,
        'Histórico de identificadores não encontrado.'
    )

    if (errorMessage && entries.length === 0) {
        return (
            <SectionError
                message={errorMessage}
                onRetry={() => void query.refetch()}
            />
        )
    }

    if (entries.length === 0) {
        return <Text style={styles.emptySection}>Nenhum identificador registrado.</Text>
    }

    return (
        <>
            {entries.map(entry => (
                <View key={entry.id} style={styles.historyItem}>
                    <Text style={styles.historyTitle}>
                        {entry.type}: {entry.value}
                    </Text>
                    {entry.issuer ? (
                        <Text style={styles.historyText}>Emissor: {entry.issuer}</Text>
                    ) : null}
                    <Text style={styles.historyText}>
                        Vigência: {formatAnimalDate(entry.validFrom)} até{' '}
                        {formatAnimalDate(entry.validUntil, 'em aberto')}
                    </Text>
                    <Text style={styles.historyText}>
                        Situação: {getIdentifierStatusLabel(entry.status)}
                    </Text>
                </View>
            ))}
            {errorMessage ? (
                <SectionError
                    message={errorMessage}
                    onRetry={() => void query.refetch()}
                />
            ) : null}
            {query.hasNextPage ? (
                <LoadMoreButton
                    label="Carregar mais identificadores"
                    loading={query.isFetchingNextPage}
                    onPress={() => void query.fetchNextPage()}
                />
            ) : null}
        </>
    )
}

function OwnershipHistory({ assignments, owners, query }) {
    if (query.isPending) {
        return <SectionLoading label="Carregando histórico de propriedade" />
    }

    const errorMessage = getAnimalErrorMessage(
        query.error,
        'Histórico de propriedade não encontrado.'
    )

    if (errorMessage && assignments.length === 0) {
        return (
            <SectionError
                message={errorMessage}
                onRetry={() => void query.refetch()}
            />
        )
    }

    if (assignments.length === 0) {
        return <Text style={styles.emptySection}>Nenhum vínculo de propriedade registrado.</Text>
    }

    const failedOwners = owners.filter(owner => owner.error)

    return (
        <>
            {assignments.map(assignment => {
                const ownerQuery = owners.find(
                    owner => owner.ownerId === assignment.ownerId
                )
                const owner = ownerQuery?.data
                const ownerLabel = owner?.displayName ?? (
                    ownerQuery?.isPending
                        ? 'Carregando proprietário...'
                        : 'Proprietário não disponível'
                )

                return (
                    <View key={assignment.id} style={styles.historyItem}>
                        <Text style={styles.historyTitle}>
                            {ownerLabel}
                        </Text>
                        {owner?.legalName ? (
                            <Text style={styles.historyText}>{owner.legalName}</Text>
                        ) : null}
                        <Text style={styles.historyText}>
                            Período: {formatAnimalDate(assignment.from)} até{' '}
                            {formatAnimalDate(assignment.until, 'em aberto')}
                        </Text>
                        {!assignment.until ? (
                            <Text style={styles.openAssignment}>Vínculo em aberto</Text>
                        ) : null}
                    </View>
                )
            })}
            {failedOwners.length > 0 ? (
                <SectionError
                    message="Alguns proprietários não puderam ser apresentados."
                    onRetry={() => failedOwners.forEach(owner => void owner.refetch())}
                />
            ) : null}
            {errorMessage ? (
                <SectionError
                    message={errorMessage}
                    onRetry={() => void query.refetch()}
                />
            ) : null}
            {query.hasNextPage ? (
                <LoadMoreButton
                    label="Carregar mais vínculos"
                    loading={query.isFetchingNextPage}
                    onPress={() => void query.fetchNextPage()}
                />
            ) : null}
        </>
    )
}

export default function AnimalDetail({ route }) {
    const animalId = route.params?.animalId
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasAnimalPermission(
        effectiveContextQuery.data,
        ANIMAL_PERMISSIONS.READ
    )
    const detailEnabled = effectiveContextQuery.isSuccess && canRead
    const animalQuery = useAnimalDetailQuery({
        organizationId: activeOrganizationId,
        animalId,
        enabled: detailEnabled,
    })
    const relatedEnabled = detailEnabled && animalQuery.isSuccess
    const breedQuery = useBreedDetailQuery({
        organizationId: activeOrganizationId,
        breedId: animalQuery.data?.breedId,
        enabled: relatedEnabled,
    })
    const identifiersQuery = useAnimalIdentifiersQuery({
        organizationId: activeOrganizationId,
        animalId,
        enabled: relatedEnabled,
    })
    const ownershipQuery = useAnimalOwnershipQuery({
        organizationId: activeOrganizationId,
        animalId,
        enabled: relatedEnabled,
    })
    const assignments = React.useMemo(
        () => ownershipQuery.data?.pages.flatMap(page => page.items) ?? [],
        [ownershipQuery.data]
    )
    const ownerIds = React.useMemo(
        () => assignments.map(assignment => assignment.ownerId),
        [assignments]
    )
    const ownerQueries = useAnimalOwnersQueries({
        organizationId: activeOrganizationId,
        ownerIds,
        enabled: relatedEnabled && ownershipQuery.isSuccess,
    })
    const identifiers = React.useMemo(
        () => identifiersQuery.data?.pages.flatMap(page => page.items) ?? [],
        [identifiersQuery.data]
    )
    const initialLoading = effectiveContextQuery.isPending ||
        (canRead && animalQuery.isPending)
    const mainError = effectiveContextQuery.error ?? animalQuery.error
    const mainErrorMessage = getAnimalErrorMessage(mainError)

    const retryMain = () => {
        if (effectiveContextQuery.error) {
            void effectiveContextQuery.refetch()
            return
        }

        void animalQuery.refetch()
    }

    if (!animalId) {
        return (
            <SafeAreaView style={styles.screen}>
                <AnimalStateMessage message="Animal não identificado." />
            </SafeAreaView>
        )
    }

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando detalhes do animal"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando animal...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return (
            <SafeAreaView style={styles.screen}>
                <AnimalStateMessage message="Você não tem permissão para consultar este animal." />
            </SafeAreaView>
        )
    }

    if (mainErrorMessage) {
        return (
            <SafeAreaView style={styles.screen}>
                <AnimalStateMessage message={mainErrorMessage} onRetry={retryMain} />
            </SafeAreaView>
        )
    }

    const animal = animalQuery.data

    if (!animal) {
        return (
            <SafeAreaView style={styles.screen}>
                <AnimalStateMessage
                    message="Não foi possível carregar o animal."
                    onRetry={retryMain}
                />
            </SafeAreaView>
        )
    }

    const breedErrorMessage = getAnimalErrorMessage(
        breedQuery.error,
        'Raça não encontrada nesta organização.'
    )

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    {getAnimalName(animal)}
                </Text>
                <Text style={styles.subtitle}>Identidade animal</Text>

                <DetailSection title="Dados básicos">
                    <DetailField label="Sexo" value={getAnimalSexLabel(animal.sex)} />
                    <DetailField
                        label="Nascimento"
                        value={formatAnimalDate(animal.birthDate)}
                    />
                    <DetailField
                        label="Situação"
                        value={getAnimalStatusLabel(animal.status)}
                    />
                    <DetailField label="Versão" value={String(animal.version)} />
                </DetailSection>

                <DetailSection title="Raça">
                    {!animal.breedId ? (
                        <Text style={styles.emptySection}>Raça não informada.</Text>
                    ) : breedQuery.isPending ? (
                        <SectionLoading label="Carregando raça" />
                    ) : breedErrorMessage ? (
                        <SectionError
                            message={breedErrorMessage}
                            onRetry={() => void breedQuery.refetch()}
                        />
                    ) : (
                        <>
                            <DetailField label="Nome" value={breedQuery.data.name} />
                            {breedQuery.data.code ? (
                                <DetailField label="Código" value={breedQuery.data.code} />
                            ) : null}
                            <DetailField
                                label="Situação"
                                value={getBreedStatusLabel(breedQuery.data.status)}
                            />
                        </>
                    )}
                </DetailSection>

                <DetailSection title="Identificadores">
                    <IdentifierHistory entries={identifiers} query={identifiersQuery} />
                </DetailSection>

                <DetailSection title="Histórico de propriedade">
                    <OwnershipHistory
                        assignments={assignments}
                        owners={ownerQueries}
                        query={ownershipQuery}
                    />
                </DetailSection>

                <DetailSection title="Proveniência">
                    <DetailField
                        label="Origem"
                        value={getOriginTypeLabel(animal.originType)}
                    />
                    <DetailField label="Registrado por" value={animal.recordedBy} />
                    <DetailField
                        label="Registrado em"
                        value={formatAnimalTimestamp(animal.recordedAt)}
                    />
                </DetailSection>
            </ScrollView>
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
    stateText: { color: '#475569', fontSize: 15, marginTop: 12 },
    content: { padding: 20, paddingBottom: 120 },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    subtitle: { color: '#64748B', fontSize: 14, marginTop: 5 },
    section: {
        marginTop: 18,
        paddingHorizontal: 18,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        color: '#092955',
        fontSize: 18,
        fontWeight: '700',
        paddingTop: 16,
        paddingBottom: 5,
    },
    field: {
        minHeight: 60,
        justifyContent: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#CBD5E1',
    },
    label: { color: '#475569', fontSize: 13, fontWeight: '600' },
    value: { color: '#0F172A', fontSize: 16, marginTop: 4 },
    sectionLoading: {
        minHeight: 76,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionState: { alignItems: 'center', paddingVertical: 18 },
    sectionStateText: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 8,
        textAlign: 'center',
    },
    secondaryButton: {
        minHeight: 44,
        justifyContent: 'center',
        marginTop: 12,
        paddingHorizontal: 18,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#092955',
    },
    secondaryButtonText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    emptySection: { color: '#64748B', fontSize: 14, paddingVertical: 18 },
    historyItem: {
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#CBD5E1',
    },
    historyTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
    historyText: { color: '#475569', fontSize: 14, marginTop: 4 },
    openAssignment: {
        color: '#166534',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 6,
    },
    loadMoreButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 14,
        borderRadius: 24,
        backgroundColor: '#092955',
    },
    loadMoreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    buttonPressed: { opacity: 0.75 },
})
