import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_CORRECTION_PAGE_SIZE = 20

export const CORRECTION_SUBJECT_TYPES = Object.freeze([
    'MATING',
    'CRYOPRESERVATION_ITEM',
    'PACKAGE_ITEM',
    'EMBRYO_TRANSFER',
    'PREGNANCY_CHECK',
])

const contractError = contractName => new TypeError(
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

const requireNonnegativeInteger = (value, contractName) => {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw contractError(contractName)
    }

    return value
}

const optionalNonnegativeInteger = (value, contractName) => (
    value == null ? null : requireNonnegativeInteger(value, contractName)
)

export const mapCorrection = (value) => {
    const correction = requireRecord(value, 'Correction')
    const subjectType = requireString(correction.subjectType, 'Correction')

    if (!CORRECTION_SUBJECT_TYPES.includes(subjectType)) {
        throw contractError('Correction')
    }

    return {
        id: requireString(correction.id, 'Correction'),
        subjectType,
        subjectId: requireString(correction.subjectId, 'Correction'),
        reason: requireString(correction.reason, 'Correction'),
        previousSemantics: requireString(
            correction.previousSemantics,
            'Correction'
        ),
        proposedSemantics: requireString(
            correction.proposedSemantics,
            'Correction'
        ),
        subjectVersion: optionalNonnegativeInteger(
            correction.subjectVersion,
            'Correction'
        ),
        status: requireString(correction.status, 'Correction'),
        requestedAt: requireString(correction.requestedAt, 'Correction'),
    }
}

export const mapCorrectionPage = (value) => {
    const page = requireRecord(value, 'Correction page')

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError('Correction page')
    }

    return {
        items: page.items.map(mapCorrection),
        page: page.page,
        size: page.size,
    }
}

export const mapCorrectionImpact = (value) => {
    const impact = requireRecord(value, 'Correction impact')

    return {
        affectedEmbryos: requireNonnegativeInteger(
            impact.affectedEmbryos,
            'Correction impact'
        ),
        activePackages: requireNonnegativeInteger(
            impact.activePackages,
            'Correction impact'
        ),
        performedTransfers: requireNonnegativeInteger(
            impact.performedTransfers,
            'Correction impact'
        ),
        applicationBlocker: requireString(
            impact.applicationBlocker,
            'Correction impact'
        ),
    }
}

export const normalizeCorrectionPageParams = ({
    page = 0,
    size = DEFAULT_CORRECTION_PAGE_SIZE,
} = {}) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid correction page parameters.')
    }

    return { page, size }
}

const requireIdentifier = (value) => requireString(
    value,
    'Correction identifier'
)

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

export const getCorrections = async ({
    page = 0,
    size = DEFAULT_CORRECTION_PAGE_SIZE,
    signal,
} = {}) => {
    try {
        const response = await targetApiClient.get('/corrections', {
            params: normalizeCorrectionPageParams({ page, size }),
            signal,
        })

        return mapCorrectionPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar as solicitações de correção.'
        )
    }
}

export const getCorrectionById = async ({ correctionId, signal }) => {
    try {
        const id = requireIdentifier(correctionId)
        const response = await targetApiClient.get(
            `/corrections/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapCorrection(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar a solicitação de correção.'
        )
    }
}

export const getCorrectionImpact = async ({ correctionId, signal }) => {
    try {
        const id = requireIdentifier(correctionId)
        const response = await targetApiClient.get(
            `/corrections/${encodeURIComponent(id)}/impact`,
            { signal }
        )

        return mapCorrectionImpact(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar o impacto atual da solicitação.'
        )
    }
}
