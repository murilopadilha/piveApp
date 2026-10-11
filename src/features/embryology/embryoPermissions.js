export const EMBRYO_PERMISSIONS = Object.freeze({
    READ: 'embryology:read',
    WRITE: 'embryology:write',
    MATING_READ: 'fertilization:read',
})

export const hasEmbryoPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
