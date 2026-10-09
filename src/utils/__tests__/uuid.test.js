import { validate, version } from 'uuid'

import { createUuidV7 } from '../uuid'

describe('createUuidV7', () => {
    it('returns distinct valid version 7 UUIDs', () => {
        const first = createUuidV7()
        const second = createUuidV7()

        expect(validate(first)).toBe(true)
        expect(version(first)).toBe(7)
        expect(validate(second)).toBe(true)
        expect(version(second)).toBe(7)
        expect(second).not.toBe(first)
    })
})
