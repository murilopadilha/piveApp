export const CORRECTION_PERMISSIONS = Object.freeze({
    READ: 'compliance:read',
})

export const hasCorrectionPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
