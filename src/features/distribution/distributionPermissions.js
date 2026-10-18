export const DISTRIBUTION_PERMISSIONS = Object.freeze({
    SHIPMENT_READ: 'shipment:read',
    RECALL_READ: 'recall:read',
})

export const hasDistributionPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
