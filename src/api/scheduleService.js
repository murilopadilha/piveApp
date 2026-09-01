import apiClient from './client'

export const listSchedules = async ({ signal } = {}) => {
    const response = await apiClient.get('/schedule', { signal })
    return response.data
}

export const getScheduleDetailsByDate = async (date, { signal } = {}) => {
    const response = await apiClient.get('/schedule/search', {
        params: { date },
        signal,
    })
    return response.data
}

export const createSchedule = async (payload, { signal } = {}) => {
    const response = await apiClient.post('/schedule', payload, { signal })
    return response.data
}

export const updateSchedule = async (id, payload, { signal } = {}) => {
    const response = await apiClient.put(`/schedule/${id}`, payload, { signal })
    return response.data
}

export const deleteSchedule = async (id, { signal } = {}) => {
    const response = await apiClient.delete(`/schedule/${id}`, { signal })
    return response.data
}
