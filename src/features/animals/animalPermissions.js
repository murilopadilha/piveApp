export const ANIMAL_PERMISSIONS = Object.freeze({
    READ: 'master-data:read',
})

export const hasAnimalPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
