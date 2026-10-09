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
import { useClientsQuery } from '../../clients/hooks/useClientQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import OpuLookupModal from '../components/OpuLookupModal'
import OpuStateMessage from '../components/OpuStateMessage'
import {
    useEstablishmentsLookup,
    useFarmPropertiesLookup,
    useOperationalLocationsLookup,
    useProfessionalsLookup,
} from '../hooks/useOpuLookupQueries'
import { useOpenOpuMutation } from '../hooks/useOpuMutations'
import { createOpenOpuIntent } from '../opuIntents'
import {
    OPU_PERMISSIONS,
    hasOpuPermission,
} from '../opuPermissions'
import {
    formatOpuTimestamp,
    getOpuCommandErrorMessage,
} from '../opuPresentation'
import { OPU_ROUTES } from '../routes'

const deviceTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    } catch {
        return ''
    }
}

const FieldButton = ({ label, value, disabled, optional, onPress, onClear }) => (
    <View style={styles.fieldBlock}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value || 'não selecionado'}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.selector,
                disabled && styles.disabled,
                pressed && styles.pressed,
            ]}
        >
            <Text style={value ? styles.selectorValue : styles.placeholder}>
                {value || 'Selecionar'}
            </Text>
        </Pressable>
        {optional && value && !disabled ? (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover ${label}`}
                onPress={onClear}
                style={styles.clearButton}
            >
                <Text style={styles.clearText}>Remover seleção</Text>
            </Pressable>
        ) : null}
    </View>
)

export default function OpuSessionCreate({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canWrite = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.WRITE
    )
    const canReadMasterData = hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.MASTER_DATA_READ
    )
    const [lookupKind, setLookupKind] = React.useState(null)
    const [lookupQuery, setLookupQuery] = React.useState('')
    const [establishment, setEstablishment] = React.useState(null)
    const [operationalLocation, setOperationalLocation] = React.useState(null)
    const [farmProperty, setFarmProperty] = React.useState(null)
    const [professional, setProfessional] = React.useState(null)
    const [client, setClient] = React.useState(null)
    const [performedAt, setPerformedAt] = React.useState(null)
    const [showDatePicker, setShowDatePicker] = React.useState(false)
    const [timezone, setTimezone] = React.useState(deviceTimezone)
    const [notes, setNotes] = React.useState('')
    const [validationMessage, setValidationMessage] = React.useState(null)
    const [pendingIntent, setPendingIntent] = React.useState(null)
    const mutation = useOpenOpuMutation({ organizationId: activeOrganizationId })
    const lookupEnabled = effectiveContextQuery.isSuccess && canReadMasterData
    const establishmentsQuery = useEstablishmentsLookup({
        organizationId: activeOrganizationId,
        query: lookupQuery,
        enabled: lookupEnabled && lookupKind === 'establishment',
    })
    const locationsQuery = useOperationalLocationsLookup({
        organizationId: activeOrganizationId,
        establishmentId: establishment?.id,
        query: lookupQuery,
        enabled: lookupEnabled && lookupKind === 'location',
    })
    const farmsQuery = useFarmPropertiesLookup({
        organizationId: activeOrganizationId,
        query: lookupQuery,
        enabled: lookupEnabled && lookupKind === 'farm',
    })
    const professionalsQuery = useProfessionalsLookup({
        organizationId: activeOrganizationId,
        query: lookupQuery,
        enabled: lookupEnabled && lookupKind === 'professional',
    })
    const clientsQuery = useClientsQuery({
        organizationId: activeOrganizationId,
        query: lookupQuery,
        enabled: lookupEnabled && lookupKind === 'client',
    })
    const locked = Boolean(pendingIntent)

    const lookup = {
        establishment: {
            title: 'estabelecimento',
            query: establishmentsQuery,
            label: item => item.legalDisplayName,
            disabled: item => item.status !== 'ACTIVE',
            select: (item) => {
                if (item.id !== establishment?.id) {
                    setOperationalLocation(null)
                }
                setEstablishment(item)
            },
        },
        location: {
            title: 'local operacional',
            query: locationsQuery,
            label: item => item.name,
            disabled: item => item.status !== 'ACTIVE',
            select: setOperationalLocation,
        },
        farm: {
            title: 'propriedade',
            query: farmsQuery,
            label: item => item.name,
            disabled: item => item.status !== 'ACTIVE',
            select: setFarmProperty,
        },
        professional: {
            title: 'profissional',
            query: professionalsQuery,
            label: item => item.name,
            disabled: item => item.status !== 'ACTIVE',
            select: setProfessional,
        },
        client: {
            title: 'cliente',
            query: clientsQuery,
            label: item => item.displayName,
            disabled: item => item.status !== 'ACTIVE',
            select: setClient,
        },
    }[lookupKind]

    const closeLookup = React.useCallback(() => {
        setLookupKind(null)
        setLookupQuery('')
    }, [])
    const changeLookupQuery = React.useCallback(setLookupQuery, [])

    const submit = () => {
        let intent = pendingIntent

        if (!intent) {
            if (!establishment || !farmProperty || !professional ||
                !performedAt || !timezone.trim()) {
                setValidationMessage('Preencha estabelecimento, propriedade, profissional, data e fuso horário.')
                return
            }

            intent = createOpenOpuIntent({
                establishmentId: establishment.id,
                operationalLocationId: operationalLocation?.id ?? null,
                farmPropertyId: farmProperty.id,
                clientId: client?.id ?? null,
                leadProfessionalId: professional.id,
                performedAt: performedAt.toISOString(),
                timezone: timezone.trim(),
                notes,
            })
            setPendingIntent(intent)
        }

        setValidationMessage(null)
        mutation.mutate(intent, {
            onSuccess: session => navigation.replace(OPU_ROUTES.DETAIL, {
                opuSessionId: session.id,
            }),
        })
    }

    if (effectiveContextQuery.isPending) {
        return (
            <SafeAreaView style={styles.screen}>
                <ActivityIndicator color="#092955" size="large" style={styles.loading} />
            </SafeAreaView>
        )
    }

    if (!canWrite || !canReadMasterData) {
        return (
            <SafeAreaView style={styles.screen}>
                <OpuStateMessage message="Você não tem permissão para criar OPUs ou consultar os dados operacionais necessários." />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Nova OPU</Text>
                <Text style={styles.notice}>
                    O cabeçalho não poderá ser editado após a criação. Revise os dados antes de confirmar.
                </Text>
                <FieldButton
                    disabled={locked}
                    label="Estabelecimento"
                    onPress={() => setLookupKind('establishment')}
                    value={establishment?.legalDisplayName}
                />
                <FieldButton
                    disabled={locked || !establishment}
                    label="Local operacional (opcional)"
                    onClear={() => setOperationalLocation(null)}
                    onPress={() => setLookupKind('location')}
                    optional
                    value={operationalLocation?.name}
                />
                <FieldButton
                    disabled={locked}
                    label="Propriedade"
                    onPress={() => setLookupKind('farm')}
                    value={farmProperty?.name}
                />
                <FieldButton
                    disabled={locked}
                    label="Profissional responsável"
                    onPress={() => setLookupKind('professional')}
                    value={professional?.name}
                />
                <FieldButton
                    disabled={locked}
                    label="Cliente (opcional)"
                    onClear={() => setClient(null)}
                    onPress={() => setLookupKind('client')}
                    optional
                    value={client?.displayName}
                />
                <FieldButton
                    disabled={locked}
                    label="Data e hora da OPU"
                    onPress={() => setShowDatePicker(true)}
                    value={performedAt ? formatOpuTimestamp(performedAt.toISOString()) : null}
                />
                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Fuso horário IANA</Text>
                    <TextInput
                        accessibilityLabel="Fuso horário IANA"
                        editable={!locked}
                        maxLength={80}
                        onChangeText={setTimezone}
                        placeholder="America/Sao_Paulo"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        value={timezone}
                    />
                </View>
                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Observações (opcional)</Text>
                    <TextInput
                        accessibilityLabel="Observações da OPU"
                        editable={!locked}
                        maxLength={2000}
                        multiline
                        onChangeText={setNotes}
                        style={[styles.input, styles.notes]}
                        value={notes}
                    />
                </View>
                {validationMessage ? (
                    <Text accessibilityRole="alert" style={styles.error}>{validationMessage}</Text>
                ) : null}
                {mutation.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {getOpuCommandErrorMessage(mutation.error)}
                    </Text>
                ) : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={pendingIntent ? 'Tentar criar OPU novamente' : 'Criar OPU'}
                    accessibilityState={{ busy: mutation.isPending, disabled: mutation.isPending }}
                    disabled={mutation.isPending}
                    onPress={submit}
                    style={[styles.primaryButton, mutation.isPending && styles.disabled]}
                >
                    <Text style={styles.primaryText}>
                        {mutation.isPending
                            ? 'Enviando...'
                            : pendingIntent
                                ? 'Tentar novamente com a mesma intenção'
                                : 'Criar OPU'}
                    </Text>
                </Pressable>
                {pendingIntent && mutation.isError ? (
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                            setPendingIntent(null)
                            mutation.reset()
                        }}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>Editar dados como nova intenção</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
            <DateTimePickerModal
                date={performedAt ?? new Date()}
                isVisible={showDatePicker}
                mode="datetime"
                onCancel={() => setShowDatePicker(false)}
                onConfirm={(date) => {
                    setPerformedAt(date)
                    setShowDatePicker(false)
                }}
            />
            {lookup ? (
                <OpuLookupModal
                    itemLabel={lookup.label}
                    isItemDisabled={lookup.disabled}
                    onClose={closeLookup}
                    onQueryChange={changeLookupQuery}
                    onSelect={(item) => {
                        lookup.select(item)
                        closeLookup()
                    }}
                    query={lookup.query}
                    title={lookup.title}
                    visible
                />
            ) : null}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { padding: 20, paddingBottom: 80 },
    title: { color: '#092955', fontSize: 26, fontWeight: '700' },
    notice: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 12 },
    fieldBlock: { marginTop: 16 },
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
    notes: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
    clearButton: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
    clearText: { color: '#475569', fontSize: 13, fontWeight: '600' },
    primaryButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        paddingHorizontal: 18,
        borderRadius: 26,
        backgroundColor: '#092955',
    },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
    secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    secondaryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    error: { color: '#9F1239', fontSize: 14, lineHeight: 20, marginTop: 14 },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.72 },
    loading: { flex: 1 },
})
