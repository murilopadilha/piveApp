import apiClient from './client'

export const listDonorBullCombinations = async ({ signal } = {}) => {
    const response = await apiClient.get('/donor-bull-combinations', { signal })
    return response.data
}
