import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'
import {
    DocumentBinaryError,
    normalizeDocumentBinary,
} from '../documentBinary'

export const DEFAULT_DOCUMENT_PAGE_SIZE = 20

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

const optionalString = (value, contractName) => (
    value == null ? null : requireString(value, contractName)
)

const requireNonnegativeInteger = (value, contractName) => {
    if (!Number.isInteger(value) || value < 0) {
        throw contractError(contractName)
    }

    return value
}

const mapPage = (value, contractName, mapItem) => {
    const page = requireRecord(value, contractName)
    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        page.page < 0 ||
        !Number.isInteger(page.size) ||
        page.size < 1
    ) {
        throw contractError(contractName)
    }

    return {
        items: page.items.map(mapItem),
        page: page.page,
        size: page.size,
    }
}

export const mapDocument = (value) => {
    const document = requireRecord(value, 'Document')

    return {
        id: requireString(document.id, 'Document'),
        typeCode: requireString(document.typeCode, 'Document'),
        status: requireString(document.status, 'Document'),
        currentVersionId: optionalString(
            document.currentVersionId,
            'Document'
        ),
        version: requireNonnegativeInteger(document.version, 'Document'),
        createdAt: requireString(document.createdAt, 'Document'),
    }
}

export const mapDocumentPage = value => mapPage(
    value,
    'Document page',
    mapDocument
)

export const mapDocumentVersion = (value) => {
    const version = requireRecord(value, 'Document version')

    return {
        id: requireString(version.id, 'Document version'),
        documentId: requireString(version.documentId, 'Document version'),
        versionNumber: requireNonnegativeInteger(
            version.versionNumber,
            'Document version'
        ),
        originalFileName: requireString(
            version.originalFileName,
            'Document version'
        ),
        mimeType: requireString(version.mimeType, 'Document version'),
        sizeBytes: requireNonnegativeInteger(
            version.sizeBytes,
            'Document version'
        ),
        checksum: requireString(version.checksum, 'Document version'),
        uploadedAt: requireString(version.uploadedAt, 'Document version'),
    }
}

export const mapDocumentVersionPage = value => mapPage(
    value,
    'Document version page',
    mapDocumentVersion
)

export const normalizeDocumentPageParams = ({
    page = 0,
    size = DEFAULT_DOCUMENT_PAGE_SIZE,
} = {}) => {
    if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000 ||
        !Number.isInteger(size) ||
        size < 1 ||
        size > 100
    ) {
        throw new TypeError('Invalid document page parameters.')
    }

    return { page, size }
}

const normalizeAndThrow = (error, fallbackDetail) => {
    throw normalizeTargetApiError(error, fallbackDetail)
}

const readResponseHeader = (headers, name) => {
    if (typeof headers?.get === 'function') {
        return headers.get(name) ?? null
    }

    const key = Object.keys(headers ?? {}).find(
        candidate => candidate.toLowerCase() === name.toLowerCase()
    )

    return key ? headers[key] : null
}

const decodeUtf8 = (buffer) => {
    const bytes = new Uint8Array(buffer)
    let result = ''

    for (let index = 0; index < bytes.length;) {
        const first = bytes[index++]
        let codePoint
        let continuationCount

        if (first <= 0x7f) {
            codePoint = first
            continuationCount = 0
        } else if ((first & 0xe0) === 0xc0) {
            codePoint = first & 0x1f
            continuationCount = 1
        } else if ((first & 0xf0) === 0xe0) {
            codePoint = first & 0x0f
            continuationCount = 2
        } else if ((first & 0xf8) === 0xf0) {
            codePoint = first & 0x07
            continuationCount = 3
        } else {
            throw new TypeError('Invalid UTF-8 response.')
        }

        for (let offset = 0; offset < continuationCount; offset += 1) {
            const continuation = bytes[index++]
            if ((continuation & 0xc0) !== 0x80) {
                throw new TypeError('Invalid UTF-8 response.')
            }
            codePoint = (codePoint << 6) | (continuation & 0x3f)
        }

        if (codePoint <= 0xffff) {
            result += String.fromCharCode(codePoint)
        } else {
            const surrogate = codePoint - 0x10000
            result += String.fromCharCode(
                0xd800 + (surrogate >>> 10),
                0xdc00 + (surrogate & 0x3ff)
            )
        }
    }

    return result
}

const withDecodedProblemDetails = (error) => {
    const contentType = readResponseHeader(
        error?.response?.headers,
        'content-type'
    )

    if (!contentType?.toLowerCase().includes('json')) {
        return error
    }

    try {
        const binary = normalizeDocumentBinary(error.response.data)
        const problem = JSON.parse(decodeUtf8(binary))

        if (!problem || typeof problem !== 'object' || Array.isArray(problem)) {
            return error
        }

        return {
            ...error,
            response: { ...error.response, data: problem },
        }
    } catch {
        return error
    }
}

export const getDocuments = async ({
    page = 0,
    size = DEFAULT_DOCUMENT_PAGE_SIZE,
    signal,
} = {}) => {
    try {
        const response = await targetApiClient.get('/documents', {
            params: normalizeDocumentPageParams({ page, size }),
            signal,
        })

        return mapDocumentPage(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar os documentos.')
    }
}

export const getDocumentById = async ({ documentId, signal }) => {
    try {
        const id = requireString(documentId, 'Document identifier')
        const response = await targetApiClient.get(
            `/documents/${encodeURIComponent(id)}`,
            { signal }
        )

        return mapDocument(response.data)
    } catch (error) {
        return normalizeAndThrow(error, 'Não foi possível carregar o documento.')
    }
}

export const getDocumentVersions = async ({
    documentId,
    page = 0,
    size = DEFAULT_DOCUMENT_PAGE_SIZE,
    signal,
}) => {
    try {
        const id = requireString(documentId, 'Document identifier')
        const response = await targetApiClient.get(
            `/documents/${encodeURIComponent(id)}/versions`,
            {
                params: normalizeDocumentPageParams({ page, size }),
                signal,
            }
        )

        return mapDocumentVersionPage(response.data)
    } catch (error) {
        return normalizeAndThrow(
            error,
            'Não foi possível carregar as versões do documento.'
        )
    }
}

export const getDocumentVersionContent = async ({
    documentId,
    versionId,
    signal,
}) => {
    try {
        const id = requireString(documentId, 'Document identifier')
        const immutableVersionId = requireString(
            versionId,
            'Document version identifier'
        )
        const response = await targetApiClient.get(
            `/documents/${encodeURIComponent(id)}/versions/${encodeURIComponent(immutableVersionId)}/content`,
            {
                responseType: 'arraybuffer',
                signal,
            }
        )

        return normalizeDocumentBinary(response.data)
    } catch (error) {
        if (error instanceof DocumentBinaryError) {
            throw error
        }

        return normalizeAndThrow(
            withDecodedProblemDetails(error),
            'Não foi possível baixar esta versão do documento.'
        )
    }
}
