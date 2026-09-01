import apiClient from './client'

export const listBulls = async ({ signal } = {}) => {
    const response = await apiClient.get('/bull', { signal })
    return response.data
}

export const searchBulls = async (registrationNumber, { signal } = {}) => {
    const response = await apiClient.get('/bull/search', {
        params: { registrationNumber },
        signal,
    })
    return response.data
}

export const listBullsByHighestAverageEmbryoPercentage = async ({ signal } = {}) => {
    const response = await apiClient.get('/bull/highest-average-embryo-percentage', { signal })
    return response.data
}

export const listDonorBullCombinations = async ({ signal } = {}) => {
    const response = await apiClient.get('/donor-bull-combinations', { signal })
    return response.data
}

export const createBull = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/bull', payload, { signal })
    return response.data
}

export const updateBull = async (id, payload, { signal } = {}) => {
    const response = await apiClient.put(`/bull/${id}`, payload, { signal })
    return response.data
}

export const deleteBull = async (id, { signal } = {}) => {
    const response = await apiClient.delete(`/bull/${id}`, { signal })
    return response.data
}
