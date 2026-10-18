import { Pressable, StyleSheet, Text, View } from 'react-native'

import RootTabs from './RootTabs'
import {
    CLIENT_PERMISSIONS,
    hasClientPermission,
} from '../features/clients/clientPermissions'
import useAuthenticatedOrganization from '../features/organizations/hooks/useAuthenticatedOrganization'
import {
    SESSION_STATUS,
    useSession,
} from '../features/auth/SessionContext'
import {
    AuthLoadingScreen,
    OrganizationGateScreen,
    SignInScreen,
} from '../features/auth/screens/AuthScreens'

function AuthenticatedRootNavigator() {
    const targetContext = useAuthenticatedOrganization()
    const session = useSession()

    if (!targetContext.isReady) {
        return <OrganizationGateScreen targetContext={targetContext} />
    }

    const showClients = targetContext.isReady && hasClientPermission(
        targetContext.effectiveContext,
        CLIENT_PERMISSIONS.LIST
    )

    return (
        <View style={styles.container}>
            <RootTabs
                key={targetContext.activeOrganizationId ?? 'legacy'}
                showClients={showClients}
            />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sair da sessão"
                onPress={session.logout}
                style={styles.logout}
            >
                <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
        </View>
    )
}

export default function RootNavigator() {
    const session = useSession()

    if (session.status === SESSION_STATUS.RESTORING) {
        return <AuthLoadingScreen />
    }

    if (session.status === SESSION_STATUS.EXPIRED) {
        return <SignInScreen />
    }

    return <AuthenticatedRootNavigator />
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    logout: {
        position: 'absolute',
        top: 52,
        right: 16,
        minWidth: 48,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.94)',
    },
    logoutText: {
        color: '#092955',
        fontSize: 14,
        fontWeight: '700',
    },
})
