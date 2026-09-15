export const TARGET_API_VERSION_PATH = '/api/v1'

export const resolveTargetApiBaseUrl = (configuredUrl) => {
    const normalizedUrl = configuredUrl?.trim().replace(/\/+$/, '')

    if (!normalizedUrl) {
        return null
    }

    if (normalizedUrl.endsWith(TARGET_API_VERSION_PATH)) {
        return normalizedUrl
    }

    return `${normalizedUrl}${TARGET_API_VERSION_PATH}`
}

export const TARGET_API_BASE_URL = resolveTargetApiBaseUrl(
    process.env.EXPO_PUBLIC_TARGET_API_URL
)
