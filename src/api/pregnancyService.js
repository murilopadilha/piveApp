import apiClient from './client'

export const listInProgressPregnancyReceivers = async (fivId, { signal } = {}) => {
    const response = await apiClient.get(
        `/pregnancy/in-progress-receivers/${fivId}`,
        { signal }
    )
    return response.data
}
