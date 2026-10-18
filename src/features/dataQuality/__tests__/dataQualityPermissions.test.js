import {
    canReadDataQuality,
    DATA_QUALITY_PERMISSIONS,
} from '../dataQualityPermissions'

describe('M9A Data Quality permissions', () => {
    test('requires embryology and inventory read cumulatively', () => {
        expect(canReadDataQuality({ permissions: [
            DATA_QUALITY_PERMISSIONS.EMBRYO_READ,
            DATA_QUALITY_PERMISSIONS.INVENTORY_READ,
        ] })).toBe(true)
        expect(canReadDataQuality({
            permissions: [DATA_QUALITY_PERMISSIONS.EMBRYO_READ],
        })).toBe(false)
        expect(canReadDataQuality({
            permissions: [DATA_QUALITY_PERMISSIONS.INVENTORY_READ],
        })).toBe(false)
        expect(canReadDataQuality({ permissions: [] })).toBe(false)
    })
})
