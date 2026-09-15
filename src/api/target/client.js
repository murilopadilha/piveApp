import axios from 'axios'

import { TARGET_API_BASE_URL } from '../../config/targetApi'
import {
    applyTargetRequestContext,
    getTargetRuntimeContext,
} from './requestContext'

export const TARGET_API_TIMEOUT_MS = 15000

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
    organizationHeaderName = null,
    correlationHeaderName = null,
} = {}) => {
    const client = axios.create({
        baseURL: baseURL || undefined,
        timeout: TARGET_API_TIMEOUT_MS,
    })

    client.interceptors.request.use((config) => {
        if (!baseURL) {
            throw new TargetApiConfigurationError()
        }

        return applyTargetRequestContext(config, {
            context: getRequestContext(),
            organizationHeaderName,
            correlationHeaderName,
        })
    })

    return client
}

const targetApiClient = createTargetApiClient()

export default targetApiClient
