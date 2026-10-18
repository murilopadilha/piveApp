export const MATING_PERMISSIONS = Object.freeze({
    SEMEN_READ: 'semen:read',
    READ: 'fertilization:read',
    WRITE: 'fertilization:write',
    OPU_WRITE: 'opu:write',
    MASTER_DATA_READ: 'master-data:read',
})

export const hasMatingPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)

export const canAllocateMatings = effectiveContext => (
    hasMatingPermission(effectiveContext, MATING_PERMISSIONS.WRITE) &&
    hasMatingPermission(effectiveContext, MATING_PERMISSIONS.OPU_WRITE)
)
