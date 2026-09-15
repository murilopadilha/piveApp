const EMPTY_RUNTIME_CONTEXT = Object.freeze({
    accessToken: null,
    organizationId: null,
})

let runtimeContext = EMPTY_RUNTIME_CONTEXT

const asOptionalNonEmptyString = (value, fieldName) => {
    if (value == null) {
        return null
    }

    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`${fieldName} must be a non-empty string or null.`)
    }

    return value.trim()
}

export class TargetRequestContextError extends Error {
    constructor(code, message) {
        super(message)
        this.name = 'TargetRequestContextError'
        this.code = code
    }
}

export const getTargetRuntimeContext = () => runtimeContext

export const setTargetAccessToken = (accessToken) => {
    runtimeContext = {
        ...runtimeContext,
        accessToken: asOptionalNonEmptyString(accessToken, 'accessToken'),
    }
}

export const setTargetOrganizationId = (organizationId) => {
    runtimeContext = {
        ...runtimeContext,
        organizationId: asOptionalNonEmptyString(
            organizationId,
            'organizationId'
        ),
    }
}

export const resetTargetRuntimeContext = () => {
    runtimeContext = EMPTY_RUNTIME_CONTEXT
}

const setHeader = (headers, name, value) => {
    if (typeof headers?.set === 'function') {
        headers.set(name, value)
        return headers
    }

    return {
        ...headers,
        [name]: value,
    }
}

export const applyTargetRequestContext = (
    config,
    {
        context = getTargetRuntimeContext(),
        organizationHeaderName = null,
        correlationHeaderName = null,
    } = {}
) => {
    const requestContext = config.targetContext ?? {}
    const requiresAuthentication = requestContext.requiresAuthentication !== false
    const organizationScoped = requestContext.organizationScoped !== false
    let headers = config.headers

    if (requiresAuthentication && !context.accessToken) {
        throw new TargetRequestContextError(
            'AUTHENTICATION_REQUIRED',
            'Target request requires an authenticated session.'
        )
    }

    if (organizationScoped && !context.organizationId) {
        throw new TargetRequestContextError(
            'ORGANIZATION_REQUIRED',
            'Target request requires an active Organization.'
        )
    }

    if (context.accessToken) {
        headers = setHeader(headers, 'Authorization', `Bearer ${context.accessToken}`)
    }

    if (context.organizationId && organizationHeaderName) {
        headers = setHeader(
            headers,
            organizationHeaderName,
            context.organizationId
        )
    }

    if (requestContext.correlationId && correlationHeaderName) {
        headers = setHeader(
            headers,
            correlationHeaderName,
            requestContext.correlationId
        )
    }

    if (requestContext.idempotencyKey) {
        headers = setHeader(
            headers,
            'Idempotency-Key',
            requestContext.idempotencyKey
        )
    }

    if (requestContext.expectedVersion != null) {
        headers = setHeader(
            headers,
            'If-Match',
            String(requestContext.expectedVersion)
        )
    }

    const nextConfig = {
        ...config,
        headers,
    }

    delete nextConfig.targetContext

    return nextConfig
}
