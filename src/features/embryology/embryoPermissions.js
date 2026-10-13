export const EMBRYO_PERMISSIONS = Object.freeze({
    READ: 'embryology:read',
    WRITE: 'embryology:write',
    MATING_READ: 'fertilization:read',
    OPU_READ: 'opu:read',
    SEMEN_READ: 'semen:read',
    INVENTORY_READ: 'inventory:read',
    TRANSFER_READ: 'transfer:read',
    SHIPMENT_READ: 'shipment:read',
    COMPLIANCE_READ: 'compliance:read',
})

export const EMBRYO_TRACEABILITY_PERMISSIONS = Object.freeze([
    EMBRYO_PERMISSIONS.READ,
    EMBRYO_PERMISSIONS.OPU_READ,
    EMBRYO_PERMISSIONS.MATING_READ,
    EMBRYO_PERMISSIONS.SEMEN_READ,
    EMBRYO_PERMISSIONS.INVENTORY_READ,
    EMBRYO_PERMISSIONS.TRANSFER_READ,
    EMBRYO_PERMISSIONS.SHIPMENT_READ,
])

export const hasEmbryoPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)

export const canReadEmbryoTraceability = effectiveContext => (
    EMBRYO_TRACEABILITY_PERMISSIONS.every(permission => (
        hasEmbryoPermission(effectiveContext, permission)
    ))
)
