import * as FileSystem from 'expo-file-system'

import { createUuidV7 } from '../../utils/uuid'

export const DOCUMENT_TEMPORARY_DIRECTORY_NAME = 'bovina-documents'

const BASE64_ALPHABET = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
)
const BASE64_CHUNK_BYTES = 3 * 2048

export class DocumentBinaryError extends Error {
    constructor(code, message) {
        super(message)
        this.name = 'DocumentBinaryError'
        this.code = code
    }
}

const binaryError = (code, message) => new DocumentBinaryError(code, message)

export const normalizeDocumentBinary = (value) => {
    let buffer

    if (value instanceof ArrayBuffer) {
        buffer = value
    } else if (ArrayBuffer.isView(value)) {
        buffer = value.buffer.slice(
            value.byteOffset,
            value.byteOffset + value.byteLength
        )
    } else {
        throw binaryError(
            'INVALID_DOCUMENT_BINARY',
            'Document content is not a supported binary response.'
        )
    }

    if (buffer.byteLength < 1) {
        throw binaryError(
            'INVALID_DOCUMENT_BINARY',
            'Document content is empty.'
        )
    }

    return buffer
}

export const validateDocumentBinarySize = (buffer, expectedSize) => {
    const normalized = normalizeDocumentBinary(buffer)

    if (!Number.isInteger(expectedSize) || expectedSize < 1) {
        throw binaryError(
            'INVALID_DOCUMENT_METADATA',
            'Document version size is invalid.'
        )
    }
    if (normalized.byteLength !== expectedSize) {
        throw binaryError(
            'DOCUMENT_BINARY_SIZE_MISMATCH',
            'Downloaded content does not match the immutable version size.'
        )
    }

    return normalized
}

const encodeBase64Chunk = (bytes, start, end) => {
    let encoded = ''

    for (let index = start; index < end; index += 3) {
        const first = bytes[index]
        const hasSecond = index + 1 < end
        const hasThird = index + 2 < end
        const second = hasSecond ? bytes[index + 1] : 0
        const third = hasThird ? bytes[index + 2] : 0
        const packed = (first << 16) | (second << 8) | third

        encoded += BASE64_ALPHABET[(packed >>> 18) & 63]
        encoded += BASE64_ALPHABET[(packed >>> 12) & 63]
        encoded += hasSecond ? BASE64_ALPHABET[(packed >>> 6) & 63] : '='
        encoded += hasThird ? BASE64_ALPHABET[packed & 63] : '='
    }

    return encoded
}

export const encodeDocumentBinaryAsBase64 = (buffer) => {
    const bytes = new Uint8Array(normalizeDocumentBinary(buffer))
    const chunks = []

    for (let start = 0; start < bytes.length; start += BASE64_CHUNK_BYTES) {
        chunks.push(encodeBase64Chunk(
            bytes,
            start,
            Math.min(start + BASE64_CHUNK_BYTES, bytes.length)
        ))
    }

    return chunks.join('')
}

export const getSafeDocumentExtension = (originalFileName) => {
    if (typeof originalFileName !== 'string') {
        return ''
    }
    const fileName = originalFileName.trim()
    const lastDot = fileName.lastIndexOf('.')

    if (lastDot <= 0 || lastDot === fileName.length - 1) {
        return ''
    }
    const extension = fileName.slice(lastDot + 1)

    return /^[A-Za-z0-9]{1,10}$/.test(extension)
        ? `.${extension.toLowerCase()}`
        : ''
}

export const getDocumentTemporaryDirectory = (
    fileSystem = FileSystem
) => {
    if (
        typeof fileSystem.cacheDirectory !== 'string' ||
        !fileSystem.cacheDirectory
    ) {
        throw binaryError(
            'DOCUMENT_TEMPORARY_STORAGE_UNAVAILABLE',
            'Temporary document storage is unavailable.'
        )
    }

    return `${fileSystem.cacheDirectory}${DOCUMENT_TEMPORARY_DIRECTORY_NAME}/`
}

export const createDocumentTemporaryFileUri = ({
    originalFileName,
    fileSystem = FileSystem,
    createId = createUuidV7,
}) => {
    const id = createId()

    if (typeof id !== 'string' || !/^[0-9a-f-]+$/i.test(id)) {
        throw binaryError(
            'DOCUMENT_TEMPORARY_FILE_INVALID',
            'Temporary document identifier is invalid.'
        )
    }

    return `${getDocumentTemporaryDirectory(fileSystem)}${id}${getSafeDocumentExtension(originalFileName)}`
}

export const writeDocumentTemporaryFile = async ({
    buffer,
    originalFileName,
    fileSystem = FileSystem,
    createId = createUuidV7,
}) => {
    const directory = getDocumentTemporaryDirectory(fileSystem)
    const uri = createDocumentTemporaryFileUri({
        originalFileName,
        fileSystem,
        createId,
    })
    const base64 = encodeDocumentBinaryAsBase64(buffer)

    try {
        await fileSystem.makeDirectoryAsync(directory, { intermediates: true })
        await fileSystem.writeAsStringAsync(uri, base64, {
            encoding: fileSystem.EncodingType.Base64,
        })
    } catch {
        try {
            await fileSystem.deleteAsync(uri, { idempotent: true })
        } catch {
            // Best-effort cleanup. The feature-scoped orphan cleanup retries later.
        }
        throw binaryError(
            'DOCUMENT_TEMPORARY_FILE_WRITE_FAILED',
            'Temporary document file could not be created.'
        )
    }

    return uri
}

export const removeDocumentTemporaryFile = async ({
    uri,
    fileSystem = FileSystem,
}) => {
    if (typeof uri !== 'string' || !uri.startsWith(
        getDocumentTemporaryDirectory(fileSystem)
    )) {
        return false
    }

    try {
        await fileSystem.deleteAsync(uri, { idempotent: true })
        return true
    } catch {
        return false
    }
}

export const cleanupDocumentTemporaryFiles = async ({
    fileSystem = FileSystem,
} = {}) => {
    let directory

    try {
        directory = getDocumentTemporaryDirectory(fileSystem)
        await fileSystem.deleteAsync(directory, { idempotent: true })
        return true
    } catch {
        return false
    }
}
