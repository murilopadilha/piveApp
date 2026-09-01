import apiClient from './client'

export const listFivs = async ({ signal } = {}) => {
    const response = await apiClient.get('/fiv', { signal })
    return response.data
}

export const listFivsByDonor = async (donorId, { signal } = {}) => {
    const response = await apiClient.get('/fiv/donor', {
        params: { donorId },
        signal,
    })
    return response.data
}

export const listFivsByBull = async (bullId, { signal } = {}) => {
    const response = await apiClient.get('/fiv/bull', {
        params: { bullId },
        signal,
    })
    return response.data
}

export const createFiv = async ({ signal } = {}) => {
    const response = await apiClient.post('/fiv', undefined, { signal })
    return response.data
}
