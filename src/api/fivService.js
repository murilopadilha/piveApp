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

export const getFivDetails = async (id, { signal } = {}) => {
    const response = await apiClient.get(`/fiv/${id}`, { signal })
    return response.data
}

export const createFiv = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/fiv', payload, { signal })
    return response.data
}
