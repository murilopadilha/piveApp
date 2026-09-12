import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

import { listBulls } from '../../../api/bullService'
import { listDonors } from '../../../api/donorService'
import { normalizeApiError } from '../../../api/errors'
import {
    listFivs,
    listFivsByBull,
    listFivsByDonor,
} from '../../../api/fivService'
import { PIVE_FILTER_CATALOG_MODES } from '../filters'

export default function usePiveListData({
    activeFilter,
    secondaryCategory,
    selectedAnimalId,
    onLoadError,
}) {
    const [items, setItems] = React.useState([])
    const [animalFilteredItems, setAnimalFilteredItems] = React.useState([])
    const [secondaryOptions, setSecondaryOptions] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [loadError, setLoadError] = React.useState(null)
    const [hasLoaded, setHasLoaded] = React.useState(false)
    const [secondaryOptionsLoading, setSecondaryOptionsLoading] = React.useState(false)
    const [secondaryOptionsError, setSecondaryOptionsError] = React.useState(null)
    const [hasLoadedSecondaryOptions, setHasLoadedSecondaryOptions] = React.useState(false)
    const [filteredFivsLoading, setFilteredFivsLoading] = React.useState(false)
    const [filteredFivsError, setFilteredFivsError] = React.useState(null)
    const [hasLoadedFilteredFivs, setHasLoadedFilteredFivs] = React.useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const secondaryCategoryRef = React.useRef(secondaryCategory)
    const selectedAnimalIdRef = React.useRef(selectedAnimalId)
    const onLoadErrorRef = React.useRef(onLoadError)
    const itemsAbortControllerRef = React.useRef(null)
    const itemsRequestIdRef = React.useRef(0)
    const secondaryOptionsAbortControllerRef = React.useRef(null)
    const secondaryOptionsRequestIdRef = React.useRef(0)
    const filteredFivsAbortControllerRef = React.useRef(null)
    const filteredFivsRequestIdRef = React.useRef(0)

    secondaryCategoryRef.current = secondaryCategory
    selectedAnimalIdRef.current = selectedAnimalId
    onLoadErrorRef.current = onLoadError

    const fetchItems = React.useCallback(async () => {
        if (!isScreenFocusedRef.current) return

        itemsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        itemsAbortControllerRef.current = abortController
        const requestId = ++itemsRequestIdRef.current

        setLoading(true)

        try {
            const fivs = await listFivs({ signal: abortController.signal })

            if (
                requestId !== itemsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setItems(fivs)
            setLoadError(null)
            setHasLoaded(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as FIVs.')
            if (apiError.isCanceled) return
            if (
                requestId !== itemsRequestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            setLoadError(apiError.message)
            setHasLoaded(true)
            onLoadErrorRef.current?.(apiError.message)
        } finally {
            if (requestId === itemsRequestIdRef.current) {
                itemsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setLoading(false)
                }
            }
        }
    }, [])

    const fetchSecondaryOptions = React.useCallback(async (
        type,
        { clearExisting = true } = {}
    ) => {
        if (!isScreenFocusedRef.current) return

        secondaryOptionsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        secondaryOptionsAbortControllerRef.current = abortController
        const requestId = ++secondaryOptionsRequestIdRef.current

        if (clearExisting) {
            setSecondaryOptions([])
            setHasLoadedSecondaryOptions(false)
        }
        setSecondaryOptionsLoading(true)
        setSecondaryOptionsError(null)

        try {
            const data = type === 'donor'
                ? await listDonors({ signal: abortController.signal })
                : await listBulls({ signal: abortController.signal })
            const options = data.map(item => ({
                key: item.id.toString(),
                value: `${item.name} (${item.registrationNumber || item.breed || item.birth})`
            }))

            if (
                requestId !== secondaryOptionsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                secondaryCategoryRef.current !== type
            ) return

            setSecondaryOptions(options)
            setSecondaryOptionsError(null)
            setHasLoadedSecondaryOptions(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as opções do filtro.')
            if (apiError.isCanceled) return
            if (
                requestId !== secondaryOptionsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                secondaryCategoryRef.current !== type
            ) return
            setSecondaryOptionsError(apiError.message)
            setHasLoadedSecondaryOptions(true)
            onLoadErrorRef.current?.(apiError.message)
        } finally {
            if (requestId === secondaryOptionsRequestIdRef.current) {
                secondaryOptionsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setSecondaryOptionsLoading(false)
                }
            }
        }
    }, [])

    const fetchFilteredFivs = React.useCallback(async (
        id,
        type,
        { clearExisting = true } = {}
    ) => {
        if (!isScreenFocusedRef.current) return

        filteredFivsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        filteredFivsAbortControllerRef.current = abortController
        const requestId = ++filteredFivsRequestIdRef.current

        if (clearExisting) {
            setAnimalFilteredItems([])
            setHasLoadedFilteredFivs(false)
        }
        setFilteredFivsLoading(true)
        setFilteredFivsError(null)

        try {
            const fivs = type === 'donor'
                ? await listFivsByDonor(id, { signal: abortController.signal })
                : await listFivsByBull(id, { signal: abortController.signal })

            if (
                requestId !== filteredFivsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                secondaryCategoryRef.current !== type ||
                selectedAnimalIdRef.current !== id
            ) return

            setAnimalFilteredItems(fivs)
            setFilteredFivsError(null)
            setHasLoadedFilteredFivs(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível filtrar as FIVs.')
            if (apiError.isCanceled) return
            if (
                requestId !== filteredFivsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                secondaryCategoryRef.current !== type ||
                selectedAnimalIdRef.current !== id
            ) return
            setFilteredFivsError(apiError.message)
            setHasLoadedFilteredFivs(true)
            onLoadErrorRef.current?.(apiError.message)
        } finally {
            if (requestId === filteredFivsRequestIdRef.current) {
                filteredFivsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setFilteredFivsLoading(false)
                }
            }
        }
    }, [])

    const invalidateSecondaryOptionsRequest = React.useCallback(() => {
        secondaryOptionsRequestIdRef.current += 1
        secondaryOptionsAbortControllerRef.current?.abort()
        secondaryOptionsAbortControllerRef.current = null
    }, [])

    const invalidateFilteredFivsRequest = React.useCallback(() => {
        filteredFivsRequestIdRef.current += 1
        filteredFivsAbortControllerRef.current?.abort()
        filteredFivsAbortControllerRef.current = null
    }, [])

    const clearSecondaryOptionsState = React.useCallback(({ clearOptions = true } = {}) => {
        setSecondaryOptionsLoading(false)
        setSecondaryOptionsError(null)
        setHasLoadedSecondaryOptions(false)
        if (clearOptions) {
            setSecondaryOptions([])
        }
    }, [])

    const clearFilteredFivsState = React.useCallback(() => {
        setFilteredFivsLoading(false)
        setFilteredFivsError(null)
        setHasLoadedFilteredFivs(false)
        setAnimalFilteredItems([])
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            fetchItems()

            const currentSecondaryCategory = secondaryCategoryRef.current
            const currentSelectedAnimalId = selectedAnimalIdRef.current

            if (currentSecondaryCategory) {
                fetchSecondaryOptions(currentSecondaryCategory, { clearExisting: false })

                if (currentSelectedAnimalId) {
                    fetchFilteredFivs(
                        currentSelectedAnimalId,
                        currentSecondaryCategory,
                        { clearExisting: false }
                    )
                }
            }

            return () => {
                isScreenFocusedRef.current = false

                itemsRequestIdRef.current += 1
                itemsAbortControllerRef.current?.abort()
                itemsAbortControllerRef.current = null

                secondaryOptionsRequestIdRef.current += 1
                secondaryOptionsAbortControllerRef.current?.abort()
                secondaryOptionsAbortControllerRef.current = null

                filteredFivsRequestIdRef.current += 1
                filteredFivsAbortControllerRef.current?.abort()
                filteredFivsAbortControllerRef.current = null
            }
        }, [fetchFilteredFivs, fetchItems, fetchSecondaryOptions])
    )

    const onPrimaryFilterChange = React.useCallback((selectedKey) => {
        selectedAnimalIdRef.current = null

        if (selectedKey === 'donor' || selectedKey === 'bull') {
            invalidateFilteredFivsRequest()
            clearFilteredFivsState()
            secondaryCategoryRef.current = selectedKey
            fetchSecondaryOptions(selectedKey)
            return
        }

        invalidateSecondaryOptionsRequest()
        invalidateFilteredFivsRequest()
        clearSecondaryOptionsState()
        clearFilteredFivsState()
        secondaryCategoryRef.current = null
    }, [
        clearFilteredFivsState,
        clearSecondaryOptionsState,
        fetchSecondaryOptions,
        invalidateFilteredFivsRequest,
        invalidateSecondaryOptionsRequest,
    ])

    const onSelectedAnimalChange = React.useCallback((selectedKey) => {
        selectedAnimalIdRef.current = selectedKey
        fetchFilteredFivs(selectedKey, secondaryCategoryRef.current)
    }, [fetchFilteredFivs])

    const onFilterCatalogModeChange = React.useCallback((nextFilterCatalogMode) => {
        invalidateSecondaryOptionsRequest()
        invalidateFilteredFivsRequest()
        clearSecondaryOptionsState({
            clearOptions: nextFilterCatalogMode === PIVE_FILTER_CATALOG_MODES.STATUS,
        })
        clearFilteredFivsState()
        selectedAnimalIdRef.current = null

        if (nextFilterCatalogMode === PIVE_FILTER_CATALOG_MODES.STATUS) {
            secondaryCategoryRef.current = null
        }
    }, [
        clearFilteredFivsState,
        clearSecondaryOptionsState,
        invalidateFilteredFivsRequest,
        invalidateSecondaryOptionsRequest,
    ])

    let visibleItems
    if (secondaryCategory) {
        visibleItems = selectedAnimalId ? animalFilteredItems : []
    } else if (activeFilter === 'ALL') {
        visibleItems = items
    } else {
        visibleItems = items.filter(item => item.status === activeFilter)
    }

    return {
        visibleItems,
        secondaryOptions,
        loading,
        loadError,
        hasLoaded,
        secondaryOptionsLoading,
        secondaryOptionsError,
        hasLoadedSecondaryOptions,
        filteredFivsLoading,
        filteredFivsError,
        hasLoadedFilteredFivs,
        onPrimaryFilterChange,
        onSelectedAnimalChange,
        onFilterCatalogModeChange,
    }
}
