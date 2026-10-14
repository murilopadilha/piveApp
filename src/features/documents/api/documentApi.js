import targetApiClient from '../../../api/target/client'
import { normalizeTargetApiError } from '../../../api/target/problemDetails'

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
