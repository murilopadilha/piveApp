import { fireEvent, render } from '@testing-library/react-native'

import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useDocumentDetailQuery,
    useDocumentsQuery,
    useDocumentVersionsQuery,
} from '../../hooks/useDocumentQueries'
import DocumentDetail from '../DocumentDetail'
import DocumentList from '../DocumentList'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../hooks/useDocumentQueries', () => ({
    useDocumentDetailQuery: jest.fn(),
    useDocumentsQuery: jest.fn(),
    useDocumentVersionsQuery: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(() => Promise.resolve({ data })),
})

const document = {
    id: 'document-a',
    typeCode: 'SOURCE_EVIDENCE',
    status: 'ACTIVE',
    currentVersionId: 'version-a',
    version: 2,
    createdAt: '2026-10-14T10:00:00Z',
}

const versions = [{
    id: 'version-b',
    documentId: 'document-a',
    versionNumber: 2,
    originalFileName: 'new.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4096,
    checksum: 'b'.repeat(64),
    uploadedAt: '2026-10-14T12:00:00Z',
}, {
    id: 'version-a',
    documentId: 'document-a',
    versionNumber: 1,
    originalFileName: 'original.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    checksum: 'a'.repeat(64),
    uploadedAt: '2026-10-14T11:00:00Z',
}]

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['documents:read'],
    }))
    useDocumentsQuery.mockReturnValue(query({
        pages: [{ items: [document], page: 0, size: 20 }],
    }))
    useDocumentDetailQuery.mockReturnValue(query(document))
    useDocumentVersionsQuery.mockReturnValue(query({
        pages: [{ items: versions, page: 0, size: 20 }],
    }))
})

afterEach(() => jest.clearAllMocks())

describe('M7B1 Document screens', () => {
    test('lists Documents in backend order and navigates with documentId only', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<DocumentList navigation={navigation} />)

        expect(screen.getByText('SOURCE_EVIDENCE')).toBeTruthy()
        fireEvent.press(screen.getByLabelText(
            'Documento SOURCE_EVIDENCE, status ACTIVE'
        ))
        expect(navigation.navigate).toHaveBeenCalledWith(
            'DocumentDetail',
            { documentId: 'document-a' }
        )
        expect(useDocumentsQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a',
            enabled: true,
        })
    })

    test('keeps read access without write, compliance or master-data permissions', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['documents:read'],
        }))
        const screen = render(<DocumentList navigation={{ navigate: jest.fn() }} />)

        expect(screen.getByText('SOURCE_EVIDENCE')).toBeTruthy()
        expect(screen.queryByText(/enviar/i)).toBeNull()
        expect(screen.queryByText(/compliance/i)).toBeNull()
    })

    test('does not call Document endpoints without documents:read', () => {
        useEffectiveContextQuery.mockReturnValue(query({
            permissions: ['documents:write', 'compliance:read'],
        }))
        render(<DocumentList navigation={{ navigate: jest.fn() }} />)

        expect(useDocumentsQuery).toHaveBeenCalledWith({
            organizationId: 'organization-a',
            enabled: false,
        })
    })

    test('retries identity instead of a disabled Document query', () => {
        const contextRefetch = jest.fn()
        const documentsRefetch = jest.fn()
        useEffectiveContextQuery.mockReturnValue({
            ...query(undefined),
            error: { kind: 'network' },
            isSuccess: false,
            refetch: contextRefetch,
        })
        useDocumentsQuery.mockReturnValue({
            ...query(undefined),
            refetch: documentsRefetch,
        })
        const screen = render(
            <DocumentList navigation={{ navigate: jest.fn() }} />
        )

        fireEvent.press(screen.getByLabelText('Tentar novamente'))
        expect(contextRefetch).toHaveBeenCalledTimes(1)
        expect(documentsRefetch).not.toHaveBeenCalled()
    })

    test('uses currentVersionId rather than the highest versionNumber', () => {
        const screen = render(
            <DocumentDetail route={{ params: { documentId: 'document-a' } }} />
        )

        expect(screen.getByLabelText('Versão 1, versão atual')).toBeTruthy()
        expect(screen.getByLabelText('Versão 2')).toBeTruthy()
        expect(screen.getAllByText('application/pdf')).toHaveLength(2)
        expect(screen.getByText('4.0 KiB (4096 bytes)')).toBeTruthy()
        expect(screen.getByText('b'.repeat(64))).toBeTruthy()
    })

    test('preserves backend version ordering and exposes accessible pagination', () => {
        const fetchNextPage = jest.fn()
        useDocumentVersionsQuery.mockReturnValue({
            ...query({ pages: [{ items: versions, page: 0, size: 2 }] }),
            hasNextPage: true,
            fetchNextPage,
        })
        const screen = render(
            <DocumentDetail route={{ params: { documentId: 'document-a' } }} />
        )
        const versionTwo = screen.getByText('Versão 2')
        const versionOne = screen.getByText('Versão 1')

        expect(versionTwo.parent.parent.props.children[0]).toBeTruthy()
        expect(versionOne).toBeTruthy()
        fireEvent.press(screen.getByLabelText('Carregar mais versões'))
        expect(fetchNextPage).toHaveBeenCalledTimes(1)
    })

    test('presents structured wrong-tenant not found error', () => {
        useDocumentDetailQuery.mockReturnValue({
            ...query(undefined),
            error: { kind: 'not_found', code: 'DOCUMENT_NOT_FOUND' },
            isSuccess: false,
        })
        const screen = render(
            <DocumentDetail route={{ params: { documentId: 'document-a' } }} />
        )

        expect(screen.getByText('Documento não encontrado nesta organização.'))
            .toBeTruthy()
        expect(screen.getByLabelText('Tentar novamente')).toBeTruthy()
    })
})
