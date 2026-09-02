import apiClient from './client'

export const getOocyteCollection = async (id, { signal } = {}) => {
    const response = await apiClient.get(`/oocyte-collection/${id}`, { signal })
    return response.data
}

export const createEmbryoProduction = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/production', payload, { signal })
    return response.data
}
