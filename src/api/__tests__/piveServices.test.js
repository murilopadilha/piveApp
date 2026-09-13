import apiClient from '../client'
import { discardEmbryos, freezeEmbryos } from '../embryoService'
import {
    createEmbryoProduction,
    createOocyteCollection,
    getOocyteCollection,
} from '../oocyteCollectionService'
import {
    getFivDetails,
    listFivs,
    listFivsByBull,
    listFivsByDonor,
} from '../fivService'

jest.mock('../client', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}))

const signal = { aborted: false }

beforeEach(() => {
    apiClient.get.mockResolvedValue({ data: { result: 'get' } })
    apiClient.post.mockResolvedValue({ data: { result: 'post' } })
})

describe('critical PIVE service contracts', () => {
    test.each([
        ['freeze', freezeEmbryos, '/embryo/frozen'],
        ['discard', discardEmbryos, '/embryo/discarded'],
    ])('%s forwards the original payload and signal', async (_, service, endpoint) => {
        const payload = { productionId: 7, embryosQuantity: 3 }

        await expect(service(payload, { signal })).resolves.toEqual({ result: 'post' })
        expect(apiClient.post).toHaveBeenCalledWith(endpoint, payload, { signal })
        expect(payload).toEqual({ productionId: 7, embryosQuantity: 3 })
    })

    test('gets an oocyte collection by path id', async () => {
        await expect(getOocyteCollection(12, { signal })).resolves.toEqual({ result: 'get' })
        expect(apiClient.get).toHaveBeenCalledWith('/oocyte-collection/12', { signal })
    })

    test.each([
        ['oocyte collection', createOocyteCollection, '/oocyte-collection'],
        ['embryo production', createEmbryoProduction, '/production'],
    ])('creates %s without changing its payload', async (_, service, endpoint) => {
        const payload = { fivId: 5, totalEmbryos: '0' }

        await expect(service(payload, { signal })).resolves.toEqual({ result: 'post' })
        expect(apiClient.post).toHaveBeenCalledWith(endpoint, payload, { signal })
        expect(payload).toEqual({ fivId: 5, totalEmbryos: '0' })
    })

    test('lists all FIVs', async () => {
        await expect(listFivs({ signal })).resolves.toEqual({ result: 'get' })
        expect(apiClient.get).toHaveBeenCalledWith('/fiv', { signal })
    })

    test.each([
        ['donor', listFivsByDonor, '/fiv/donor', 'donorId'],
        ['bull', listFivsByBull, '/fiv/bull', 'bullId'],
    ])('lists FIVs by %s with the current query contract', async (_, service, endpoint, key) => {
        await expect(service('42', { signal })).resolves.toEqual({ result: 'get' })
        expect(apiClient.get).toHaveBeenCalledWith(endpoint, {
            params: { [key]: '42' },
            signal,
        })
    })

    test('gets FIV details by path id', async () => {
        await expect(getFivDetails(9, { signal })).resolves.toEqual({ result: 'get' })
        expect(apiClient.get).toHaveBeenCalledWith('/fiv/9', { signal })
    })
})
