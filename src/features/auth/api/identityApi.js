import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

const contractError = (contractName) => new TypeError(
    `Invalid ${contractName} response from target API.`
)

const requireRecord = (value, contractName) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw contractError(contractName)
    }

    return value
}

const requireString = (value, contractName) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw contractError(contractName)
    }

    return value
}

const requirePermissions = (value, contractName) => {
    if (!Array.isArray(value) || value.some(permission => (
        typeof permission !== 'string' || !permission.trim()
    ))) {
        throw contractError(contractName)
    }

    return [...value]
}

export const mapMembership = (value) => {
    const membership = requireRecord(value, 'membership')

    return {
        organizationId: requireString(
            membership.organizationId,
            'membership'
        ),
        actorId: requireString(membership.actorId, 'membership'),
        permissions: requirePermissions(
            membership.permissions,
            'membership'
        ),
    }
}

export const mapMemberships = (value) => {
    if (!Array.isArray(value)) {
        throw contractError('memberships')
    }

    return value.map(mapMembership)
}

export const mapEffectiveContext = (value) => {
    const context = requireRecord(value, 'effective context')

    return {
        tenantId: requireString(context.tenantId, 'effective context'),
        actorId: requireString(context.actorId, 'effective context'),
        permissions: requirePermissions(
            context.permissions,
            'effective context'
        ),
        correlationId: requireString(
            context.correlationId,
            'effective context'
        ),
    }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getMemberships = async ({ signal } = {}) => {
    try {
        const response = await targetApiClient.get('/me/memberships', {
            signal,
            targetContext: { organizationScoped: false },
        })

        return mapMemberships(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar as organizações autorizadas.'
        )
    }
}

export const getEffectiveContext = async ({ signal } = {}) => {
    try {
        const response = await targetApiClient.get('/me', { signal })

        return mapEffectiveContext(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o contexto da organização.'
        )
    }
}
