import React from 'react'
import { AppState } from 'react-native'
import {
    QueryClientProvider,
    focusManager,
} from '@tanstack/react-query'

import { SessionProvider } from '../features/auth/SessionContext'
import { OrganizationProvider } from '../features/organizations/OrganizationContext'
import { createTargetQueryClient } from '../serverState/targetQueryClient'

function TargetAppStateBridge() {
    React.useEffect(() => {
        focusManager.setFocused(AppState.currentState === 'active')

        const subscription = AppState.addEventListener('change', status => {
            focusManager.setFocused(status === 'active')
        })

        return () => {
            subscription.remove()
            focusManager.setFocused(undefined)
        }
    }, [])

    return null
}

export default function TargetFoundationProvider({
    children,
    queryClient: providedQueryClient,
    restoreSession,
}) {
    const [queryClient] = React.useState(
        () => providedQueryClient ?? createTargetQueryClient()
    )

    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider restoreSession={restoreSession}>
                <OrganizationProvider>
                    <TargetAppStateBridge />
                    {children}
                </OrganizationProvider>
            </SessionProvider>
        </QueryClientProvider>
    )
}
