import { QueryClient } from '@tanstack/react-query'

import {
    targetOrganizationScopeQueryKey,
} from './targetQueryKeys'

export const createTargetQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: true,
        },
        mutations: {
            retry: false,
        },
    },
})

export const clearTargetOrganizationServerState = async (queryClient) => {
    const queryKey = targetOrganizationScopeQueryKey()

    await queryClient.cancelQueries({ queryKey })
    queryClient.removeQueries({ queryKey })
}

export const clearTargetSessionServerState = async (queryClient) => {
    await queryClient.cancelQueries()
    queryClient.clear()
}
