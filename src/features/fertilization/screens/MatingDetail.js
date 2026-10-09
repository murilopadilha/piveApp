import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAnimalDetailQuery } from '../../animals/hooks/useAnimalQueries'
import { getAnimalName } from '../../animals/animalPresentation'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useProfessionalDetailQuery } from '../../opu/hooks/useOpuLookupQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    FertilizationField,
    FertilizationSection,
    FertilizationState,
} from '../components/FertilizationElements'
import { useMatingDetailQuery } from '../hooks/useMatingQueries'
import {
    MATING_PERMISSIONS,
    hasMatingPermission,
} from '../matingPermissions'
import {
    formatMatingTimestamp,
    getMatingErrorMessage,
    getMatingStatusLabel,
} from '../matingPresentation'

export default function MatingDetail({ route }) {
    const matingId = route.params?.matingId
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.READ
    )
    const detailQuery = useMatingDetailQuery({
        organizationId: activeOrganizationId,
        matingId,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })
    const canReadAnimals = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.MASTER_DATA_READ
    )
    const donorQuery = useAnimalDetailQuery({
        organizationId: activeOrganizationId,
        animalId: detailQuery.data?.lineage.donorId,
        enabled: Boolean(detailQuery.data) && canReadAnimals,
    })
    const professionalQuery = useProfessionalDetailQuery({
        organizationId: activeOrganizationId,
        professionalId: detailQuery.data?.mating.responsibleProfessionalId,
        enabled: Boolean(detailQuery.data?.mating.responsibleProfessionalId) &&
            canReadAnimals,
    })

    if (!matingId) {
        return <FertilizationState message="Alocação não identificada." />
    }

    if (effectiveContextQuery.isPending || (canRead && detailQuery.isPending)) {
        return <FertilizationState loading message="Carregando alocação" />
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return <FertilizationState message="Você não tem permissão para consultar esta alocação." />
    }

    const errorMessage = getMatingErrorMessage(
        effectiveContextQuery.error ?? detailQuery.error
    )

    if (errorMessage || !detailQuery.data) {
        return (
            <FertilizationState
                message={errorMessage ?? 'Não foi possível carregar a alocação.'}
                onRetry={() => void detailQuery.refetch()}
            />
        )
    }

    const { mating, lineage } = detailQuery.data
    const { batch, sire, producer } = lineage.semen

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Fertilização</Text>
                <Text style={styles.subtitle}>{getMatingStatusLabel(mating.status)}</Text>

                <FertilizationSection title="Alocação">
                    <FertilizationField label="Oócitos alocados" value={String(mating.allocatedOocytes)} />
                    <FertilizationField label="Método" value={mating.method} />
                    <FertilizationField label="Fertilizada em" value={formatMatingTimestamp(mating.fertilizedAt)} />
                    <FertilizationField label="Coleta de oócitos" value={lineage.collectionId} />
                    {mating.responsibleProfessionalId ? (
                        <FertilizationField
                            label="Profissional responsável"
                            value={professionalQuery.data?.name ?? 'Não disponível'}
                        />
                    ) : null}
                </FertilizationSection>

                <FertilizationSection title="Lineage">
                    <FertilizationField
                        label="Doadora"
                        value={donorQuery.data
                            ? getAnimalName(donorQuery.data)
                            : 'Identidade canônica não disponível'}
                    />
                    {donorQuery.error ? (
                        <Text accessibilityRole="alert" style={styles.partial}>
                            A apresentação atual da doadora não pôde ser carregada.
                        </Text>
                    ) : null}
                    <FertilizationField label="Lote de sêmen" value={batch.batchCode} />
                    <FertilizationField label="Reprodutor" value={sire.name?.trim() || 'Animal sem nome'} />
                    {sire.identifiers.map(identifier => (
                        <FertilizationField
                            key={`${identifier.type}:${identifier.issuer ?? ''}:${identifier.value}`}
                            label={identifier.type}
                            value={identifier.value}
                        />
                    ))}
                    <FertilizationField label="Produtor externo" value={producer.name} />
                </FertilizationSection>

                <FertilizationSection title="Proveniência">
                    <FertilizationField label="Origem" value={mating.provenance.originType} />
                    <FertilizationField label="Registrado em" value={formatMatingTimestamp(mating.provenance.recordedAt)} />
                    <FertilizationField label="Versão" value={String(mating.version)} />
                </FertilizationSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#166534', fontSize: 14, fontWeight: '600' },
    partial: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 10 },
})
