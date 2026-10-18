import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useEffectiveContextQuery } from '../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../organizations/OrganizationContext'
import {
    CLIENT_PERMISSIONS,
    hasClientPermission,
} from '../clientPermissions'
import {
    getClientErrorMessage,
    getClientTypeLabel,
} from '../clientPresentation'
import ClientStateMessage from '../components/ClientStateMessage'
import { useClientDetailQuery } from '../hooks/useClientQueries'

function DetailField({ label, value }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    )
}

export default function ClientDetail({ route }) {
    const clientId = route.params?.clientId
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const canReadDetail = hasClientPermission(
        effectiveContextQuery.data,
        CLIENT_PERMISSIONS.DETAIL
    )
    const clientQuery = useClientDetailQuery({
        organizationId: activeOrganizationId,
        clientId,
        enabled: effectiveContextQuery.isSuccess && canReadDetail,
    })
    const initialLoading = effectiveContextQuery.isPending ||
        (canReadDetail && clientQuery.isPending)
    const error = effectiveContextQuery.error ?? clientQuery.error
    const errorMessage = getClientErrorMessage(error)
    const retry = () => {
        if (effectiveContextQuery.error) {
            void effectiveContextQuery.refetch()
            return
        }

        void clientQuery.refetch()
    }

    if (!clientId) {
        return (
            <SafeAreaView style={styles.screen}>
                <ClientStateMessage message="Cliente não identificado." />
            </SafeAreaView>
        )
    }

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.screen}>
                <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Carregando detalhes do cliente"
                    style={styles.centered}
                >
                    <ActivityIndicator size="large" color="#092955" />
                    <Text style={styles.stateText}>Carregando cliente...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (effectiveContextQuery.isSuccess && !canReadDetail) {
        return (
            <SafeAreaView style={styles.screen}>
                <ClientStateMessage message="Você não tem permissão para consultar este cliente." />
            </SafeAreaView>
        )
    }

    if (errorMessage) {
        return (
            <SafeAreaView style={styles.screen}>
                <ClientStateMessage
                    message={errorMessage}
                    onRetry={retry}
                />
            </SafeAreaView>
        )
    }

    const client = clientQuery.data

    if (!client) {
        return (
            <SafeAreaView style={styles.screen}>
                <ClientStateMessage
                    message="Não foi possível carregar o cliente."
                    onRetry={retry}
                />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>
                    {client.displayName}
                </Text>
                <Text style={styles.identifier}>Cliente {client.id}</Text>
                <View style={styles.card}>
                    <DetailField
                        label="Tipo"
                        value={getClientTypeLabel(client.type)}
                    />
                    <DetailField label="Versão" value={String(client.version)} />
                    <DetailField label="Origem" value={client.originType} />
                    <DetailField
                        label="Registrado por"
                        value={client.recordedBy}
                    />
                    <DetailField
                        label="Registrado em"
                        value={client.recordedAt}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    stateText: {
        color: '#475569',
        fontSize: 15,
        marginTop: 12,
    },
    content: {
        padding: 20,
        paddingBottom: 48,
    },
    title: {
        color: '#092955',
        fontSize: 26,
        fontWeight: '700',
    },
    identifier: {
        color: '#64748B',
        fontSize: 13,
        marginTop: 6,
    },
    card: {
        marginTop: 24,
        paddingHorizontal: 18,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    field: {
        minHeight: 68,
        justifyContent: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#CBD5E1',
    },
    label: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
    },
    value: {
        color: '#0F172A',
        fontSize: 16,
        marginTop: 4,
    },
})
