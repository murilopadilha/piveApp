import { render, waitFor } from '@testing-library/react-native'

import { useSession } from '../../../auth/SessionContext'
import { useOrganization } from '../../../organizations/OrganizationContext'
import { cleanupDocumentTemporaryFiles } from '../../documentBinary'
import DocumentTemporaryFilesLifecycle from '../DocumentTemporaryFilesLifecycle'

jest.mock('../../../auth/SessionContext', () => ({ useSession: jest.fn() }))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../documentBinary', () => ({
    cleanupDocumentTemporaryFiles: jest.fn(() => Promise.resolve(true)),
}))

let accessToken
let organizationId

beforeEach(() => {
    accessToken = 'token-a'
    organizationId = 'organization-a'
    useSession.mockImplementation(() => ({ accessToken }))
    useOrganization.mockImplementation(() => ({
        activeOrganizationId: organizationId,
    }))
})

afterEach(() => jest.clearAllMocks())

describe('M7B2A orphan cleanup lifecycle', () => {
    test('cleans feature-owned files on startup, Organization switch and logout', async () => {
        const screen = render(<DocumentTemporaryFilesLifecycle />)
        await waitFor(() => expect(cleanupDocumentTemporaryFiles).toHaveBeenCalledTimes(1))

        organizationId = 'organization-b'
        screen.rerender(<DocumentTemporaryFilesLifecycle />)
        await waitFor(() => expect(cleanupDocumentTemporaryFiles).toHaveBeenCalledTimes(2))

        accessToken = null
        screen.rerender(<DocumentTemporaryFilesLifecycle />)
        await waitFor(() => expect(cleanupDocumentTemporaryFiles).toHaveBeenCalledTimes(3))
    })
})
