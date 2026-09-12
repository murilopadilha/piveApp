import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectList } from 'react-native-dropdown-select-list';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import style from '../components/style';
import stylesEmbryos from '../components/stylesEmbryos';
import { createFiv } from '../api/fivService';
import { normalizeApiError } from '../api/errors';
import {
    PIVE_FILTER_CATALOG_MODES,
    getPiveFilterToggleIcon,
    getPivePrimaryFilterOptions,
    getPiveSecondaryCategory,
    getPiveSecondaryPlaceholder,
} from '../features/pive/filters';
import usePiveListData from '../features/pive/hooks/usePiveListData';

export default ({ navigation }) => {
    const [filterCatalogMode, setFilterCatalogMode] = useState(PIVE_FILTER_CATALOG_MODES.STATUS)
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [selectedAnimalId, setSelectedAnimalId] = useState(null)
    const primaryFilterOptions = getPivePrimaryFilterOptions(filterCatalogMode)
    const icon = getPiveFilterToggleIcon(filterCatalogMode)
    const secondaryCategory = getPiveSecondaryCategory(activeFilter)
    const secondaryPlaceholder = getPiveSecondaryPlaceholder(secondaryCategory)
    const handleLoadError = React.useCallback((message) => {
        Alert.alert('Erro', message)
    }, [])
    const {
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
    } = usePiveListData({
        activeFilter,
        secondaryCategory,
        selectedAnimalId,
        onLoadError: handleLoadError,
    })

    const categoryData = primaryFilterOptions.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const handleSelect = async (selectedKey) => {
        const selectedCategory = primaryFilterOptions.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setActiveFilter(selectedCategory.key)
            setSelectedAnimalId(null)
            onPrimaryFilterChange(selectedCategory.key)
        }
    }

    const handleSecondarySelect = (selectedKey) => {
        const selected = secondaryOptions.find(option => option.key === selectedKey)
        if (selected) {
            setSelectedAnimalId(selectedKey)
            onSelectedAnimalChange(selectedKey)
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
        const nextFilterCatalogMode = filterCatalogMode === PIVE_FILTER_CATALOG_MODES.STATUS
            ? PIVE_FILTER_CATALOG_MODES.ANIMAL
            : PIVE_FILTER_CATALOG_MODES.STATUS

        onFilterCatalogModeChange(nextFilterCatalogMode)
        setSelectedAnimalId(null)
        setFilterCatalogMode(nextFilterCatalogMode)

        if (nextFilterCatalogMode === PIVE_FILTER_CATALOG_MODES.STATUS) {
            setActiveFilter('ALL')
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
                    visibleItems.length === 0 && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                {(activeFilter === 'donor' || activeFilter === 'bull') &&
                    selectedAnimalId &&
                    filteredFivsLoading &&
                    visibleItems.length === 0 && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                {visibleItems.map(item => (
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
                    visibleItems.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma FIV encontrada.
                        </Text>
                    )}
                {(activeFilter === 'donor' || activeFilter === 'bull') &&
                    selectedAnimalId &&
                    !filteredFivsLoading &&
                    hasLoadedFilteredFivs &&
                    !filteredFivsError &&
                    visibleItems.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma FIV encontrada.
                        </Text>
                    )}
                {((activeFilter !== 'donor' && activeFilter !== 'bull' && loading) ||
                    ((activeFilter === 'donor' || activeFilter === 'bull') && filteredFivsLoading)) &&
                    visibleItems.length > 0 && (
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
