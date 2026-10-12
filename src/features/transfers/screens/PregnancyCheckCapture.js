import React from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import OpuLookupModal from '../../opu/components/OpuLookupModal'
import {
    useProfessionalDetailQuery,
    useProfessionalsLookup,
} from '../../opu/hooks/useOpuLookupQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { TransferState } from '../components/TransferElements'
import {
    isAmbiguousPregnancyCheckError,
    isPregnancyCheckConflict,
    useRecordPregnancyCheckMutation,
} from '../hooks/usePregnancyCheckMutations'
import {
    usePregnancyChecksQuery,
    useTransferDetailQuery,
} from '../hooks/useTransferQueries'
import {
    createPregnancyCheckIntent,
    getDeviceIanaTimezone,
    isValidIanaTimezone,
    markPregnancyCheckIntentSent,
    PREGNANCY_CHECK_RESULTS,
} from '../pregnancyCheckIntents'
import {
    TRANSFER_PERMISSIONS,
    hasTransferPermission,
} from '../transferPermissions'
import {
    formatTransferTimestamp,
    getPregnancyResultLabel,
    getTransferCommandErrorMessage,
} from '../transferPresentation'

const METHOD_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,47}$/

export const findPregnancyHistoryEntry = (data, checkId) => (
    data?.pages
        ?.flatMap(page => page.items)
        .find(entry => entry.check.id === checkId) ?? null
)

const SelectorButton = ({ label, value, disabled, onPress }) => (
    <View style={styles.fieldBlock}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value || 'não selecionado'}`}
            accessibilityHint={`Abre a seleção de ${label}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={[styles.selector, disabled && styles.disabled]}
        >
            <Text style={value ? styles.selectorValue : styles.placeholder}>
                {value || 'Selecionar'}
            </Text>
        </Pressable>
    </View>
)

const ResultSelector = ({ value, disabled, onChange }) => (
    <View style={styles.fieldBlock}>
        <Text style={styles.label}>Resultado</Text>
        <View accessibilityRole="radiogroup">
            {PREGNANCY_CHECK_RESULTS.map(result => (
                <Pressable
                    key={result}
                    accessibilityRole="radio"
                    accessibilityLabel={getPregnancyResultLabel(result)}
                    accessibilityState={{ checked: value === result, disabled }}
                    disabled={disabled}
                    onPress={() => onChange(result)}
                    style={[
                        styles.resultOption,
                        value === result && styles.resultSelected,
                        disabled && styles.disabled,
                    ]}
                >
                    <Text style={value === result
                        ? styles.resultSelectedText
                        : styles.resultText}>
                        {getPregnancyResultLabel(result)}
                    </Text>
                </Pressable>
            ))}
        </View>
    </View>
)

export default function PregnancyCheckCapture({ navigation, route }) {
    const transferId = route.params?.transferId
    const checkId = route.params?.checkId ?? null
    const correction = Boolean(checkId)
    const { activeOrganizationId } = useOrganization()
    const contextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canRead = hasTransferPermission(
        contextQuery.data,
        TRANSFER_PERMISSIONS.READ
    )
    const canWrite = hasTransferPermission(
        contextQuery.data,
        TRANSFER_PERMISSIONS.WRITE
    )
    const canReadMasterData = hasTransferPermission(
        contextQuery.data,
        TRANSFER_PERMISSIONS.MASTER_DATA_READ
    )
    const allowed = contextQuery.isSuccess && canRead && canWrite && canReadMasterData
    const detailQuery = useTransferDetailQuery({
        organizationId: activeOrganizationId,
        transferId,
        enabled: allowed,
    })
    const historyQuery = usePregnancyChecksQuery({
        organizationId: activeOrganizationId,
        transferId,
        enabled: allowed && correction,
    })
    const previousEntry = findPregnancyHistoryEntry(historyQuery.data, checkId)
    const previousProfessionalQuery = useProfessionalDetailQuery({
        organizationId: activeOrganizationId,
        professionalId: previousEntry?.check.professionalId,
        enabled: allowed && correction && Boolean(previousEntry),
    })
    const [professionalSelectorVisible, setProfessionalSelectorVisible] = React.useState(false)
    const [professionalQuery, setProfessionalQuery] = React.useState('')
    const professionalsQuery = useProfessionalsLookup({
        organizationId: activeOrganizationId,
        query: professionalQuery,
        enabled: allowed && professionalSelectorVisible,
    })
    const [professional, setProfessional] = React.useState(null)
    const [checkedAt, setCheckedAt] = React.useState(null)
    const [datePickerVisible, setDatePickerVisible] = React.useState(false)
    const [timezone, setTimezone] = React.useState(getDeviceIanaTimezone)
    const [result, setResult] = React.useState(null)
    const [methodCode, setMethodCode] = React.useState('')
    const [observations, setObservations] = React.useState('')
    const [correctionReason, setCorrectionReason] = React.useState('')
    const [validationMessage, setValidationMessage] = React.useState(null)
    const [pendingIntent, setPendingIntent] = React.useState(null)
    const initializedKey = React.useRef(null)
    const mutation = useRecordPregnancyCheckMutation({
        organizationId: activeOrganizationId,
        transferId,
    })

    React.useEffect(() => {
        const key = `${activeOrganizationId ?? ''}:${transferId ?? ''}:${checkId ?? 'new'}`

        if (initializedKey.current === key || (correction && !previousEntry)) {
            return
        }
        initializedKey.current = key
        setProfessional(null)
        setCheckedAt(correction ? new Date(previousEntry.check.checkedAt) : null)
        setTimezone(correction
            ? previousEntry.check.timezone
            : getDeviceIanaTimezone())
        setResult(correction ? previousEntry.check.result : null)
        setMethodCode(correction ? previousEntry.check.methodCode : '')
        setObservations(correction ? previousEntry.check.observations ?? '' : '')
        setCorrectionReason('')
        setValidationMessage(null)
        setPendingIntent(null)
        setProfessionalSelectorVisible(false)
        setProfessionalQuery('')
        mutation.reset()
    }, [
        activeOrganizationId,
        checkId,
        correction,
        mutation.reset,
        previousEntry,
        transferId,
    ])

    React.useEffect(() => {
        if (
            previousProfessionalQuery.data &&
            previousEntry?.check.professionalId === previousProfessionalQuery.data.id
        ) {
            setProfessional(previousProfessionalQuery.data)
        }
    }, [previousEntry?.check.professionalId, previousProfessionalQuery.data])

    React.useEffect(() => {
        if (
            correction &&
            historyQuery.isSuccess &&
            !previousEntry &&
            historyQuery.hasNextPage &&
            !historyQuery.isFetchingNextPage
        ) {
            void historyQuery.fetchNextPage()
        }
    }, [correction, historyQuery, previousEntry])

    const sameIntentRetry = Boolean(pendingIntent) && (
        isAmbiguousPregnancyCheckError(mutation.error) ||
        mutation.error?.code === 'COMMAND_IN_PROGRESS'
    )
    const conflict = isPregnancyCheckConflict(mutation.error)
    const locked = Boolean(pendingIntent)

    const validateForm = () => {
        if (!checkedAt || !Number.isFinite(checkedAt.getTime())) {
            return 'Informe a data e hora da checagem.'
        }
        if (checkedAt.getTime() < new Date(detailQuery.data.transfer.performedAt).getTime()) {
            return 'A checagem não pode anteceder a transferência.'
        }
        if (!isValidIanaTimezone(timezone)) {
            return 'Informe um fuso horário IANA válido.'
        }
        if (!PREGNANCY_CHECK_RESULTS.includes(result)) {
            return 'Selecione um resultado válido.'
        }
        if (!METHOD_CODE_PATTERN.test(methodCode.trim().toUpperCase())) {
            return 'Informe um código de método válido com até 48 caracteres.'
        }
        if (!professional || professional.status !== 'ACTIVE') {
            return 'Selecione um profissional ativo.'
        }
        if (observations.trim().length > 2000) {
            return 'As observações devem ter no máximo 2000 caracteres.'
        }
        if (correction && (!correctionReason.trim() || correctionReason.trim().length > 500)) {
            return 'Informe o motivo da correção com até 500 caracteres.'
        }
        return null
    }

    const submit = () => {
        let intent = pendingIntent

        if (!intent) {
            const message = validateForm()

            if (message) {
                setValidationMessage(message)
                return
            }
            try {
                intent = markPregnancyCheckIntentSent(createPregnancyCheckIntent({
                    transferId,
                    transferPerformedAt: detailQuery.data.transfer.performedAt,
                    checkedAt: checkedAt.toISOString(),
                    timezone,
                    result,
                    methodCode,
                    observations,
                    professionalId: professional.id,
                    supersedesCheckId: checkId,
                    correctionReason: correction ? correctionReason : null,
                }))
            } catch {
                setValidationMessage('Revise os dados da checagem antes de enviar.')
                return
            }
            setPendingIntent(intent)
        }

        setValidationMessage(null)
        mutation.mutate(intent, {
            onSuccess: () => navigation.goBack(),
        })
    }

    const reconcile = async () => {
        await Promise.all([
            detailQuery.refetch(),
            correction ? historyQuery.refetch() : Promise.resolve(),
        ])
        setPendingIntent(null)
        mutation.reset()
    }

    if (!transferId) {
        return <SafeAreaView style={styles.screen}><TransferState message="Transferência não identificada." /></SafeAreaView>
    }
    if (contextQuery.isPending || (allowed && detailQuery.isPending)) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando formulário de checagem" /></SafeAreaView>
    }
    if (contextQuery.isSuccess && !allowed) {
        return <SafeAreaView style={styles.screen}><TransferState message="Você não tem as permissões necessárias para registrar checagens gestacionais." /></SafeAreaView>
    }
    if (detailQuery.error || !detailQuery.data) {
        return <SafeAreaView style={styles.screen}><TransferState message="Não foi possível carregar a transferência." onRetry={() => void detailQuery.refetch()} /></SafeAreaView>
    }
    if (correction && (
        historyQuery.isPending ||
        historyQuery.isFetchingNextPage ||
        (previousEntry && previousProfessionalQuery.isPending)
    )) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando fato original" /></SafeAreaView>
    }
    if (correction && historyQuery.error && !previousEntry) {
        return <SafeAreaView style={styles.screen}><TransferState message="Não foi possível carregar o fato original." onRetry={() => void historyQuery.refetch()} /></SafeAreaView>
    }
    if (correction && !previousEntry && !historyQuery.hasNextPage) {
        return <SafeAreaView style={styles.screen}><TransferState message="A checagem selecionada não foi encontrada nesta transferência." /></SafeAreaView>
    }
    if (correction && previousEntry.invalidationId) {
        return <SafeAreaView style={styles.screen}><TransferState message="Uma checagem invalidada não pode ser corrigida novamente." /></SafeAreaView>
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    {correction ? 'Corrigir checagem' : 'Registrar checagem'}
                </Text>
                <Text style={styles.notice}>
                    {correction
                        ? 'A correção cria um novo fato. O registro original permanecerá no histórico.'
                        : 'O envio registra um único fato pelo contrato bulk atômico.'}
                </Text>
                <SelectorButton
                    disabled={locked}
                    label="Profissional"
                    onPress={() => setProfessionalSelectorVisible(true)}
                    value={professional
                        ? `${professional.name} — ${professional.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}`
                        : null}
                />
                <SelectorButton
                    disabled={locked}
                    label="Data e hora da checagem"
                    onPress={() => setDatePickerVisible(true)}
                    value={checkedAt ? formatTransferTimestamp(checkedAt.toISOString()) : null}
                />
                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Fuso horário IANA</Text>
                    <TextInput
                        accessibilityLabel="Fuso horário IANA da checagem"
                        editable={!locked}
                        maxLength={64}
                        onChangeText={setTimezone}
                        placeholder="Região/Cidade"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        value={timezone}
                    />
                </View>
                <ResultSelector
                    disabled={locked}
                    onChange={setResult}
                    value={result}
                />
                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Código do método</Text>
                    <TextInput
                        accessibilityLabel="Código do método"
                        accessibilityHint="Informe o código operacional adotado pela organização"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        editable={!locked}
                        maxLength={48}
                        onChangeText={text => setMethodCode(text.toUpperCase())}
                        placeholder="Código operacional"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        value={methodCode}
                    />
                    <Text style={styles.help}>
                        Use o código operacional adotado pela sua organização.
                    </Text>
                </View>
                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Observações (opcional)</Text>
                    <TextInput
                        accessibilityLabel="Observações da checagem"
                        editable={!locked}
                        maxLength={2000}
                        multiline
                        onChangeText={setObservations}
                        style={[styles.input, styles.multiline]}
                        value={observations}
                    />
                </View>
                {correction ? (
                    <View style={styles.fieldBlock}>
                        <Text style={styles.label}>Motivo da correção</Text>
                        <TextInput
                            accessibilityLabel="Motivo da correção"
                            accessibilityHint="Explique por que um novo fato substitui a checagem selecionada"
                            editable={!locked}
                            maxLength={500}
                            multiline
                            onChangeText={setCorrectionReason}
                            style={[styles.input, styles.multiline]}
                            value={correctionReason}
                        />
                    </View>
                ) : null}
                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {validationMessage}
                    </Text>
                ) : null}
                {mutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getTransferCommandErrorMessage(mutation.error)}
                    </Text>
                ) : null}
                {conflict ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recarregar histórico e revisar correção"
                        onPress={() => void reconcile()}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Recarregar e revisar</Text>
                    </Pressable>
                ) : pendingIntent && mutation.isError && !sameIntentRetry ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Editar checagem como nova intenção"
                        onPress={() => {
                            setPendingIntent(null)
                            mutation.reset()
                        }}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={sameIntentRetry
                        ? 'Tentar registrar novamente com a mesma intenção'
                        : correction
                            ? 'Registrar correção append-only'
                            : 'Registrar checagem gestacional'}
                    accessibilityHint="Envia um item pelo contrato bulk atômico"
                    accessibilityState={{
                        busy: mutation.isPending,
                        disabled: mutation.isPending || (
                            Boolean(pendingIntent) && !sameIntentRetry
                        ),
                    }}
                    disabled={mutation.isPending || (
                        Boolean(pendingIntent) && !sameIntentRetry
                    )}
                    onPress={submit}
                    style={styles.primaryButton}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.primaryText}>
                            {sameIntentRetry
                                ? 'Tentar novamente a mesma intenção'
                                : correction
                                    ? 'Registrar correção'
                                    : 'Registrar checagem'}
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
            <DateTimePickerModal
                date={checkedAt ?? new Date()}
                isVisible={datePickerVisible}
                mode="datetime"
                onCancel={() => setDatePickerVisible(false)}
                onConfirm={(date) => {
                    setCheckedAt(date)
                    setDatePickerVisible(false)
                }}
            />
            <OpuLookupModal
                isItemDisabled={item => item.status !== 'ACTIVE'}
                itemLabel={item => `${item.name} — ${item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}`}
                onClose={() => {
                    setProfessionalSelectorVisible(false)
                    setProfessionalQuery('')
                }}
                onQueryChange={setProfessionalQuery}
                onSelect={(item) => {
                    setProfessional(item)
                    setProfessionalSelectorVisible(false)
                    setProfessionalQuery('')
                }}
                query={professionalsQuery}
                title="profissional"
                visible={professionalSelectorVisible}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { padding: 20, paddingBottom: 100 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    notice: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 8 },
    fieldBlock: { marginTop: 18 },
    label: { color: '#334155', fontSize: 14, fontWeight: '700', marginBottom: 6 },
    selector: {
        minHeight: 50,
        justifyContent: 'center',
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    selectorValue: { color: '#0F172A', fontSize: 16 },
    placeholder: { color: '#64748B', fontSize: 16 },
    input: {
        minHeight: 50,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 16,
    },
    multiline: { minHeight: 100, paddingTop: 14, textAlignVertical: 'top' },
    help: { color: '#64748B', fontSize: 13, lineHeight: 18, marginTop: 6 },
    resultOption: {
        minHeight: 48,
        justifyContent: 'center',
        marginBottom: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    resultSelected: { borderColor: '#092955', backgroundColor: '#E8EEF7' },
    resultText: { color: '#334155', fontSize: 15 },
    resultSelectedText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    error: { color: '#B91C1C', fontSize: 14, lineHeight: 20, marginTop: 14 },
    primaryButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        borderRadius: 25,
        backgroundColor: '#092955',
    },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    secondaryButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#092955',
        borderRadius: 24,
    },
    secondaryText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    disabled: { opacity: 0.5 },
})
