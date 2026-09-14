import {
    formatLocalCalendarDate,
    parseLocalCalendarDate,
} from '../date'

describe('calendar date helpers', () => {
    test('formats a local date without converting it to UTC', () => {
        const date = new Date(2024, 1, 3, 23, 45)

        expect(formatLocalCalendarDate(date)).toBe('2024-02-03')
    })

    test('parses a valid local calendar date', () => {
        const date = parseLocalCalendarDate('2024-02-29')

        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(1)
        expect(date.getDate()).toBe(29)
        expect(date.getHours()).toBe(0)
    })

    test.each([
        '2023-02-29',
        '2024-13-01',
        '2024-00-10',
        '2024-04-31',
        '03/02/2024',
        '',
        null,
        undefined,
    ])('returns the provided fallback for invalid input %p', value => {
        const fallback = new Date(2030, 5, 10)

        expect(parseLocalCalendarDate(value, fallback)).toBe(fallback)
    })
})
