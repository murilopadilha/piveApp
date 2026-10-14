import {
    DOCUMENT_PERMISSIONS,
    hasDocumentPermission,
} from '../documentPermissions'

describe('M7B1 Document permissions', () => {
    test('requires documents:read and no unrelated permission', () => {
        expect(hasDocumentPermission({
            permissions: [DOCUMENT_PERMISSIONS.READ],
        }, DOCUMENT_PERMISSIONS.READ)).toBe(true)
        expect(hasDocumentPermission({
            permissions: [
                'documents:write',
                'compliance:read',
                'master-data:read',
            ],
        }, DOCUMENT_PERMISSIONS.READ)).toBe(false)
    })
})
