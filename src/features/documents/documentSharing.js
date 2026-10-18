import * as Sharing from 'expo-sharing'

import { getTargetRuntimeContext } from '../../api/target/requestContext'
import { getDocumentVersionContent } from './api/documentApi'
import {
    DocumentBinaryError,
    removeDocumentTemporaryFile,
    validateDocumentBinarySize,
    writeDocumentTemporaryFile,
} from './documentBinary'

const requireStableValue = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`${label} must be a non-empty string.`)
    }

    return value.trim()
}

const organizationChanged = () => new DocumentBinaryError(
    'DOCUMENT_ORGANIZATION_CHANGED',
    'Active Organization changed during document access.'
)

const assertOrganization = (expectedOrganizationId, getOrganizationId) => {
    if (getOrganizationId() !== expectedOrganizationId) {
        throw organizationChanged()
    }
}

const assertVersionMetadata = ({ documentId, version }) => {
    if (
        !version ||
        requireStableValue(version.id, 'versionId') !== version.id ||
        requireStableValue(version.documentId, 'version.documentId') !== documentId ||
        typeof version.originalFileName !== 'string' ||
        !version.originalFileName.trim() ||
        typeof version.mimeType !== 'string' ||
        !version.mimeType.trim()
    ) {
        throw new DocumentBinaryError(
            'INVALID_DOCUMENT_METADATA',
            'Document version metadata is invalid.'
        )
    }
}

export const shareKnownDocumentVersion = async ({
    organizationId,
    documentId,
    version,
    signal,
    getOrganizationId = () => getTargetRuntimeContext().organizationId,
    download = getDocumentVersionContent,
    isSharingAvailable = Sharing.isAvailableAsync,
    share = Sharing.shareAsync,
    writeTemporaryFile = writeDocumentTemporaryFile,
    removeTemporaryFile = removeDocumentTemporaryFile,
    onCleanupFailure = () => undefined,
}) => {
    const expectedOrganizationId = requireStableValue(
        organizationId,
        'organizationId'
    )
    const stableDocumentId = requireStableValue(documentId, 'documentId')
    assertVersionMetadata({ documentId: stableDocumentId, version })
    assertOrganization(expectedOrganizationId, getOrganizationId)

    if (!await isSharingAvailable()) {
        throw new DocumentBinaryError(
            'DOCUMENT_SHARING_UNAVAILABLE',
            'Native document sharing is unavailable.'
        )
    }
    assertOrganization(expectedOrganizationId, getOrganizationId)

    let temporaryUri = null

    try {
        const downloaded = await download({
            documentId: stableDocumentId,
            versionId: version.id,
            signal,
        })
        assertOrganization(expectedOrganizationId, getOrganizationId)
        const validated = validateDocumentBinarySize(
            downloaded,
            version.sizeBytes
        )

        temporaryUri = await writeTemporaryFile({
            buffer: validated,
            originalFileName: version.originalFileName,
        })
        assertOrganization(expectedOrganizationId, getOrganizationId)
        await share(temporaryUri, {
            mimeType: version.mimeType,
            dialogTitle: `Abrir ou compartilhar ${version.originalFileName}`,
        })
        return true
    } finally {
        if (temporaryUri) {
            const removed = await removeTemporaryFile({ uri: temporaryUri })
            if (!removed) {
                onCleanupFailure()
            }
        }
    }
}
