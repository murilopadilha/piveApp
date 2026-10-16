export const DATA_QUALITY_PERMISSIONS = Object.freeze({
    EMBRYO_READ: 'embryology:read',
    INVENTORY_READ: 'inventory:read',
})

export const canReadDataQuality = effectiveContext => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(
        DATA_QUALITY_PERMISSIONS.EMBRYO_READ
    ) &&
    effectiveContext.permissions.includes(
        DATA_QUALITY_PERMISSIONS.INVENTORY_READ
    )
)
