import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

export const DEFAULT_DATA_QUALITY_PAGE_SIZE = 20
export const MAX_DATA_QUALITY_QUERY_LENGTH = 200

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

export const mapDataQualityIssue = (value) => {
    const issue = requireRecord(value, 'Data Quality issue')

    return {
        subjectType: requireString(issue.subjectType, 'Data Quality issue'),
        subjectId: requireString(issue.subjectId, 'Data Quality issue'),
        code: requireString(issue.code, 'Data Quality issue'),
        severity: requireString(issue.severity, 'Data Quality issue'),
    }
}

export const mapDataQualityPage = (value) => {
    const page = requireRecord(value, 'Data Quality page')

    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError('Data Quality page')
    }

    return {
        items: page.items.map(mapDataQualityIssue),
        page: page.page,
        size: page.size,
    }
}

export const normalizeDataQualityQuery = (query = '') => {
    if (typeof query !== 'string') {
        throw new TypeError('Invalid Data Quality query.')
    }

    const normalized = query.trim()

    if (normalized.length > MAX_DATA_QUALITY_QUERY_LENGTH) {
        throw new TypeError('Invalid Data Quality query.')
    }

    return normalized
}

export const normalizeDataQualitySearchParams = ({
    query = '',
    page = 0,
    size = DEFAULT_DATA_QUALITY_PAGE_SIZE,
} = {}) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid Data Quality page parameters.')
    }

    return {
        q: normalizeDataQualityQuery(query),
        page,
        size,
    }
}

export const getDataQualityIssues = async ({
    query = '',
    page = 0,
    size = DEFAULT_DATA_QUALITY_PAGE_SIZE,
    signal,
} = {}) => {
    try {
        const response = await targetApiClient.get('/data-quality', {
            params: normalizeDataQualitySearchParams({ query, page, size }),
            signal,
        })

        return mapDataQualityPage(response.data)
    } catch (error) {
        throw normalizeTargetApiError(
            error,
            'Não foi possível carregar os issues de qualidade de dados.'
        )
    }
}
