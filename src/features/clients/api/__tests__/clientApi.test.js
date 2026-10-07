import targetApiClient from '../../../../api/target/client'
import {
    getClientById,
    getClients,
    mapClientDetail,
    mapClientPage,
    normalizeClientSearchParams,
} from '../clientApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}))

const listItem = {
    id: 'client-a',
    type: 'COMPANY',
    displayName: 'Fazenda Aurora',
    legalName: 'Aurora Pecuária Ltda.',
    address: {
        addressLine: 'Rodovia 1',
        municipality: 'Uberaba',
        state: 'MG',
        country: 'BR',
        postalCode: null,
    },
    status: 'ACTIVE',
    version: 3,
}

const detail = {
    id: 'client-a',
    type: 'COMPANY',
    displayName: 'Fazenda Aurora',
    version: 3,
    originType: 'MANUAL',
    recordedBy: 'actor-a',
    recordedAt: '2026-09-20T12:00:00Z',
}

describe('target Client API', () => {
    test('sends q, page and size to the real list endpoint', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({
            data: { items: [listItem], page: 2, size: 20 },
        })

        await expect(getClients({
            query: ' Aurora ',
            page: 2,
            size: 20,
            signal,
        })).resolves.toEqual({
            items: [listItem],
            page: 2,
            size: 20,
        })
        expect(targetApiClient.get).toHaveBeenCalledWith('/clients', {
            params: { q: 'Aurora', page: 2, size: 20 },
            signal,
        })
    })

    test('fetches Client detail only by stable clientId', async () => {
        const signal = new AbortController().signal
        targetApiClient.get.mockResolvedValueOnce({ data: detail })

        await expect(getClientById({
            clientId: 'client/a',
            signal,
        })).resolves.toEqual(detail)
        expect(targetApiClient.get).toHaveBeenCalledWith(
            '/clients/client%2Fa',
            { signal }
        )
    })

    test('keeps list and detail DTOs distinct', () => {
        const mappedPage = mapClientPage({
            items: [{ ...listItem, originType: 'IGNORED' }],
            page: 0,
            size: 20,
        })
        const mappedDetail = mapClientDetail({
            ...detail,
            legalName: 'IGNORED',
            address: listItem.address,
            status: 'ACTIVE',
        })

        expect(mappedPage.items[0]).toEqual(listItem)
        expect(mappedPage.items[0]).not.toHaveProperty('originType')
        expect(mappedDetail).toEqual(detail)
        expect(mappedDetail).not.toHaveProperty('legalName')
        expect(mappedDetail).not.toHaveProperty('address')
        expect(mappedDetail).not.toHaveProperty('status')
    })

    test('enforces the implemented search bounds without inventing sorting', () => {
        expect(normalizeClientSearchParams()).toEqual({
            q: '',
            page: 0,
            size: 20,
        })
        expect(() => normalizeClientSearchParams({
            query: 'a'.repeat(201),
        })).toThrow(TypeError)
        expect(() => normalizeClientSearchParams({ page: 10001 })).toThrow(TypeError)
        expect(() => normalizeClientSearchParams({ size: 101 })).toThrow(TypeError)
        expect(normalizeClientSearchParams()).not.toHaveProperty('sort')
    })

    test('normalizes 403, 404 CLIENT_NOT_FOUND and network failures', async () => {
        targetApiClient.get
            .mockRejectedValueOnce({
                response: {
                    status: 403,
                    data: {
                        code: 'ACCESS_DENIED',
                        detail: 'Access denied',
                    },
                },
            })
            .mockRejectedValueOnce({
                response: {
                    status: 404,
                    data: {
                        code: 'CLIENT_NOT_FOUND',
                        detail: 'Client not found',
                    },
                },
            })
            .mockRejectedValueOnce({ code: 'ERR_NETWORK' })

        await expect(getClients({ page: 0 })).rejects.toMatchObject({
            kind: 'forbidden',
            code: 'ACCESS_DENIED',
        })
        await expect(getClientById({ clientId: 'missing' })).rejects.toMatchObject({
            kind: 'notFound',
            code: 'CLIENT_NOT_FOUND',
        })
        await expect(getClients({ page: 0 })).rejects.toMatchObject({
            kind: 'network',
        })
    })
})
