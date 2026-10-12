import { createUuidV7 } from '../../utils/uuid'

export const PREGNANCY_CHECK_RESULTS = Object.freeze([
    'PREGNANT',
    'NOT_PREGNANT',
    'INCONCLUSIVE',
    'PREGNANCY_LOSS',
])

const METHOD_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,47}$/

const normalizedRequiredText = (value, label, maxLength) => {
    const normalized = typeof value === 'string' ? value.trim() : ''

    if (!normalized || normalized.length > maxLength) {
        throw new TypeError(`${label} is required and must not exceed ${maxLength} characters.`)
    }

    return normalized
}

const normalizedOptionalText = (value, label, maxLength) => {
    const normalized = typeof value === 'string' ? value.trim() : ''

    if (!normalized) {
        return null
    }
    if (normalized.length > maxLength) {
        throw new TypeError(`${label} must not exceed ${maxLength} characters.`)
    }

    return normalized
}

const normalizedStableId = (value, label) => {
    const normalized = typeof value === 'string' ? value.trim() : ''

    if (!normalized) {
        throw new TypeError(`${label} is required.`)
    }

    return normalized
}

export const getDeviceIanaTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    } catch {
        return ''
    }
}

export const isValidIanaTimezone = (value) => {
    const timezone = typeof value === 'string' ? value.trim() : ''

    if (!timezone || timezone.length > 64) {
        return false
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
        return true
    } catch {
        return false
    }
}

export const createPregnancyCheckIntent = ({
    transferId,
    transferPerformedAt,
    checkedAt,
    timezone,
    result,
    methodCode,
    observations = null,
    professionalId,
    supersedesCheckId = null,
    correctionReason = null,
}) => {
    const checkedTime = new Date(checkedAt).getTime()
    const transferTime = new Date(transferPerformedAt).getTime()
    const normalizedTimezone = typeof timezone === 'string'
        ? timezone.trim()
        : ''
    const normalizedMethod = typeof methodCode === 'string'
        ? methodCode.trim().toUpperCase()
        : ''
    const normalizedCorrectionReason = normalizedOptionalText(
        correctionReason,
        'correctionReason',
        500
    )
    const normalizedSupersedes = supersedesCheckId || null

    if (!transferId || !professionalId) {
        throw new TypeError('transferId and professionalId are required.')
    }
    if (
        !Number.isFinite(checkedTime) ||
        !Number.isFinite(transferTime) ||
        checkedTime < transferTime
    ) {
        throw new TypeError('checkedAt cannot precede the performed Transfer.')
    }
    if (!isValidIanaTimezone(normalizedTimezone)) {
        throw new TypeError('timezone must be a valid IANA timezone.')
    }
    if (!PREGNANCY_CHECK_RESULTS.includes(result)) {
        throw new TypeError('result is not a supported PregnancyCheck result.')
    }
    if (!METHOD_CODE_PATTERN.test(normalizedMethod)) {
        throw new TypeError('methodCode must match the backend operational-code contract.')
    }
    if (Boolean(normalizedSupersedes) !== Boolean(normalizedCorrectionReason)) {
        throw new TypeError('Correction requires supersedesCheckId and correctionReason together.')
    }

    const batchId = createUuidV7()

    return {
        idempotencyKey: batchId,
        sent: false,
        payload: {
            batchId,
            items: [{
                itemId: createUuidV7(),
                id: createUuidV7(),
                transferId,
                checkedAt: new Date(checkedTime).toISOString(),
                timezone: normalizedTimezone,
                result,
                methodCode: normalizedMethod,
                observations: normalizedOptionalText(
                    observations,
                    'observations',
                    2000
                ),
                professionalId,
                supersedesCheckId: normalizedSupersedes,
                correctionReason: normalizedCorrectionReason,
            }],
        },
    }
}

export const markPregnancyCheckIntentSent = intent => ({
    ...intent,
    sent: true,
})

export const createPregnancyCheckInvalidationIntent = ({ checkId, reason }) => ({
    checkId: normalizedStableId(checkId, 'checkId'),
    idempotencyKey: createUuidV7(),
    sent: false,
    payload: {
        reason: normalizedRequiredText(reason, 'reason', 500),
    },
})

export const markPregnancyCheckInvalidationIntentSent = intent => ({
    ...intent,
    sent: true,
})
