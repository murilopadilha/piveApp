import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import {
    listDonors,
    listDonorsByHighestAverageEmbryoPercentage,
    listDonorsByHighestAverageOocytes,
    searchDonors,
} from '../../../api/donorService'
import { listDonorBullCombinations } from '../../../api/donorBullCombinationService'
import { normalizeApiError } from '../../../api/errors'

function getDonorsByFilter(currentFilterOption, options) {
    switch (currentFilterOption) {
        case 'highest-average-oocytes':
            return listDonorsByHighestAverageOocytes(options)
        case 'highest-average-embryo-percentage':
            return listDonorsByHighestAverageEmbryoPercentage(options)
        case 'all':
        default:
            return listDonors(options)
    }
}

export default function useDonorList() {
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

    const loadDonors = React.useCallback(async (
        currentFilterOption,
        currentRegistrationNumber
    ) => {
        if (!isScreenFocusedRef.current) return

        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true)
        let donors

        try {
            if (currentFilterOption === 'combination') {
                donors = await listDonorBullCombinations({ signal: abortController.signal })
            } else if (currentRegistrationNumber) {
                donors = await searchDonors(currentRegistrationNumber, {
                    signal: abortController.signal,
                })
            } else {
                donors = await getDonorsByFilter(currentFilterOption, {
                    signal: abortController.signal,
                })
            }

            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setData(donors)
            setLoadError(null)
            setHasLoaded(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as doadoras.')
            if (apiError.isCanceled) return
            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            console.error(apiError.message)
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
                loadDonors(filterOption, registrationNumber)
            }, 500)

            return () => {
                isScreenFocusedRef.current = false
                clearTimeout(debounceTimer)
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [filterOption, loadDonors, registrationNumber])
    )

    const reload = React.useCallback(() => (
        loadDonors(filterOptionRef.current, registrationNumberRef.current)
    ), [loadDonors])

    const filteredData = () => {
        if (filterOption === 'combination') {
            return data.filter(item => {
                if (!item?.donor) return false

                const donorName = String(item?.donor?.name ?? '')
                const donorRegistrationNumber = String(item?.donor?.registrationNumber ?? '')

                return (
                    donorName.toLowerCase().includes(registrationNumber.toLowerCase()) ||
                    donorRegistrationNumber.includes(registrationNumber)
                )
            })
        }
        return data
    }

    const visibleData = filteredData()

    return {
        visibleData,
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
