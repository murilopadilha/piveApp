import {
    EMBRYO_TRACEABILITY_PERMISSIONS,
    canReadEmbryoTraceability,
} from '../embryoPermissions'

describe('Embryo capability permissions', () => {
    test('requires every backend traceability permission cumulatively', () => {
        const context = { permissions: [...EMBRYO_TRACEABILITY_PERMISSIONS] }

        expect(canReadEmbryoTraceability(context)).toBe(true)
        EMBRYO_TRACEABILITY_PERMISSIONS.forEach((missing) => {
            expect(canReadEmbryoTraceability({
                permissions: context.permissions.filter(value => value !== missing),
            })).toBe(false)
        })
    })

    test('does not couple compliance audit to traceability', () => {
        expect(EMBRYO_TRACEABILITY_PERMISSIONS).not.toContain('compliance:read')
    })
})
