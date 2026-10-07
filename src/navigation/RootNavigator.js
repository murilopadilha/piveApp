import RootTabs from './RootTabs'
import {
    CLIENT_PERMISSIONS,
    hasClientPermission,
} from '../features/clients/clientPermissions'
import useAuthenticatedOrganization from '../features/organizations/hooks/useAuthenticatedOrganization'

export default function RootNavigator() {
    const targetContext = useAuthenticatedOrganization()
    const showClients = targetContext.isReady && hasClientPermission(
        targetContext.effectiveContext,
        CLIENT_PERMISSIONS.LIST
    )

    return (
        <RootTabs
            key={targetContext.activeOrganizationId ?? 'legacy'}
            showClients={showClients}
        />
    )
}
