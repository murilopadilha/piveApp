import targetApiClient from '../../../../api/target/client'
import {
    getAnimalById,
    getAnimalIdentifiers,
    getAnimalOwnerById,
    getAnimalOwnership,
    getAnimals,
    getBreedById,
    mapAnimalIdentifierPage,
    mapAnimalOwnershipPage,
    mapAnimalPage,
    normalizeAnimalPageParams,
} from '../animalApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}))

const animalView = {
    registration: {
        id: 'animal-a',
        sex: 'FEMALE',
        name: null,
        breedId: 'breed-a',
        birthDate: '2024-01-02',
    },
    status: 'ACTIVE',
    version: 3,
    originType: 'MANUAL',
    recordedBy: 'actor-a',
    recordedAt: '2026-09-20T12:00:00Z',
}

describe('target Animal API', () => {
    test('uses the implemented Animal search contract and maps Animals.View', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [animalView], page: 2, size: 20 },
        })

        await expect(getAnimals({
            query: '  brinco 42 ',
            page: 2,
            size: 20,
            signal,
        })).resolves.toEqual({
            items: [{
                id: 'animal-a',
                sex: 'FEMALE',
                name: null,
                breedId: 'breed-a',
                birthDate: '2024-01-02',
                status: 'ACTIVE',
                version: 3,
                originType: 'MANUAL',
                recordedBy: 'actor-a',
                recordedAt: '2026-09-20T12:00:00Z',
            }],
            page: 2,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/animals', {
            params: { q: 'brinco 42', page: 2, size: 20 },
            signal,
        })
    })

    test('fetches detail only by encoded stable animalId', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({ data: animalView })

        await getAnimalById({ animalId: 'animal/a', signal })

        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/animals/animal%2Fa',
            { signal }
        )
    })

    test('keeps identifiers and ownership as separate paged contracts', () => {
        const identifiers = mapAnimalIdentifierPage({
            items: [{
                id: 'identifier-a',
                animalId: 'animal-a',
                type: 'EAR_TAG',
                identifier: { value: '0042', issuer: 'ABC' },
                validFrom: '2024-01-01',
                validUntil: null,
                status: 'ACTIVE',
                version: 0,
            }],
            page: 0,
            size: 20,
        })
        const ownership = mapAnimalOwnershipPage({
            items: [{
                id: 'ownership-a',
                animalId: 'animal-a',
                ownerId: 'owner-a',
                period: { from: '2024-01-01', until: null },
                sourceDocumentId: null,
                version: 1,
            }],
            page: 0,
            size: 20,
        })

        expect(identifiers.items[0]).toEqual(expect.objectContaining({
            value: '0042',
            issuer: 'ABC',
            validUntil: null,
        }))
        expect(identifiers.items[0]).not.toHaveProperty('primaryIdentifier')
        expect(ownership.items[0]).toEqual(expect.objectContaining({
            ownerId: 'owner-a',
            from: '2024-01-01',
            until: null,
        }))
        expect(ownership.items[0]).not.toHaveProperty('currentOwner')
    })

    test('uses only page and size for identifier and ownership histories', async () => {
        const signal = new AbortController().signal
        targetApiClient.get
            .mockResolvedValueOnce({ data: { items: [], page: 1, size: 10 } })
            .mockResolvedValueOnce({ data: { items: [], page: 2, size: 15 } })

        await getAnimalIdentifiers({
            animalId: 'animal-a', page: 1, size: 10, signal,
        })
        await getAnimalOwnership({
            animalId: 'animal-a', page: 2, size: 15, signal,
        })

        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            1,
            '/animals/animal-a/identifiers',
            { params: { page: 1, size: 10 }, signal }
        )
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2,
            '/animals/animal-a/ownership',
            { params: { page: 2, size: 15 }, signal }
        )
    })

    test('resolves Breed and Animal owner through their real endpoints', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: 'breed-a',
                    name: 'Nelore',
                    code: 'NEL',
                    status: 'ACTIVE',
                    version: 0,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    id: 'owner-a',
                    type: 'COMPANY',
                    displayName: 'Fazenda Aurora',
                    legalName: null,
                    address: null,
                    status: 'ACTIVE',
                    version: 0,
                },
            })

        await expect(getBreedById({ breedId: 'breed-a' })).resolves.toMatchObject({
            id: 'breed-a',
            name: 'Nelore',
        })
        await expect(getAnimalOwnerById({ ownerId: 'owner-a' })).resolves.toMatchObject({
            id: 'owner-a',
            displayName: 'Fazenda Aurora',
        })
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            1,
            '/breeds/breed-a',
            { signal: undefined }
        )
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2,
            '/owners/owner-a',
            { params: { scope: 'ANIMAL' }, signal: undefined }
        )
    })

    test('enforces server validation bounds without adding unsupported filters', () => {
        expect(normalizeAnimalPageParams()).toEqual({ q: '', page: 0, size: 20 })
        expect(() => normalizeAnimalPageParams({
            query: 'a'.repeat(201),
        })).toThrow(TypeError)
        expect(() => normalizeAnimalPageParams({ page: 10001 })).toThrow(TypeError)
        expect(() => normalizeAnimalPageParams({ size: 101 })).toThrow(TypeError)
        expect(normalizeAnimalPageParams()).not.toHaveProperty('role')
        expect(normalizeAnimalPageParams()).not.toHaveProperty('ownerId')
        expect(normalizeAnimalPageParams()).not.toHaveProperty('sort')
    })

    test('normalizes forbidden, wrong-tenant not found, timeout and cancellation', async () => {
        targetApiClient.get
            .mockRejectedValueOnce({ response: { status: 403, data: { code: 'ACCESS_DENIED' } } })
            .mockRejectedValueOnce({ response: { status: 404, data: { code: 'ANIMAL_NOT_FOUND' } } })
            .mockRejectedValueOnce({ code: 'ECONNABORTED' })
            .mockRejectedValueOnce({ code: 'ERR_CANCELED' })

        await expect(getAnimals({ page: 0 })).rejects.toMatchObject({ kind: 'forbidden' })
        await expect(getAnimalById({ animalId: 'missing' })).rejects.toMatchObject({
            kind: 'notFound',
            code: 'ANIMAL_NOT_FOUND',
        })
        await expect(getAnimals({ page: 0 })).rejects.toMatchObject({ kind: 'timeout' })
        await expect(getAnimals({ page: 0 })).rejects.toMatchObject({ kind: 'canceled' })
    })

    test('rejects malformed Animals.View instead of inventing missing data', () => {
        expect(() => mapAnimalPage({
            items: [{ ...animalView, registration: { id: 'animal-a' } }],
            page: 0,
            size: 20,
        })).toThrow(TypeError)
    })
})
