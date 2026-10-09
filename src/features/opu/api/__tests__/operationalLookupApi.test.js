import targetApiClient from '../../../../api/target/client'
import {
    getEstablishmentById,
    getEstablishments,
    getFarmProperties,
    getOperationalLocations,
    getProfessionals,
    normalizeOperationalLookupParams,
} from '../operationalLookupApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}))

const address = {
    addressLine: 'Estrada 1',
    municipality: 'Cidade',
    state: 'SP',
    country: 'BR',
    postalCode: null,
}

describe('OPU operational lookup API', () => {
    test('uses real paged lookup endpoints and maps their distinct DTOs', async () => {
        targetApiClient.get
            .mockResolvedValueOnce({
                data: {
                    items: [{
                        details: {
                            id: 'establishment-a',
                            legalDisplayName: 'Laboratório A',
                            operatingMode: 'COMMERCIAL',
                            address,
                            registrationIssuer: null,
                            registrationNumber: null,
                            capabilities: ['OOCYTE_COLLECTION'],
                        },
                        status: 'ACTIVE',
                        version: 0,
                    }],
                    page: 0,
                    size: 20,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    items: [{
                        id: 'location-a',
                        establishmentId: 'establishment-a',
                        name: 'Sala de coleta',
                        type: 'COLLECTION_UNIT',
                        timezone: 'America/Sao_Paulo',
                        status: 'ACTIVE',
                        version: 0,
                    }],
                    page: 0,
                    size: 20,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    items: [{
                        details: {
                            id: 'farm-a',
                            name: 'Fazenda A',
                            ownerId: null,
                            operatorId: null,
                            address,
                            municipalityCode: null,
                            internalCode: null,
                        },
                        status: 'ACTIVE',
                        version: 0,
                    }],
                    page: 0,
                    size: 20,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    items: [{
                        id: 'professional-a',
                        name: 'Dra. Ana',
                        professionalType: 'VETERINARIAN',
                        linkedUserId: null,
                        status: 'ACTIVE',
                        version: 0,
                    }],
                    page: 0,
                    size: 20,
                },
            })

        await expect(getEstablishments({ query: ' lab ', page: 0 })).resolves.toMatchObject({
            items: [{ legalDisplayName: 'Laboratório A' }],
        })
        await expect(getOperationalLocations({
            establishmentId: 'establishment-a', query: '', page: 0,
        })).resolves.toMatchObject({ items: [{ name: 'Sala de coleta' }] })
        await expect(getFarmProperties({ query: '', page: 0 })).resolves.toMatchObject({
            items: [{ name: 'Fazenda A' }],
        })
        await expect(getProfessionals({ query: '', page: 0 })).resolves.toMatchObject({
            items: [{ name: 'Dra. Ana' }],
        })

        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            1,
            '/establishments',
            { params: { q: 'lab', page: 0, size: 20 }, signal: undefined }
        )
        expect(targetApiClient.get).toHaveBeenNthCalledWith(
            2,
            '/establishments/establishment-a/operational-locations',
            { params: { q: '', page: 0, size: 20 }, signal: undefined }
        )
    })

    test('loads an exact establishment detail without a generic resource client', async () => {
        targetApiClient.get.mockResolvedValueOnce({
            data: {
                details: {
                    id: 'establishment-a',
                    legalDisplayName: 'Laboratório A',
                    operatingMode: 'COMMERCIAL',
                    address,
                    registrationIssuer: null,
                    registrationNumber: null,
                    capabilities: [],
                },
                status: 'ACTIVE',
                version: 0,
            },
        })

        await expect(getEstablishmentById({
            establishmentId: 'establishment/a',
        })).resolves.toMatchObject({ id: 'establishment-a' })
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/establishments/establishment%2Fa',
            { signal: undefined }
        )
    })

    test('enforces the shared backend lookup bounds', () => {
        expect(normalizeOperationalLookupParams()).toEqual({
            q: '', page: 0, size: 20,
        })
        expect(() => normalizeOperationalLookupParams({
            query: 'x'.repeat(201),
        })).toThrow(TypeError)
        expect(() => normalizeOperationalLookupParams({ size: 101 })).toThrow(TypeError)
    })
})
