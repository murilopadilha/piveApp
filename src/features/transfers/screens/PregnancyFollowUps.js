import React from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import { TransferState } from '../components/TransferElements'
import { usePregnancyFollowUpsQuery } from '../hooks/useTransferQueries'
import { TRANSFER_ROUTES } from '../routes'
import { TRANSFER_PERMISSIONS, hasTransferPermission } from '../transferPermissions'
import {
    formatTransferDate,
    formatTransferTimestamp,
    getPregnancyResultLabel,
    getTransferErrorMessage,
} from '../transferPresentation'

const today = () => new Date().toISOString().slice(0, 10)

export default function PregnancyFollowUps({ navigation }) {
    const { activeOrganizationId } = useOrganization()
    const [cohort, setCohort] = React.useState('D30')
    const [asOf, setAsOf] = React.useState(today)
    const contextQuery = useEffectiveContextQuery({ organizationId: activeOrganizationId })
    const canRead = hasTransferPermission(contextQuery.data, TRANSFER_PERMISSIONS.READ)
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(asOf)
    const followUpsQuery = usePregnancyFollowUpsQuery({
        organizationId: activeOrganizationId,
        cohort,
        asOf,
        enabled: contextQuery.isSuccess && canRead && validDate,
    })
    const items = followUpsQuery.data?.pages.flatMap(page => page.items) ?? []

    if (contextQuery.isPending) {
        return <SafeAreaView style={styles.screen}><TransferState loading message="Carregando acompanhamentos" /></SafeAreaView>
    }
    if (!canRead) {
        return <SafeAreaView style={styles.screen}><TransferState message="Você não tem permissão para consultar acompanhamentos." /></SafeAreaView>
    }

    const errorMessage = getTransferErrorMessage(followUpsQuery.error)

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>Acompanhamentos gestacionais</Text>
                <View accessibilityRole="radiogroup" style={styles.cohorts}>
                    {['D30', 'D60'].map(value => (
                        <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`Cohort ${value}`} accessibilityState={{ selected: cohort === value }} onPress={() => setCohort(value)} style={[styles.cohort, cohort === value && styles.selected]}>
                            <Text style={[styles.cohortText, cohort === value && styles.selectedText]}>{value}</Text>
                        </Pressable>
                    ))}
                </View>
                <TextInput accessibilityLabel="Data de análise dos acompanhamentos" accessibilityHint="Informe no formato AAAA-MM-DD" maxLength={10} onChangeText={setAsOf} style={styles.input} value={asOf} />
                {!validDate ? <Text accessibilityRole="alert" style={styles.error}>Informe a data no formato AAAA-MM-DD.</Text> : null}
            </View>
            {errorMessage && items.length === 0 ? <TransferState message={errorMessage} onRetry={() => void followUpsQuery.refetch()} /> : (
                <FlatList
                    contentContainerStyle={items.length ? styles.list : styles.empty}
                    data={items}
                    keyExtractor={item => `${item.cohort}:${item.transferId}`}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum acompanhamento neste cohort.</Text>}
                    ListFooterComponent={followUpsQuery.isFetchingNextPage ? <ActivityIndicator accessibilityLabel="Carregando mais acompanhamentos" color="#092955" style={styles.footer} /> : null}
                    onEndReached={() => {
                        if (followUpsQuery.hasNextPage && !followUpsQuery.isFetchingNextPage) {
                            void followUpsQuery.fetchNextPage()
                        }
                    }}
                    onEndReachedThreshold={0.4}
                    renderItem={({ item }) => (
                        <Pressable accessibilityRole="button" accessibilityLabel={`Abrir transferência do acompanhamento ${item.cohort}`} accessibilityHint="Abre o detalhe e histórico gestacional" onPress={() => navigation.navigate(TRANSFER_ROUTES.TRANSFER_DETAIL, { transferId: item.transferId })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                            <Text style={styles.cardTitle}>{item.cohort} · {item.status === 'DUE' ? 'Pendente' : 'Registrado'}</Text>
                            <Text style={styles.cardText}>Transferência em {formatTransferDate(item.performedOn)}</Text>
                            <Text style={styles.cardText}>Janela: dia {item.windowFromDay} ao {item.windowThroughDay}</Text>
                            <Text style={styles.cardText}>{item.result ? getPregnancyResultLabel(item.result) : 'Sem checagem válida na janela'}</Text>
                            {item.checkedAt ? <Text style={styles.cardText}>Checado em {formatTransferTimestamp(item.checkedAt)}</Text> : null}
                        </Pressable>
                    )}
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: { padding: 20, paddingBottom: 10 },
    title: { color: '#092955', fontSize: 24, fontWeight: '700' },
    cohorts: { flexDirection: 'row', marginTop: 14 },
    cohort: { minHeight: 44, justifyContent: 'center', marginRight: 8, paddingHorizontal: 18, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 22, backgroundColor: '#FFFFFF' },
    selected: { borderColor: '#092955', backgroundColor: '#DBEAFE' },
    cohortText: { color: '#475569', fontSize: 14, fontWeight: '700' },
    selectedText: { color: '#092955' },
    input: { minHeight: 48, marginTop: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 16 },
    error: { marginTop: 5, color: '#991B1B', fontSize: 13 },
    list: { paddingHorizontal: 16, paddingBottom: 80 },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#475569', fontSize: 15, textAlign: 'center' },
    card: { minHeight: 112, marginBottom: 10, padding: 15, borderRadius: 12, backgroundColor: '#FFFFFF' },
    pressed: { opacity: 0.72 },
    cardTitle: { color: '#092955', fontSize: 16, fontWeight: '700' },
    cardText: { marginTop: 4, color: '#475569', fontSize: 14 },
    footer: { marginVertical: 20 },
})
