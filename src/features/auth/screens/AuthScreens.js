import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import { useSession } from '../SessionContext'

export function AuthLoadingScreen({ message = 'Restaurando sessão…' }) {
    return (
        <SafeAreaView style={styles.screen}>
            <ActivityIndicator
                size="large"
                color="#092955"
                accessibilityLabel={message}
            />
            <Text style={styles.message}>{message}</Text>
        </SafeAreaView>
    )
}

export function SignInScreen() {
    const session = useSession()

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.card}>
                <Text style={styles.title}>BovInA</Text>
                <Text style={styles.message}>
                    Entre com sua conta para acessar os dados da organização.
                </Text>
                {session.authError ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                        {session.authError}
                    </Text>
                ) : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Entrar no BovInA"
                    accessibilityHint="Abre o provedor de identidade no navegador do sistema"
                    accessibilityState={{ disabled: session.isAuthenticating }}
                    disabled={session.isAuthenticating}
                    onPress={session.signIn}
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                        session.isAuthenticating && styles.buttonDisabled,
                    ]}
                >
                    {session.isAuthenticating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

export function OrganizationGateScreen({ targetContext }) {
    const session = useSession()

    if (
        targetContext.membershipsQuery.isPending ||
        (
            targetContext.memberships.length === 1 &&
            !targetContext.activeOrganizationId
        ) ||
        (
            targetContext.activeOrganizationId &&
            targetContext.effectiveContextQuery.isPending
        )
    ) {
        return <AuthLoadingScreen message="Carregando organizações…" />
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.card}>
                <Text style={styles.title}>Organização</Text>
                {targetContext.hasNoMemberships ? (
                    <Text style={styles.message} accessibilityRole="alert">
                        Sua conta ainda não possui acesso a uma organização.
                    </Text>
                ) : null}
                {targetContext.membershipsQuery.isError ? (
                    <Text style={styles.error} accessibilityRole="alert">
                        Não foi possível carregar suas organizações.
                    </Text>
                ) : null}
                {targetContext.effectiveContextQuery.isError ? (
                    <Text style={styles.error} accessibilityRole="alert">
                        Não foi possível validar o acesso à organização.
                    </Text>
                ) : null}
                {targetContext.requiresOrganizationSelection
                    ? targetContext.memberships.map(membership => (
                        <Pressable
                            key={membership.organizationId}
                            accessibilityRole="button"
                            accessibilityLabel={`Selecionar organização terminada em ${membership.organizationId.slice(-8)}`}
                            onPress={() => targetContext.selectMembership(
                                membership.organizationId
                            )}
                            style={styles.organizationButton}
                        >
                            <Text style={styles.organizationText}>
                                Organização ••••{membership.organizationId.slice(-8)}
                            </Text>
                        </Pressable>
                    ))
                    : null}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sair da sessão"
                    onPress={session.logout}
                    style={styles.secondaryButton}
                >
                    <Text style={styles.secondaryButtonText}>Sair</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f5f7fa',
    },
    card: {
        width: '100%',
        maxWidth: 480,
        padding: 24,
        gap: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
    },
    title: {
        color: '#092955',
        fontSize: 28,
        fontWeight: '700',
    },
    message: {
        color: '#334155',
        fontSize: 16,
        lineHeight: 24,
    },
    error: {
        color: '#9f1239',
        fontSize: 15,
        lineHeight: 22,
    },
    button: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#092955',
    },
    buttonPressed: {
        opacity: 0.85,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    organizationButton: {
        minHeight: 48,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
    },
    organizationText: {
        color: '#0f172a',
        fontSize: 16,
    },
    secondaryButton: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#092955',
        fontSize: 16,
        fontWeight: '600',
    },
})
