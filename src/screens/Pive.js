import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectList } from 'react-native-dropdown-select-list';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import style from '../components/style';
import stylesEmbryos from '../components/stylesEmbryos';
import { useFocusEffect } from '@react-navigation/native';
import { listDonors } from '../api/donorService';
import { listBulls } from '../api/bullService';
import {
    createFiv,
    listFivs,
    listFivsByBull,
    listFivsByDonor,
} from '../api/fivService';
import { normalizeApiError } from '../api/errors';
import {
    PIVE_FILTER_CATALOG_MODES,
    getPiveFilterToggleIcon,
    getPivePrimaryFilterOptions,
    getPiveSecondaryCategory,
    getPiveSecondaryPlaceholder,
} from '../features/pive/filters';

export default ({ navigation }) => {
    const [filterCatalogMode, setFilterCatalogMode] = useState(PIVE_FILTER_CATALOG_MODES.STATUS)
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [items, setItems] = useState([])
    const [filteredItems, setFilteredItems] = useState([])
    const [secondaryOptions, setSecondaryOptions] = useState([])
    const [selectedAnimalId, setSelectedAnimalId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [secondaryOptionsLoading, setSecondaryOptionsLoading] = useState(false)
    const [secondaryOptionsError, setSecondaryOptionsError] = useState(null)
    const [hasLoadedSecondaryOptions, setHasLoadedSecondaryOptions] = useState(false)
    const [filteredFivsLoading, setFilteredFivsLoading] = useState(false)
    const [filteredFivsError, setFilteredFivsError] = useState(null)
    const [hasLoadedFilteredFivs, setHasLoadedFilteredFivs] = useState(false)
    const primaryFilterOptions = getPivePrimaryFilterOptions(filterCatalogMode)
    const icon = getPiveFilterToggleIcon(filterCatalogMode)
    const secondaryCategory = getPiveSecondaryCategory(activeFilter)
    const secondaryPlaceholder = getPiveSecondaryPlaceholder(secondaryCategory)
    const isScreenFocusedRef = React.useRef(false)
    const secondaryCategoryRef = React.useRef(secondaryCategory)
    const selectedAnimalIdRef = React.useRef(selectedAnimalId)
    const itemsAbortControllerRef = React.useRef(null)
    const itemsRequestIdRef = React.useRef(0)
    const secondaryOptionsAbortControllerRef = React.useRef(null)
    const secondaryOptionsRequestIdRef = React.useRef(0)
    const filteredFivsAbortControllerRef = React.useRef(null)
    const filteredFivsRequestIdRef = React.useRef(0)

    secondaryCategoryRef.current = secondaryCategory
    selectedAnimalIdRef.current = selectedAnimalId

    const categoryData = primaryFilterOptions.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const fetchItems = async () => {
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
            Alert.alert('Erro', apiError.message)
        } finally {
            if (requestId === itemsRequestIdRef.current) {
                itemsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setLoading(false)
                }
            }
        }
    }

    const fetchSecondaryOptions = async (type, { clearExisting = true } = {}) => {
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
            }));

            if (
                requestId !== secondaryOptionsRequestIdRef.current ||
                !isScreenFocusedRef.current ||
                secondaryCategoryRef.current !== type
            ) return

            setSecondaryOptions(options);
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
            Alert.alert('Erro', apiError.message)
        } finally {
            if (requestId === secondaryOptionsRequestIdRef.current) {
                secondaryOptionsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setSecondaryOptionsLoading(false)
                }
            }
        }
    }

    const fetchFilteredFIVs = async (id, type, { clearExisting = true } = {}) => {
        if (!isScreenFocusedRef.current) return

        filteredFivsAbortControllerRef.current?.abort()
        const abortController = new AbortController()
        filteredFivsAbortControllerRef.current = abortController
        const requestId = ++filteredFivsRequestIdRef.current

        if (clearExisting) {
            setFilteredItems([])
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

            setFilteredItems(fivs)
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
            Alert.alert('Erro', apiError.message)
        } finally {
            if (requestId === filteredFivsRequestIdRef.current) {
                filteredFivsAbortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setFilteredFivsLoading(false)
                }
            }
        }
    }

    const invalidateSecondaryOptionsRequest = () => {
        secondaryOptionsRequestIdRef.current += 1
        secondaryOptionsAbortControllerRef.current?.abort()
        secondaryOptionsAbortControllerRef.current = null
    }

    const invalidateFilteredFivsRequest = () => {
        filteredFivsRequestIdRef.current += 1
        filteredFivsAbortControllerRef.current?.abort()
        filteredFivsAbortControllerRef.current = null
    }

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            fetchItems()

            const currentSecondaryCategory = secondaryCategoryRef.current
            const currentSelectedAnimalId = selectedAnimalIdRef.current

            if (currentSecondaryCategory) {
                fetchSecondaryOptions(currentSecondaryCategory, { clearExisting: false })

                if (currentSelectedAnimalId) {
                    fetchFilteredFIVs(
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
        }, [])
    )

    useEffect(() => {
        if (activeFilter === 'ALL') {
            setFilteredItems(items)
        } else if (activeFilter !== 'donor' && activeFilter !== 'bull') {
            setFilteredItems(items.filter(item => item.status === activeFilter))
        }
    }, [activeFilter, items])

    const handleSelect = async (selectedKey) => {
        const selectedCategory = primaryFilterOptions.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setActiveFilter(selectedCategory.key)
            if (selectedKey === 'donor') {
                invalidateFilteredFivsRequest()
                setFilteredFivsLoading(false)
                setFilteredFivsError(null)
                setHasLoadedFilteredFivs(false)
                setFilteredItems([])
                setSelectedAnimalId(null)
                selectedAnimalIdRef.current = null
                secondaryCategoryRef.current = 'donor'
                fetchSecondaryOptions('donor')
            } else if (selectedKey === 'bull') {
                invalidateFilteredFivsRequest()
                setFilteredFivsLoading(false)
                setFilteredFivsError(null)
                setHasLoadedFilteredFivs(false)
                setFilteredItems([])
                setSelectedAnimalId(null)
                selectedAnimalIdRef.current = null
                secondaryCategoryRef.current = 'bull'
                fetchSecondaryOptions('bull')
            } else {
                invalidateSecondaryOptionsRequest()
                invalidateFilteredFivsRequest()
                setSecondaryOptionsLoading(false)
                setSecondaryOptionsError(null)
                setHasLoadedSecondaryOptions(false)
                setFilteredFivsLoading(false)
                setFilteredFivsError(null)
                setHasLoadedFilteredFivs(false)
                secondaryCategoryRef.current = null
                setSelectedAnimalId(null)
                selectedAnimalIdRef.current = null
                setSecondaryOptions([])
                setFilteredItems(items.filter(item => item.status === selectedKey))
            }
        }
    }

    const handleSecondarySelect = (selectedKey) => {
        const selected = secondaryOptions.find(option => option.key === selectedKey)
        if (selected) {
            setSelectedAnimalId(selectedKey)
            selectedAnimalIdRef.current = selectedKey
            fetchFilteredFIVs(selectedKey, secondaryCategory)
        }
    }

    const handleNewFIV = async () => {
        try {
            await createFiv();
            Alert.alert("Sucesso", "FIV criada com sucesso!", [{ text: "OK" }])
        } catch (error) {
            const apiError = normalizeApiError(error, 'Ocorreu um erro ao processar sua requisição.')
            if (apiError.isCanceled) return
            console.error(apiError.message)
            Alert.alert('Erro', 'Ocorreu um erro ao processar sua requisição.')
        }
    }

    const toggleCategory = () => {
        invalidateSecondaryOptionsRequest()
        invalidateFilteredFivsRequest()
        setSecondaryOptionsLoading(false)
        setSecondaryOptionsError(null)
        setHasLoadedSecondaryOptions(false)
        setFilteredFivsLoading(false)
        setFilteredFivsError(null)
        setHasLoadedFilteredFivs(false)
        setSelectedAnimalId(null)
        selectedAnimalIdRef.current = null

        if (filterCatalogMode === PIVE_FILTER_CATALOG_MODES.STATUS) {
            setFilterCatalogMode(PIVE_FILTER_CATALOG_MODES.ANIMAL)
        } else {
            setFilterCatalogMode(PIVE_FILTER_CATALOG_MODES.STATUS)
            secondaryCategoryRef.current = null
            setSecondaryOptions([])

            setActiveFilter('ALL')
            setFilteredItems(items)
        }
    }

    return (
        <SafeAreaView style={{width: '100%', height: '100%'}}>
            <View style={[style.divTitleMain]}>
                <Image source={require('../images/menu/logo.png')} style={{width: 40, height: 40, marginRight: '2%'}}/>
                <Text style={style.titleTextMain}>BovInA</Text>
            </View>
            <View style={style.searchPive}>
                <SelectList
                    setSelected={handleSelect}
                    data={categoryData}
                    placeholder={"Selecione a opção para filtrar"}
                    searchPlaceholder={"Filtros"}
                    boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={style.selectListDropdownPive}
                />
                <TouchableOpacity style={stylesEmbryos.buttonSearchFiv} onPress={toggleCategory}>
                    <MaterialCommunityIcons name={icon} size={30} color="#092955" />
                </TouchableOpacity>
            </View>
            {secondaryCategory && (
                <View style={{ marginTop: 1, marginLeft: 20 }}>
                    <SelectList
                        setSelected={handleSecondarySelect}
                        data={secondaryOptions}
                        placeholder={secondaryPlaceholder}
                        searchPlaceholder={"Filtros"}
                        boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={style.selectListDropdownPive}
                    />
                    {secondaryOptionsLoading && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                    {secondaryOptionsError && (
                        <Text style={{ color: '#B00020', marginTop: 5 }}>
                            {secondaryOptionsError}
                        </Text>
                    )}
                    {!secondaryOptionsLoading &&
                        hasLoadedSecondaryOptions &&
                        !secondaryOptionsError &&
                        secondaryOptions.length === 0 && (
                            <Text style={{ textAlign: 'center', marginTop: 10 }}>
                                Nenhuma opção encontrada.
                            </Text>
                        )}
                </View>
            )}
            <ScrollView style={style.listPive} showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}>
                {activeFilter !== 'donor' && activeFilter !== 'bull' && loadError && (
                    <Text style={{ color: '#B00020', marginHorizontal: 20, marginTop: 5 }}>
                        {loadError}
                    </Text>
                )}
                {(activeFilter === 'donor' || activeFilter === 'bull') && filteredFivsError && (
                    <Text style={{ color: '#B00020', marginHorizontal: 20, marginTop: 5 }}>
                        {filteredFivsError}
                    </Text>
                )}
                {activeFilter !== 'donor' &&
                    activeFilter !== 'bull' &&
                    (!hasLoaded || loading) &&
                    filteredItems.length === 0 && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                {(activeFilter === 'donor' || activeFilter === 'bull') &&
                    selectedAnimalId &&
                    filteredFivsLoading &&
                    filteredItems.length === 0 && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                {filteredItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[style.listItemPive, { 
                            shadowColor: '#000', 
                            shadowOffset: { width: 0, height: 3 }, 
                            shadowOpacity: 0.3, 
                            shadowRadius: 4, 
                            elevation: 5,
                        }]}
                        onPress={() => navigation.navigate('FivInfo', { fiv: item })}
                    >
                        <View style={{ display: 'flex', flexDirection: 'column', width: 320 }}>
                            <View style={{ display: 'flex', flexDirection: 'row', marginBottom: '1%' }}>
                                <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, marginTop: '0.5%'}}>FIV ID: </Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10, marginTop: '0.5%'}}>{item.id}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: '2%' }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Coleta dos Oócitos: </Text>
                                    {item.status === 'OOCYTE_COLLECTION_COMPLETED' || item.status === 'COMPLETED' ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: '0%' }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Embriões: </Text>
                                    {item.status === 'COMPLETED'  ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                            </View>
                            <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 5}}>
                                <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Data Asp: </Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10,}}>{item.date ? item.date : '-'}</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'row'}}>
                                <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Cliente/Fazenda: </Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10}}>{item.client ? item.client : '-'}</Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10}}>/</Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10,}}>{item.farm ? item.farm : '-'}</Text>
                            </View>   
                        </View>
                    </TouchableOpacity>
                ))}
                {activeFilter !== 'donor' &&
                    activeFilter !== 'bull' &&
                    !loading &&
                    hasLoaded &&
                    !loadError &&
                    filteredItems.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma FIV encontrada.
                        </Text>
                    )}
                {(activeFilter === 'donor' || activeFilter === 'bull') &&
                    selectedAnimalId &&
                    !filteredFivsLoading &&
                    hasLoadedFilteredFivs &&
                    !filteredFivsError &&
                    filteredItems.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma FIV encontrada.
                        </Text>
                    )}
                {((activeFilter !== 'donor' && activeFilter !== 'bull' && loading) ||
                    ((activeFilter === 'donor' || activeFilter === 'bull') && filteredFivsLoading)) &&
                    filteredItems.length > 0 && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
            </ScrollView>
            <TouchableOpacity
                style={[style.listButtonSearch, { paddingTop: '2%',marginTop: '175%', width: '20%', height: '5%', marginLeft: '70%', position: 'absolute', zIndex: 5 }]}
                onPress={() => navigation.navigate('Cabecalho')}
            >
                <Text style={{ fontSize: Platform.OS === 'ios' ? 13 : 10, color: '#FFFFFF', textAlign: 'center', paddingTop: 3 }}>Nova FIV</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}
