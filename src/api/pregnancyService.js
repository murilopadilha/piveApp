import apiClient from './client'

export const listInProgressPregnancyReceivers = async (fivId, { signal } = {}) => {
    const response = await apiClient.get(
        `/pregnancy/in-progress-receivers/${fivId}`,
        { signal }
    )
    return response.data
}

export const createPregnancy = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/pregnancy', payload, { signal })
    return response.data
}
