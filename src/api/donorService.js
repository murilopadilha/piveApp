import apiClient from './client'

export const listDonors = async ({ signal } = {}) => {
    const response = await apiClient.get('/donor', { signal })
    return response.data
}

export const searchDonors = async (registrationNumber, { signal } = {}) => {
    const response = await apiClient.get('/donor/search', {
        params: { registrationNumber },
        signal,
    })
    return response.data
}

export const listDonorsByHighestAverageOocytes = async ({ signal } = {}) => {
    const response = await apiClient.get('/donor/highest-average-oocytes', { signal })
    return response.data
}

export const listDonorsByHighestAverageEmbryoPercentage = async ({ signal } = {}) => {
    const response = await apiClient.get('/donor/highest-average-embryo-percentage', { signal })
    return response.data
}

export const listDonorBullCombinations = async ({ signal } = {}) => {
    const response = await apiClient.get('/donor-bull-combinations', { signal })
    return response.data
}

export const createDonor = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/donor', payload, { signal })
    return response.data
}

export const updateDonor = async (id, payload, { signal } = {}) => {
    const response = await apiClient.put(`/donor/${id}`, payload, { signal })
    return response.data
}

export const deleteDonor = async (id, { signal } = {}) => {
    const response = await apiClient.delete(`/donor/${id}`, { signal })
    return response.data
}
