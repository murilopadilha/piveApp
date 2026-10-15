import React from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    DistributionField,
    DistributionSection,
    DistributionState,
} from '../components/DistributionElements'
import {
    DISTRIBUTION_PERMISSIONS,
    hasDistributionPermission,
} from '../distributionPermissions'
import {
    formatDistributionTimestamp,
    formatShipmentStatus,
    getShipmentErrorMessage,
} from '../distributionPresentation'
import {
    useShipmentDetailQuery,
    useShipmentValidationQuery,
} from '../hooks/useDistributionQueries'

function ShipmentDocument({ document }) {
    return (
        <View accessible accessibilityLabel={`Documento vinculado ${document.typeCode}, versão ${document.versionId}`} style={styles.card}>
            <DistributionField label="Tipo" value={document.typeCode} />
            <DistributionField label="Document ID" selectable value={document.documentId} />
            <DistributionField label="Version ID" selectable value={document.versionId} />
            {document.number ? <DistributionField label="Número" value={document.number} /> : null}
            {document.issuer ? <DistributionField label="Emissor" value={document.issuer} /> : null}
            {document.issuedAt ? <DistributionField label="Emitido em" value={formatDistributionTimestamp(document.issuedAt)} /> : null}
        </View>
    )
}

function ValidationResult({ query }) {
    if (query.isFetching) {
        return (
            <View accessibilityRole="progressbar" accessibilityLabel="Calculando readiness do Shipment" style={styles.computationState}>
                <ActivityIndicator color="#092955" />
                <Text style={styles.help}>Calculando readiness atual...</Text>
            </View>
        )
    }
    const errorMessage = getShipmentErrorMessage(query.error)
    if (errorMessage) {
        return (
            <View accessibilityRole="alert">
                <Text style={styles.error}>{errorMessage}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Tentar calcular readiness novamente" onPress={() => void query.refetch()} style={styles.inlineButton}>
                    <Text style={styles.inlineButtonText}>Tentar novamente</Text>
                </Pressable>
            </View>
        )
    }
    if (!query.data) {
        return <Text style={styles.help}>Escolha explicitamente o momento que será avaliado.</Text>
    }
    const { evaluation } = query.data
    return (
        <View accessibilityLabel={`Readiness atual ${evaluation.result}`}>
            <DistributionField label="Resultado factual" value={evaluation.result} />
            <DistributionField label="Código explicativo" value={evaluation.explanationCode} />
            <DistributionField label="Momento avaliado" value={formatDistributionTimestamp(evaluation.movementAt)} />
            <DistributionField label="País de destino" value={evaluation.destinationCountry} />
            <DistributionField label="Finalidade" value={evaluation.purpose} />
            <DistributionField label="Documentos vinculados" value={String(query.data.documentCount)} />
            <DistributionField label="Despacho regulado" value={query.data.regulatedDispatch ? 'Sim' : 'Não'} />
            {evaluation.ruleVersion ? <DistributionField label="Versão da regra" value={evaluation.ruleVersion} /> : null}
            {evaluation.result === 'UNKNOWN' ? (
                <Text accessibilityRole="alert" style={styles.warning}>
                    UNKNOWN não significa conformidade ou autorização para despacho. A matriz regulatória documental ainda não foi verificada.
                </Text>
            ) : null}
        </View>
    )
}

export default function ShipmentDetail({ route }) {
    const shipmentId = route.params?.shipmentId
    const { activeOrganizationId } = useOrganization()
    const [pickerVisible, setPickerVisible] = React.useState(false)
    const [movementAt, setMovementAt] = React.useState(null)
    const [submittedMovementAt, setSubmittedMovementAt] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasDistributionPermission(
        contextQuery.data,
        DISTRIBUTION_PERMISSIONS.SHIPMENT_READ
    )
    const enabled = contextQuery.isSuccess && canRead
    const shipmentQuery = useShipmentDetailQuery({
        organizationId: activeOrganizationId,
        shipmentId,
        enabled,
    })
    const validationQuery = useShipmentValidationQuery({
        organizationId: activeOrganizationId,
        shipmentId,
        movementAt: submittedMovementAt,
        enabled: enabled && Boolean(submittedMovementAt),
    })

    React.useEffect(() => {
        setMovementAt(null)
        setSubmittedMovementAt(null)
        setPickerVisible(false)
    }, [activeOrganizationId, shipmentId])

    if (!shipmentId) {
        return <SafeAreaView style={styles.screen}><DistributionState message="Shipment não identificado." /></SafeAreaView>
    }
    if (contextQuery.isPending || (canRead && shipmentQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><DistributionState loading message="Carregando Shipment" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !canRead) {
        return <SafeAreaView style={styles.screen}><DistributionState message="Você não tem permissão para consultar este Shipment." /></SafeAreaView>
    }
    const detailError = getShipmentErrorMessage(contextQuery.error ?? shipmentQuery.error)
    if (detailError || !shipmentQuery.data) {
        const retry = contextQuery.error ? contextQuery.refetch : shipmentQuery.refetch
        return <SafeAreaView style={styles.screen}><DistributionState message={detailError ?? 'Não foi possível carregar o Shipment.'} onRetry={() => void retry()} /></SafeAreaView>
    }

    const shipment = shipmentQuery.data
    const validate = () => {
        if (!movementAt) return
        const next = movementAt.toISOString()
        if (submittedMovementAt === next) {
            void validationQuery.refetch()
        } else {
            setSubmittedMovementAt(next)
        }
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Shipment</Text>
                <Text style={styles.subtitle}>{shipment.id}</Text>

                <DistributionSection title="Estado operacional">
                    <DistributionField label="Status" value={formatShipmentStatus(shipment.status)} accessibilityLabel={`Status factual do Shipment: ${shipment.status}`} />
                    <Text style={styles.rawCode}>Código retornado: {shipment.status}</Text>
                    <DistributionField label="Versão" value={String(shipment.version)} />
                    <DistributionField label="Establishment ID" selectable value={shipment.establishmentId} />
                    <DistributionField label="Recipient ID" selectable value={shipment.recipientId} />
                    <DistributionField label="Property ID" selectable value={shipment.propertyId} />
                    <DistributionField label="Finalidade" value={shipment.purpose} />
                    <DistributionField label="Acknowledgment registrado" value={shipment.receiptRecorded ? 'Sim' : 'Não'} accessibilityLabel={`Acknowledgment registrado: ${shipment.receiptRecorded ? 'sim' : 'não'}`} />
                    <Text style={styles.help}>O acknowledgment é um fato booleano; não cria status entregue, recebido ou encerrado.</Text>
                </DistributionSection>

                <DistributionSection title="Items do Shipment">
                    {shipment.items.length ? shipment.items.map(item => (
                        <View key={item.id} style={styles.card}>
                            <DistributionField label="Item ID" selectable value={item.id} />
                            <DistributionField label="Package ID" selectable value={item.packageId} />
                            <DistributionField label="Versão esperada" value={String(item.expectedVersion)} />
                            <DistributionField label="Local esperado" selectable value={item.expectedLocationId} />
                            <DistributionField label="Quantidade" value={String(item.quantity)} />
                        </View>
                    )) : <Text style={styles.help}>Nenhum item retornado.</Text>}
                </DistributionSection>

                <DistributionSection title="DocumentVersion links imutáveis">
                    {shipment.documents.length
                        ? shipment.documents.map(document => <ShipmentDocument key={document.id} document={document} />)
                        : <Text style={styles.help}>Nenhum documento vinculado.</Text>}
                    <Text style={styles.help}>Estes vínculos apontam para DocumentVersion; não são DocumentReference e não são editáveis nesta tela.</Text>
                </DistributionSection>

                {shipment.dispatchEvidence ? (
                    <DistributionSection title="Evidência de despacho registrada">
                        <DistributionField label="Despachado em" value={formatDistributionTimestamp(shipment.dispatchEvidence.dispatchedAt)} />
                        <DistributionField label="Destinatário no despacho" value={shipment.dispatchEvidence.destination.recipientName} />
                        <DistributionField label="Propriedade no despacho" value={shipment.dispatchEvidence.destination.propertyName} />
                        <DistributionField label="Resultado documental registrado" value={shipment.dispatchEvidence.complianceResult} />
                        <DistributionField label="Explicação registrada" value={shipment.dispatchEvidence.complianceExplanation} />
                    </DistributionSection>
                ) : null}

                <DistributionSection title="Readiness atual">
                    <Text style={styles.help}>A consulta é computacional, não persiste estado e não autoriza despacho.</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Selecionar momento da readiness" accessibilityHint="Escolha a data e hora que será enviada como movementAt" onPress={() => setPickerVisible(true)} style={styles.selectionButton}>
                        <Text style={styles.selectionText}>{movementAt ? formatDistributionTimestamp(movementAt.toISOString()) : 'Selecionar data e hora'}</Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Calcular readiness do Shipment"
                        accessibilityHint="Executa uma validação computacional sem alterar o Shipment"
                        accessibilityState={{ disabled: !movementAt || validationQuery.isFetching, busy: validationQuery.isFetching }}
                        disabled={!movementAt || validationQuery.isFetching}
                        onPress={validate}
                        style={[styles.primaryButton, (!movementAt || validationQuery.isFetching) && styles.disabled]}
                    >
                        <Text style={styles.primaryText}>Calcular readiness</Text>
                    </Pressable>
                    <ValidationResult query={validationQuery} />
                </DistributionSection>
            </ScrollView>
            <DateTimePickerModal
                date={movementAt ?? new Date()}
                isVisible={pickerVisible}
                mode="datetime"
                onCancel={() => setPickerVisible(false)}
                onConfirm={(date) => {
                    setMovementAt(date)
                    setSubmittedMovementAt(null)
                    setPickerVisible(false)
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { paddingTop: 18, paddingBottom: 90 },
    title: { marginHorizontal: 20, color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginHorizontal: 20, marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 13 },
    rawCode: { marginTop: -5, marginBottom: 10, color: '#64748B', fontSize: 12 },
    card: { marginBottom: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, backgroundColor: '#F8FAFC' },
    help: { marginTop: 5, color: '#475569', fontSize: 13, lineHeight: 19 },
    warning: { marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: '#FEF3C7', color: '#92400E', fontSize: 14, lineHeight: 20 },
    error: { marginTop: 10, color: '#991B1B', fontSize: 14, lineHeight: 20 },
    selectionButton: { minHeight: 48, justifyContent: 'center', marginTop: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#64748B', borderRadius: 10, backgroundColor: '#FFFFFF' },
    selectionText: { color: '#0F172A', fontSize: 15 },
    primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 24, backgroundColor: '#092955' },
    primaryText: { color: '#FFFFFF', fontWeight: '700' },
    disabled: { opacity: 0.5 },
    computationState: { paddingVertical: 12 },
    inlineButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    inlineButtonText: { color: '#092955', fontWeight: '700' },
})
