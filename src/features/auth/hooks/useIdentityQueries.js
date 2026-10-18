import React from 'react'
import { useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetBootstrapQueryKey,
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../SessionContext'
import {
    getEffectiveContext,
    getMemberships,
} from '../api/identityApi'

export const membershipsQueryKey = () => targetBootstrapQueryKey(
    'identity',
    'memberships'
)

export const effectiveContextQueryKey = organizationId => (
    targetOrganizationQueryKey(organizationId, 'identity', 'me')
)

const useExpireSessionOnUnauthorized = (error) => {
    const { expireSession } = useSession()

    React.useEffect(() => {
        if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
            expireSession()
        }
    }, [error, expireSession])
}

export const useMembershipsQuery = ({ enabled = true } = {}) => {
    const query = useQuery({
        queryKey: membershipsQueryKey(),
        queryFn: ({ signal }) => getMemberships({ signal }),
        enabled,
    })

    useExpireSessionOnUnauthorized(query.error)

    return query
}

export const useEffectiveContextQuery = ({
    organizationId,
    enabled = true,
} = {}) => {
    const query = useQuery({
        queryKey: organizationId
            ? effectiveContextQueryKey(organizationId)
            : targetOrganizationScopeQueryKey(),
        queryFn: async ({ signal }) => {
            const context = await getEffectiveContext({ signal })

            if (context.tenantId !== organizationId) {
                throw {
                    kind: TARGET_ERROR_KINDS.UNEXPECTED,
                    status: null,
                    title: 'Contexto inválido',
                    detail: 'A organização retornada não corresponde à organização ativa.',
                    code: 'TARGET_CONTEXT_MISMATCH',
                    traceId: context.correlationId,
                    fieldErrors: [],
                    isCanceled: false,
                }
            }

            return context
        },
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized(query.error)

    return query
}

export const hasEffectivePermission = (context, permission) => (
    Array.isArray(context?.permissions) &&
    context.permissions.includes(permission)
)
