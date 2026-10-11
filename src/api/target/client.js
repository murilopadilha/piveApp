import axios from 'axios'

import { TARGET_API_BASE_URL } from '../../config/targetApi'
import {
    applyTargetRequestContext,
    getTargetRuntimeContext,
} from './requestContext'
import {
    getValidTargetAccessToken,
    notifyTargetSessionExpired,
    recoverTargetAuthentication,
} from './authRuntime'

export const TARGET_API_TIMEOUT_MS = 15000
export const TARGET_ORGANIZATION_HEADER = 'X-Organization-ID'
export const TARGET_CORRELATION_HEADER = 'X-Correlation-ID'

export class TargetApiConfigurationError extends Error {
    constructor() {
        super('EXPO_PUBLIC_TARGET_API_URL is required for target API requests.')
        this.name = 'TargetApiConfigurationError'
        this.code = 'TARGET_API_URL_REQUIRED'
    }
}

export const createTargetApiClient = ({
    baseURL = TARGET_API_BASE_URL,
    getRequestContext = getTargetRuntimeContext,
    organizationHeaderName = TARGET_ORGANIZATION_HEADER,
    correlationHeaderName = TARGET_CORRELATION_HEADER,
    authRuntime = {
        getValidAccessToken: getValidTargetAccessToken,
        recoverUnauthorized: recoverTargetAuthentication,
        notifySessionExpired: notifyTargetSessionExpired,
    },
} = {}) => {
    const client = axios.create({
        baseURL: baseURL || undefined,
        timeout: TARGET_API_TIMEOUT_MS,
    })

    client.interceptors.request.use(async (config) => {
        if (!baseURL) {
            throw new TargetApiConfigurationError()
        }

        const requestContext = config.targetContext ?? {}
        let context = getRequestContext()

        if (requestContext.requiresAuthentication !== false) {
            const accessToken = await authRuntime.getValidAccessToken()

            if (accessToken) {
                context = { ...context, accessToken }
            }
        }

        return applyTargetRequestContext(config, {
            context,
            organizationHeaderName,
            correlationHeaderName,
        })
    })

    client.interceptors.response.use(
        response => response,
        async (error) => {
            const request = error?.config

            if (error?.response?.status !== 401 || !request) {
                throw error
            }

            if (request.__targetAuthRetried) {
                await authRuntime.notifySessionExpired()
                throw error
            }

            let accessToken

            try {
                accessToken = await authRuntime.recoverUnauthorized()
            } catch {
                await authRuntime.notifySessionExpired()
                throw error
            }

            if (!accessToken) {
                await authRuntime.notifySessionExpired()
                throw error
            }

            request.__targetAuthRetried = true
            return client.request(request)
        }
    )

    return client
}

const targetApiClient = createTargetApiClient()

export default targetApiClient
