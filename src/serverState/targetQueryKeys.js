export const TARGET_QUERY_ROOT = 'target'
export const TARGET_BOOTSTRAP_SCOPE = 'bootstrap'
export const TARGET_ORGANIZATION_SCOPE = 'organization'

const requireStableId = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`${label} must be a non-empty stable ID string.`)
    }

    return value.trim()
}

export const targetBootstrapQueryKey = (...segments) => [
    TARGET_QUERY_ROOT,
    TARGET_BOOTSTRAP_SCOPE,
    ...segments,
]

export const targetOrganizationScopeQueryKey = () => [
    TARGET_QUERY_ROOT,
    TARGET_ORGANIZATION_SCOPE,
]

export const targetOrganizationQueryKey = (organizationId, ...segments) => [
    ...targetOrganizationScopeQueryKey(),
    requireStableId(organizationId, 'organizationId'),
    ...segments,
]
