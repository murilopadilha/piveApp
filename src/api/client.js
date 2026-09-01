import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const DEFAULT_TIMEOUT_MS = 15000

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
})

export default apiClient
