import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { TARGET_ERROR_KINDS } from '../../../api/target/problemDetails'
import {
    targetOrganizationQueryKey,
    targetOrganizationScopeQueryKey,
} from '../../../serverState/targetQueryKeys'
import { useSession } from '../../auth/SessionContext'
import {
    DEFAULT_DOCUMENT_PAGE_SIZE,
    getDocumentById,
    getDocuments,
    getDocumentVersions,
} from '../api/documentApi'

const fallbackKey = targetOrganizationScopeQueryKey()

export const documentsQueryKey = ({ organizationId, size }) => (
    targetOrganizationQueryKey(
        organizationId,
        'documents',
        'list',
        { size }
    )
)

export const documentDetailQueryKey = ({ organizationId, documentId }) => (
    targetOrganizationQueryKey(
        organizationId,
        'documents',
        'detail',
        documentId
    )
)

export const documentVersionsQueryKey = ({
    organizationId,
    documentId,
    size,
}) => targetOrganizationQueryKey(
    organizationId,
    'documents',
    documentId,
    'versions',
    { size }
)

export const getNextDocumentPageParam = lastPage => (
    lastPage.items.length < lastPage.size
        ? undefined
        : lastPage.page + 1
)

const useExpireSessionOnUnauthorized = (errors) => {
    const { expireSession } = useSession()
    const unauthorized = errors.some(
        error => error?.kind === TARGET_ERROR_KINDS.UNAUTHORIZED
    )

    React.useEffect(() => {
        if (unauthorized) {
            expireSession()
        }
    }, [expireSession, unauthorized])
}

export const useDocumentsQuery = ({
    organizationId,
    size = DEFAULT_DOCUMENT_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId
            ? documentsQueryKey({ organizationId, size })
            : fallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getDocuments({
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextDocumentPageParam,
        enabled: enabled && Boolean(organizationId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useDocumentDetailQuery = ({
    organizationId,
    documentId,
    enabled = true,
}) => {
    const result = useQuery({
        queryKey: organizationId && documentId
            ? documentDetailQueryKey({ organizationId, documentId })
            : fallbackKey,
        queryFn: ({ signal }) => getDocumentById({ documentId, signal }),
        enabled: enabled && Boolean(organizationId) && Boolean(documentId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}

export const useDocumentVersionsQuery = ({
    organizationId,
    documentId,
    size = DEFAULT_DOCUMENT_PAGE_SIZE,
    enabled = true,
}) => {
    const result = useInfiniteQuery({
        queryKey: organizationId && documentId
            ? documentVersionsQueryKey({
                organizationId,
                documentId,
                size,
            })
            : fallbackKey,
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => getDocumentVersions({
            documentId,
            page: pageParam,
            size,
            signal,
        }),
        getNextPageParam: getNextDocumentPageParam,
        enabled: enabled && Boolean(organizationId) && Boolean(documentId),
    })

    useExpireSessionOnUnauthorized([result.error])
    return result
}
