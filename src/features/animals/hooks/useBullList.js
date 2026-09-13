import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import {
    listBulls,
    listBullsByHighestAverageEmbryoPercentage,
    searchBulls,
} from '../../../api/bullService'
import { listDonorBullCombinations } from '../../../api/donorBullCombinationService'
import { normalizeApiError } from '../../../api/errors'

function getBullsByFilter(currentFilterOption, options) {
    switch (currentFilterOption) {
        case 'highest-average-embryo-percentage':
            return listBullsByHighestAverageEmbryoPercentage(options)
        case 'all':
        default:
            return listBulls(options)
    }
}

export default function useBullList() {
    const [data, setData] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [registrationNumber, setRegistrationNumber] = React.useState('')
    const [filterOption, setFilterOption] = React.useState('all')
    const [loadError, setLoadError] = React.useState(null)
    const [hasLoaded, setHasLoaded] = React.useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const registrationNumberRef = React.useRef(registrationNumber)
    const filterOptionRef = React.useRef(filterOption)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    registrationNumberRef.current = registrationNumber
    filterOptionRef.current = filterOption

    const loadBulls = React.useCallback(async (currentFilterOption, query = '') => {
        if (!isScreenFocusedRef.current) return

        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true)

        try {
            let bulls
            if (currentFilterOption === 'combination') {
                const combinations = await listDonorBullCombinations({
                    signal: abortController.signal,
                })

                if (query) {
                    bulls = combinations.filter(item => {
                        const donorName = String(item?.donor?.name ?? '')
                        const bullName = String(item?.bull?.name ?? '')
                        const donorRegistrationNumber = String(item?.donor?.registrationNumber ?? '')
                        const bullRegistrationNumber = String(item?.bull?.registrationNumber ?? '')

                        return donorName.includes(query) ||
                            bullName.includes(query) ||
                            donorRegistrationNumber.includes(query) ||
                            bullRegistrationNumber.includes(query)
                    });
                } else {
                    bulls = combinations
                }
            } else if (query) {
                bulls = await searchBulls(query, {
                    signal: abortController.signal,
                })
            } else {
                bulls = await getBullsByFilter(currentFilterOption, {
                    signal: abortController.signal,
                })
            }

            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setData(bulls)
            setLoadError(null)
            setHasLoaded(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar os touros.')
            if (apiError.isCanceled) return
            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            setLoadError(apiError.message)
            setHasLoaded(true)
        } finally {
            if (requestId === requestIdRef.current) {
                abortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setLoading(false)
                }
            }
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            const debounceTimer = setTimeout(() => {
                loadBulls(filterOption, registrationNumber)
            }, 500)

            return () => {
                isScreenFocusedRef.current = false
                clearTimeout(debounceTimer)
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [filterOption, loadBulls, registrationNumber])
    )

    const reload = React.useCallback(() => (
        loadBulls(filterOptionRef.current, registrationNumberRef.current)
    ), [loadBulls])

    return {
        data,
        loading,
        loadError,
        hasLoaded,
        registrationNumber,
        setRegistrationNumber,
        filterOption,
        setFilterOption,
        reload,
    }
}
