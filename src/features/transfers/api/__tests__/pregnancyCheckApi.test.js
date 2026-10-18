import targetApiClient from '../../../../api/target/client'
import {
    invalidatePregnancyCheck,
    recordPregnancyCheck,
} from '../transferApi'

jest.mock('../../../../api/target/client', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}))

afterEach(() => jest.clearAllMocks())

describe('M5C target API contracts', () => {
    test('records exactly the supplied one-item bulk with batch key', async () => {
        const intent = {
            idempotencyKey: 'batch-a',
            payload: {
                batchId: 'batch-a',
                items: [{
                    itemId: 'item-a',
                    id: 'check-a',
                    transferId: 'transfer-a',
                    checkedAt: '2026-11-10T12:00:00.000Z',
                    timezone: 'America/Sao_Paulo',
                    result: 'PREGNANT',
                    methodCode: 'ORG_METHOD',
                    observations: null,
                    professionalId: 'professional-a',
                    supersedesCheckId: null,
                    correctionReason: null,
                }],
            },
        }
        targetApiClient.post.mockResolvedValueOnce({
            data: {
                batchId: 'batch-a',
                items: [{
                    itemId: 'item-a', checkId: 'check-a',
                    transferId: 'transfer-a', status: 'APPLIED',
                }],
            },
        })

        await expect(recordPregnancyCheck(intent)).resolves.toEqual({
            batchId: 'batch-a',
            items: [{
                itemId: 'item-a', checkId: 'check-a',
                transferId: 'transfer-a', status: 'APPLIED',
            }],
        })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/pregnancy-checks:bulk',
            intent.payload,
            { targetContext: { idempotencyKey: 'batch-a' } }
        )
        expect(intent.payload).not.toHaveProperty('source')
    })

    test('invalidates by stable check ID with an independent key', async () => {
        const intent = {
            checkId: 'check/a',
            idempotencyKey: 'invalidation-key',
            payload: { reason: 'Evidence withdrawn' },
        }
        targetApiClient.post.mockResolvedValueOnce({
            data: {
                id: 'invalidation-a', checkId: 'check/a',
                transferId: 'transfer-a', reason: 'Evidence withdrawn',
                actorId: 'actor-a', recordedAt: '2026-11-11T12:00:00Z',
            },
        })

        await expect(invalidatePregnancyCheck(intent)).resolves.toMatchObject({
            id: 'invalidation-a', checkId: 'check/a',
        })
        expect(targetApiClient.post).toHaveBeenCalledWith(
            '/pregnancy-checks/check%2Fa:invalidate',
            { reason: 'Evidence withdrawn' },
            { targetContext: { idempotencyKey: 'invalidation-key' } }
        )
    })

    test('normalizes structured PregnancyCheck conflicts without parsing detail', async () => {
        targetApiClient.post.mockRejectedValueOnce({
            response: {
                status: 409,
                data: {
                    code: 'PREGNANCY_CHECK_ALREADY_INVALIDATED',
                    detail: 'arbitrary localized text',
                },
            },
        })

        await expect(invalidatePregnancyCheck({
            checkId: 'check-a', idempotencyKey: 'key-a', payload: { reason: 'x' },
        })).rejects.toMatchObject({
            kind: 'conflict', code: 'PREGNANCY_CHECK_ALREADY_INVALIDATED',
        })
    })
})
