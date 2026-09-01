const DEFAULT_API_URL = 'http://18.188.243.197:8080'

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim()

export const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
