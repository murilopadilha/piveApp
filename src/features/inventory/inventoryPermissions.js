export const INVENTORY_PERMISSIONS = Object.freeze({
    READ: 'inventory:read',
    WRITE: 'inventory:write',
    EMBRYO_READ: 'embryology:read',
})

export const hasInventoryPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
