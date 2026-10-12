import React from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getAnimalName } from '../../animals/animalPresentation'
import { useAnimalsQuery } from '../../animals/hooks/useAnimalQueries'
import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import RecipientAnimalSelector from '../components/RecipientAnimalSelector'
import { TransferState } from '../components/TransferElements'
import { useOpenRecipientCycleMutation, isAmbiguousRecipientCycleError } from '../hooks/useRecipientCycleMutations'
import { createOpenRecipientCycleIntent } from '../recipientCycleIntents'
import { TRANSFER_ROUTES } from '../routes'
import { TRANSFER_PERMISSIONS, hasTransferPermission } from '../transferPermissions'
import { getTransferCommandErrorMessage } from '../transferPresentation'

export default function RecipientCycleCreate({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [recipient, setRecipient] = React.useState(null)
    const [openedOn, setOpenedOn] = React.useState('')
    const [notes, setNotes] = React.useState('')
    const [queryText, setQueryText] = React.useState('')
    const [selectorVisible, setSelectorVisible] = React.useState(false)
    const [intent, setIntent] = React.useState(null)
    const [sent, setSent] = React.useState(false)
    const [localError, setLocalError] = React.useState(null)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canWrite = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.WRITE)
    const canReadAnimals = hasTransferPermission(
        contextQuery.data,
        TRANSFER_PERMISSIONS.MASTER_DATA_READ
    )
    const animalsQuery = useAnimalsQuery({
        organizationId: activeOrganizationId,
        query: queryText,
        enabled: selectorVisible && contextQuery.isSuccess && canReadAnimals,
    })
    const openMutation = useOpenRecipientCycleMutation({
        organizationId: activeOrganizationId,
    })

    React.useEffect(() => {
        setRecipient(null)
        setOpenedOn('')
        setNotes('')
        setQueryText('')
        setSelectorVisible(false)
        setIntent(null)
        setSent(false)
        setLocalError(null)
    }, [activeOrganizationId])

    if (contextQuery.isPending) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando contexto" /></SafeAreaView>
    }
    if (!canWrite) {
        return <SafeAreaView style={styles.screen}><TransferState message="Você não tem permissão para abrir ciclos de receptoras." /></SafeAreaView>
    }

    const submit = () => {
        setLocalError(null)
        let prepared = intent

        try {
            if (!prepared) {
                prepared = createOpenRecipientCycleIntent({
                    recipientAnimalId: recipient?.id,
                    protocolVersionId: null,
                    openedOn,
                    notes,
                })
                setIntent(prepared)
            }
        } catch (error) {
            setLocalError('Selecione uma Animal e informe a data no formato AAAA-MM-DD.')
            return
        }

        setSent(true)
        openMutation.mutate(prepared, {
            onSuccess: cycle => navigation.replace(
                TRANSFER_ROUTES.RECIPIENT_CYCLE_DETAIL,
                { recipientCycleId: cycle.id }
            ),
        })
    }

    const editAsNewIntention = () => {
        setIntent(null)
        setSent(false)
        openMutation.reset()
    }
    const ambiguous = isAmbiguousRecipientCycleError(openMutation.error)
    const errorMessage = localError ?? getTransferCommandErrorMessage(
        openMutation.error
    )

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text accessibilityRole="header" style={styles.title}>Novo ciclo de receptora</Text>
                <Text style={styles.subtitle}>Recipient é uma Animal no contexto deste ciclo.</Text>

                <Text style={styles.label}>Animal receptora</Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Selecionar Animal receptora"
                    accessibilityHint="Abre a busca geral de Animals; não usa role Recipient"
                    accessibilityState={{ disabled: sent || !canReadAnimals }}
                    disabled={sent || !canReadAnimals}
                    onPress={() => setSelectorVisible(true)}
                    style={[styles.selector, (sent || !canReadAnimals) && styles.disabled]}
                >
                    <Text style={styles.selectorText}>{recipient ? getAnimalName(recipient) : 'Selecionar Animal'}</Text>
                </Pressable>
                {!canReadAnimals ? <Text accessibilityRole="alert" style={styles.help}>A seleção requer permissão de dados mestres.</Text> : null}

                <Text style={styles.label}>Data de abertura</Text>
                <TextInput
                    accessibilityLabel="Data de abertura do ciclo"
                    accessibilityHint="Informe no formato AAAA-MM-DD"
                    editable={!sent}
                    maxLength={10}
                    onChangeText={setOpenedOn}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#64748B"
                    style={styles.input}
                    value={openedOn}
                />

                <Text style={styles.label}>Observações opcionais</Text>
                <TextInput
                    accessibilityLabel="Observações do ciclo"
                    editable={!sent}
                    maxLength={1000}
                    multiline
                    onChangeText={setNotes}
                    style={[styles.input, styles.multiline]}
                    value={notes}
                />

                <Text style={styles.protocolNote}>
                    Protocolo opcional não informado. Nenhum identificador de protocolo é presumido ou fixado pelo aplicativo.
                </Text>

                {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
                {sent && openMutation.isError && !ambiguous ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Editar ciclo como nova intenção" onPress={editAsNewIntention} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Editar como nova intenção</Text>
                    </Pressable>
                ) : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ambiguous ? 'Reenviar a mesma intenção de abertura' : 'Abrir ciclo de receptora'}
                    accessibilityHint={ambiguous ? 'Reutiliza o mesmo identificador, payload e chave idempotente' : 'Registra o ciclo no servidor'}
                    accessibilityState={{ busy: openMutation.isPending, disabled: openMutation.isPending }}
                    disabled={openMutation.isPending}
                    onPress={submit}
                    style={[styles.submit, openMutation.isPending && styles.disabled]}
                >
                    <Text style={styles.submitText}>{openMutation.isPending ? 'Abrindo...' : ambiguous ? 'Tentar mesma intenção' : 'Abrir ciclo'}</Text>
                </Pressable>
            </ScrollView>
            <RecipientAnimalSelector
                visible={selectorVisible}
                query={animalsQuery}
                onQueryChange={setQueryText}
                onSelect={(animal) => {
                    setRecipient(animal)
                    setSelectorVisible(false)
                }}
                onClose={() => setSelectorVisible(false)}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    content: { padding: 20, paddingBottom: 80 },
    title: { color: '#092955', fontSize: 25, fontWeight: '700' },
    subtitle: { marginTop: 4, marginBottom: 18, color: '#475569', fontSize: 14 },
    label: { marginTop: 14, marginBottom: 6, color: '#334155', fontSize: 13, fontWeight: '700' },
    selector: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF' },
    selectorText: { color: '#0F172A', fontSize: 16 },
    input: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 16 },
    multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
    protocolNote: { marginTop: 16, color: '#475569', fontSize: 13, lineHeight: 18 },
    help: { marginTop: 5, color: '#92400E', fontSize: 13 },
    error: { marginTop: 16, color: '#991B1B', fontSize: 14, lineHeight: 20 },
    submit: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 25, backgroundColor: '#092955' },
    submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    secondaryButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    secondaryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    disabled: { opacity: 0.5 },
})
