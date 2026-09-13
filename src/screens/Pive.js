import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import style from '../components/style';
import { createFiv } from '../api/fivService';
import { normalizeApiError } from '../api/errors';
import {
    PIVE_FILTER_CATALOG_MODES,
    getPiveFilterToggleIcon,
    getPivePrimaryFilterOptions,
    getPiveSecondaryCategory,
    getPiveSecondaryPlaceholder,
} from '../features/pive/filters';
import PiveFilterControls from '../features/pive/components/PiveFilterControls';
import PiveListItem from '../features/pive/components/PiveListItem';
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
        <SafeAreaView style={styles.screen}>
            <View style={[style.divTitleMain]}>
                <Image source={require('../images/menu/logo.png')} style={styles.logo}/>
                <Text style={style.titleTextMain}>BovInA</Text>
            </View>
            <PiveFilterControls
                primaryOptions={categoryData}
                icon={icon}
                onPrimarySelect={handleSelect}
                onToggleCatalog={toggleCategory}
                secondaryCategory={secondaryCategory}
                secondaryOptions={secondaryOptions}
                secondaryPlaceholder={secondaryPlaceholder}
                onSecondarySelect={handleSecondarySelect}
                secondaryOptionsLoading={secondaryOptionsLoading}
                secondaryOptionsError={secondaryOptionsError}
                hasLoadedSecondaryOptions={hasLoadedSecondaryOptions}
            />
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}>
                {activeFilter !== 'donor' && activeFilter !== 'bull' && loadError && (
                    <Text style={styles.errorText}>
                        {loadError}
                    </Text>
                )}
                {(activeFilter === 'donor' || activeFilter === 'bull') && filteredFivsError && (
                    <Text style={styles.errorText}>
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
                    <PiveListItem
                        key={item.id}
                        fiv={item}
                        onPress={() => navigation.navigate('FivInfo', { fiv: item })}
                    />
                ))}
                {activeFilter !== 'donor' &&
                    activeFilter !== 'bull' &&
                    !loading &&
                    hasLoaded &&
                    !loadError &&
                    visibleItems.length === 0 && (
                        <Text style={styles.emptyText}>
                            Nenhuma FIV encontrada.
                        </Text>
                    )}
                {(activeFilter === 'donor' || activeFilter === 'bull') &&
                    selectedAnimalId &&
                    !filteredFivsLoading &&
                    hasLoadedFilteredFivs &&
                    !filteredFivsError &&
                    visibleItems.length === 0 && (
                        <Text style={styles.emptyText}>
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
                style={[style.listButtonSearch, styles.newFivButton]}
                onPress={() => navigation.navigate('Cabecalho')}
            >
                <Text style={styles.newFivText}>Nova FIV</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        width: '100%',
        height: '100%',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: '2%',
    },
    list: {
        marginLeft: 20,
        width: '90%',
        height: '85%',
        display: 'flex',
        flexDirection: 'column',
    },
    listContent: {
        paddingBottom: 150,
    },
    errorText: {
        color: '#B00020',
        marginHorizontal: 20,
        marginTop: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
    },
    newFivButton: {
        paddingTop: '2%',
        marginTop: '175%',
        width: '20%',
        height: '5%',
        marginLeft: '70%',
        position: 'absolute',
        zIndex: 5,
    },
    newFivText: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
        color: '#FFFFFF',
        textAlign: 'center',
        paddingTop: 3,
    },
})
