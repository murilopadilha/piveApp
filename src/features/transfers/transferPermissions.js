export const TRANSFER_PERMISSIONS = Object.freeze({
    READ: 'transfer:read',
    WRITE: 'transfer:write',
    MASTER_DATA_READ: 'master-data:read',
})

export const hasTransferPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
