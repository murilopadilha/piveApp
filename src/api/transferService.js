import apiClient from './client'

export const listTransfersByFiv = async (fivId, { signal } = {}) => {
    const response = await apiClient.get('/transfer', {
        params: { fivId },
        signal,
    })
    return response.data
}

export const createEmbryoTransfer = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/embryo/transfer', payload, { signal })
    return response.data
}
