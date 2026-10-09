import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAnimalDetailQuery } from '../../animals/hooks/useAnimalQueries'
import { getAnimalName } from '../../animals/animalPresentation'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import {
    FertilizationField,
    FertilizationSection,
    FertilizationState,
} from '../../fertilization/components/FertilizationElements'
import {
    MATING_PERMISSIONS,
    hasMatingPermission,
} from '../../fertilization/matingPermissions'
import {
    formatMatingTimestamp,
    getMatingErrorMessage,
} from '../../fertilization/matingPresentation'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    useExternalEstablishmentDetailQuery,
    useSemenBatchDetailQuery,
} from '../hooks/useSemenQueries'

export default function SemenBatchDetail({ route }) {
    const semenBatchId = route.params?.semenBatchId
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.SEMEN_READ
    )
    const canReadAnimals = hasMatingPermission(
        effectiveContextQuery.data,
        MATING_PERMISSIONS.MASTER_DATA_READ
    )
    const batchQuery = useSemenBatchDetailQuery({
        organizationId: activeOrganizationId,
        semenBatchId,
        enabled: effectiveContextQuery.isSuccess && canRead,
    })
    const batch = batchQuery.data
    const sireQuery = useAnimalDetailQuery({
        organizationId: activeOrganizationId,
        animalId: batch?.sireId,
        enabled: Boolean(batch) && canReadAnimals,
    })
    const producerQuery = useExternalEstablishmentDetailQuery({
        organizationId: activeOrganizationId,
        externalEstablishmentId: batch?.producerEstablishmentId,
        enabled: Boolean(batch) && canRead,
    })

    if (!semenBatchId) {
        return <FertilizationState message="Lote de sêmen não identificado." />
    }

    if (effectiveContextQuery.isPending || (canRead && batchQuery.isPending)) {
        return <FertilizationState loading message="Carregando lote de sêmen" />
    }

    if (effectiveContextQuery.isSuccess && !canRead) {
        return <FertilizationState message="Você não tem permissão para consultar este lote." />
    }

    const errorMessage = getMatingErrorMessage(
        effectiveContextQuery.error ?? batchQuery.error,
        'Lote de sêmen não encontrado nesta organização.'
    )

    if (errorMessage || !batch) {
        return (
            <FertilizationState
                message={errorMessage ?? 'Não foi possível carregar o lote.'}
                onRetry={() => void batchQuery.refetch()}
            />
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>{batch.batchCode}</Text>
                <Text style={styles.subtitle}>Registro operacional e proveniência</Text>

                <FertilizationSection title="Lote de sêmen">
                    <FertilizationField label="Código" value={batch.batchCode} />
                    <FertilizationField label="Situação" value={batch.status} />
                    <FertilizationField label="Tipo" value={batch.semenType ?? 'Não informado'} />
                    <FertilizationField label="Código de proveniência" value={batch.provenanceCode} />
                    <FertilizationField label="Verificação" value={batch.verificationStatus} />
                    <FertilizationField label="Recebido em" value={formatMatingTimestamp(batch.receivedAt)} />
                    {batch.ownerId ? (
                        <FertilizationField label="Referência do proprietário" value={batch.ownerId} />
                    ) : null}
                </FertilizationSection>

                <FertilizationSection title="Reprodutor derivado do lote">
                    {!canReadAnimals ? (
                        <Text style={styles.partial}>Sem permissão para consultar o Animal.</Text>
                    ) : sireQuery.isPending ? (
                        <Text style={styles.partial}>Carregando Animal...</Text>
                    ) : sireQuery.error ? (
                        <Text accessibilityRole="alert" style={styles.partial}>
                            O Animal não pôde ser carregado. A referência do lote foi preservada.
                        </Text>
                    ) : (
                        <FertilizationField label="Animal" value={getAnimalName(sireQuery.data)} />
                    )}
                    <FertilizationField label="Animal ID" value={batch.sireId} />
                </FertilizationSection>

                <FertilizationSection title="Produtor externo">
                    {producerQuery.isPending ? (
                        <Text style={styles.partial}>Carregando produtor...</Text>
                    ) : producerQuery.error ? (
                        <Text accessibilityRole="alert" style={styles.partial}>
                            O produtor não pôde ser carregado.
                        </Text>
                    ) : producerQuery.data ? (
                        <>
                            <FertilizationField label="Nome" value={producerQuery.data.name} />
                            <FertilizationField label="Tipo" value={producerQuery.data.establishmentType} />
                            <FertilizationField label="País" value={producerQuery.data.country} />
                            <FertilizationField label="Situação" value={producerQuery.data.status} />
                        </>
                    ) : null}
                </FertilizationSection>

                <FertilizationSection title="Proveniência do registro">
                    <FertilizationField label="Origem" value={batch.provenance.originType} />
                    <FertilizationField label="Registrado em" value={formatMatingTimestamp(batch.provenance.recordedAt)} />
                    <FertilizationField label="Versão" value={String(batch.version)} />
                </FertilizationSection>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 80 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 14 },
    partial: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 12 },
})
