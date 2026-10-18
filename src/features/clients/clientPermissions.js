export const CLIENT_PERMISSIONS = Object.freeze({
    LIST: 'master-data:read',
    DETAIL: 'client:read',
})

export const hasClientPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
