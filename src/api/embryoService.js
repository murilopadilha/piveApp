import apiClient from './client'

export const freezeEmbryos = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/embryo/frozen', payload, { signal })
    return response.data
}

export const discardEmbryos = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/embryo/discarded', payload, { signal })
    return response.data
}
