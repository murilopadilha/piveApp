import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import { targetOrganizationQueryKey } from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    recordInventoryMovement,
    recordInventoryMovementBatch,
} from '../api/inventoryApi'

const CONFLICT_CODES = new Set([
    'STALE_PACKAGE_VERSION',
    'PACKAGE_NOT_IN_EXPECTED_LOCATION',
    'PACKAGE_LOCATION_UNCHANGED',
    'PACKAGE_ON_HOLD',
    'PACKAGE_RESERVED_FOR_SHIPMENT',
    'PACKAGE_HAS_NO_ACTIVE_MATERIAL',
    'STORAGE_LOCATION_NOT_ACTIVE',
    'CONCURRENT_WRITE_CONFLICT',
    'CONSTRAINT_CONFLICT',
])

export const isAmbiguousInventoryMovementError = error => (
    error?.kind === TARGET_ERROR_KINDS.NETWORK ||
    error?.kind === TARGET_ERROR_KINDS.TIMEOUT
)

export const isInventoryMovementConflict = error => (
    CONFLICT_CODES.has(error?.code)
)

export const useInventoryMovementMutation = ({
    organizationId,
    packageId,
    bulk = false,
}) => {
    const queryClient = useQueryClient()
    const { expireSession } = useSession()
    const invalidateInventoryState = React.useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'embryoPackages'
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'inventoryMovements',
                    packageId
                ),
            }),
            queryClient.invalidateQueries({
                queryKey: targetOrganizationQueryKey(
                    organizationId,
                    'embryos'
                ),
            }),
        ])
    }, [organizationId, packageId, queryClient])

    return useMutation({
        mutationFn: bulk
            ? recordInventoryMovementBatch
            : recordInventoryMovement,
        retry: false,
        onSuccess: invalidateInventoryState,
        onError: (error) => {
            if (error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED) {
                expireSession()
            }
            if (isInventoryMovementConflict(error)) {
                void invalidateInventoryState()
            }
        },
    })
}
