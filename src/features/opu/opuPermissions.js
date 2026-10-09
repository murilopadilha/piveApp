export const OPU_PERMISSIONS = Object.freeze({
    READ: 'opu:read',
    WRITE: 'opu:write',
    MASTER_DATA_READ: 'master-data:read',
    CLIENT_READ: 'client:read',
})

export const hasOpuPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
