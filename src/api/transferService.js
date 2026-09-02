import apiClient from './client'

export const listTransfersByFiv = async (fivId, { signal } = {}) => {
    const response = await apiClient.get('/transfer', {
        params: { fivId },
        signal,
    })
    return response.data
}
