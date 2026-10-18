export const DOCUMENT_PERMISSIONS = Object.freeze({
    READ: 'documents:read',
})

export const hasDocumentPermission = (effectiveContext, permission) => (
    Array.isArray(effectiveContext?.permissions) &&
    effectiveContext.permissions.includes(permission)
)
