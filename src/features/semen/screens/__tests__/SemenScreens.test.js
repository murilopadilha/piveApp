import { fireEvent, render } from '@testing-library/react-native'

import { useAnimalDetailQuery } from '../../../animals/hooks/useAnimalQueries'
import { useEffectiveContextQuery } from '../../../auth/hooks/useIdentityQueries'
import { useOrganization } from '../../../organizations/OrganizationContext'
import {
    useExternalEstablishmentDetailQuery,
    useSemenBatchDetailQuery,
    useSemenBatchesQuery,
} from '../../hooks/useSemenQueries'
import SemenBatchDetail from '../SemenBatchDetail'
import SemenBatchSearch from '../SemenBatchSearch'

jest.mock('../../../auth/hooks/useIdentityQueries', () => ({
    useEffectiveContextQuery: jest.fn(),
}))
jest.mock('../../../organizations/OrganizationContext', () => ({
    useOrganization: jest.fn(),
}))
jest.mock('../../../animals/hooks/useAnimalQueries', () => ({
    useAnimalDetailQuery: jest.fn(),
}))
jest.mock('../../hooks/useSemenQueries', () => ({
    useSemenBatchesQuery: jest.fn(),
    useSemenBatchDetailQuery: jest.fn(),
    useExternalEstablishmentDetailQuery: jest.fn(),
}))

const query = data => ({
    data,
    error: null,
    isPending: false,
    isSuccess: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
})

const batch = {
    id: 'batch-a', batchCode: 'LOTE-42', sireId: 'sire-a',
    producerEstablishmentId: 'producer-a', provenanceCode: 'CERTIFIED',
    verificationStatus: 'VERIFIED', semenType: 'CONVENTIONAL', ownerId: null,
    receivedAt: null, status: 'ACTIVE', version: 0,
    provenance: { originType: 'MANUAL', recordedAt: '2026-10-09T12:00:00Z' },
}

beforeEach(() => {
    useOrganization.mockReturnValue({ activeOrganizationId: 'organization-a' })
    useEffectiveContextQuery.mockReturnValue(query({
        permissions: ['semen:read', 'master-data:read'],
    }))
    useSemenBatchesQuery.mockReturnValue(query({
        pages: [{ items: [batch], page: 0, size: 20 }],
    }))
    useSemenBatchDetailQuery.mockReturnValue(query(batch))
    useExternalEstablishmentDetailQuery.mockReturnValue(query({
        id: 'producer-a', name: 'Central Genética',
        establishmentType: 'SEMEN_CENTER', country: 'BR', status: 'ACTIVE',
    }))
    useAnimalDetailQuery.mockReturnValue(query({
        id: 'sire-a', name: 'Reprodutor A', sex: 'MALE', status: 'ACTIVE',
    }))
})

describe('Semen batch screens', () => {
    test('searches server-side and navigates only with semenBatchId', () => {
        const navigation = { navigate: jest.fn() }
        const screen = render(<SemenBatchSearch navigation={navigation} />)

        fireEvent.press(screen.getByLabelText('Lote de sêmen LOTE-42'))

        expect(navigation.navigate).toHaveBeenCalledWith('SemenBatchDetail', {
            semenBatchId: 'batch-a',
        })
        expect(useSemenBatchesQuery).toHaveBeenCalledWith(expect.objectContaining({
            organizationId: 'organization-a',
        }))
    })

    test('derives sire from the batch and presents no inventory language', () => {
        const screen = render(
            <SemenBatchDetail route={{ params: { semenBatchId: 'batch-a' } }} />
        )

        expect(screen.getByText('Reprodutor A')).toBeTruthy()
        expect(screen.getByText('Central Genética')).toBeTruthy()
        expect(screen.queryByText(/saldo|palheta|estoque|consumo/i)).toBeNull()
        expect(useAnimalDetailQuery).toHaveBeenCalledWith(expect.objectContaining({
            animalId: 'sire-a',
        }))
    })
})
