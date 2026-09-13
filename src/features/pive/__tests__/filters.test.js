import {
    PIVE_FILTER_CATALOG_MODES,
    getPiveFilterToggleIcon,
    getPivePrimaryFilterOptions,
    getPiveSecondaryCategory,
    getPiveSecondaryPlaceholder,
} from '../filters'

describe('Pive filter model', () => {
    test('exposes the legacy status catalog in its original order', () => {
        expect(getPivePrimaryFilterOptions(PIVE_FILTER_CATALOG_MODES.STATUS)).toEqual([
            { key: 'ALL', value: 'Todas as FIVs' },
            { key: 'IN_PROCESS', value: 'Em processo' },
            { key: 'OOCYTE_COLLECTION_COMPLETED', value: 'Coleta de oócitos completa' },
            { key: 'COMPLETED', value: 'FIV completa' },
        ])
    })

    test('exposes the animal catalog in its original order', () => {
        expect(getPivePrimaryFilterOptions(PIVE_FILTER_CATALOG_MODES.ANIMAL)).toEqual([
            { key: 'donor', value: 'Doadoras' },
            { key: 'bull', value: 'Touros' },
        ])
    })

    test('keeps status as the fallback catalog for an unknown mode', () => {
        expect(getPivePrimaryFilterOptions('unknown')).toEqual(
            getPivePrimaryFilterOptions(PIVE_FILTER_CATALOG_MODES.STATUS)
        )
    })

    test.each([
        [PIVE_FILTER_CATALOG_MODES.STATUS, 'list-status'],
        [PIVE_FILTER_CATALOG_MODES.ANIMAL, 'cow'],
    ])('derives the toggle icon for %s', (mode, icon) => {
        expect(getPiveFilterToggleIcon(mode)).toBe(icon)
    })

    test.each([
        ['donor', 'donor'],
        ['bull', 'bull'],
        ['ALL', null],
        ['IN_PROCESS', null],
        ['OOCYTE_COLLECTION_COMPLETED', null],
        ['COMPLETED', null],
    ])('derives the secondary category from %s', (filter, category) => {
        expect(getPiveSecondaryCategory(filter)).toBe(category)
    })

    test.each([
        ['donor', 'Selecione uma doadora'],
        ['bull', 'Selecione um touro'],
        [null, 'Selecione uma opção'],
        ['IN_PROCESS', 'Selecione uma opção'],
    ])('derives the secondary placeholder for %p', (category, placeholder) => {
        expect(getPiveSecondaryPlaceholder(category)).toBe(placeholder)
    })

    test('allows the deliberate animal-catalog/status-filter transitional state', () => {
        const options = getPivePrimaryFilterOptions(PIVE_FILTER_CATALOG_MODES.ANIMAL)

        expect(options.map(option => option.key)).toEqual(['donor', 'bull'])
        expect(getPiveSecondaryCategory('IN_PROCESS')).toBeNull()
    })
})
