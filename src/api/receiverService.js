import apiClient from './client'

export const listReceivers = async ({ signal } = {}) => {
    const response = await apiClient.get('/receiver', { signal })
    return response.data
}

export const searchReceivers = async (registrationNumber, { signal } = {}) => {
    const response = await apiClient.get('/receiver/search', {
        params: { registrationNumber },
        signal,
    })
    return response.data
}

export const createReceiver = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/receiver', payload, { signal })
    return response.data
}

export const updateReceiver = async (id, payload, { signal } = {}) => {
    const response = await apiClient.put(`/receiver/${id}`, payload, { signal })
    return response.data
}

export const deleteReceiver = async (id, { signal } = {}) => {
    const response = await apiClient.delete(`/receiver/${id}`, { signal })
    return response.data
}
