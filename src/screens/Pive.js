import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import style from '../components/style';
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
import { OPU_ROUTES } from '../features/opu/routes';
import { TRANSFER_ROUTES } from '../features/transfers/routes';
import { INVENTORY_ROUTES } from '../features/inventory/routes';
import { DOCUMENT_ROUTES } from '../features/documents/routes';
import { CORRECTION_ROUTES } from '../features/corrections/routes';
import { DISTRIBUTION_ROUTES } from '../features/distribution/routes';
import { DATA_QUALITY_ROUTES } from '../features/dataQuality/routes';

export default ({
    navigation,
    showTargetOpu = false,
    showTargetTransfers = false,
    showTargetInventory = false,
    showTargetDocuments = false,
    showTargetCorrections = false,
    showTargetDataQuality = false,
    showTargetShipments = false,
    showTargetRecalls = false,
}) => {
    const [filterCatalogMode, setFilterCatalogMode] = useState(PIVE_FILTER_CATALOG_MODES.STATUS)
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [selectedAnimalId, setSelectedAnimalId] = useState(null)
    const primaryFilterOptions = getPivePrimaryFilterOptions(filterCatalogMode)
    const icon = getPiveFilterToggleIcon(filterCatalogMode)
    const secondaryCategory = getPiveSecondaryCategory(activeFilter)
    const secondaryPlaceholder = getPiveSecondaryPlaceholder(secondaryCategory)
    const showTargetDirectories = showTargetOpu ||
        showTargetTransfers ||
        showTargetInventory ||
        showTargetDocuments ||
        showTargetCorrections ||
        showTargetShipments ||
        showTargetRecalls ||
        showTargetDataQuality
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

    const handleSelect = (selectedKey) => {
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
            {showTargetDirectories ? (
                <View style={styles.targetSection}>
                    <Text accessibilityRole="header" style={styles.sectionTitle}>
                        Operações PIVE
                    </Text>
                    <ScrollView
                        accessibilityLabel="Diretórios operacionais PIVE"
                        horizontal
                        showsHorizontalScrollIndicator
                        contentContainerStyle={styles.targetDirectoryContent}
                    >
                        {showTargetOpu ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir diretório de OPU"
                                accessibilityHint="Consulta sessões de coleta de oócitos"
                                style={[styles.targetDirectoryButton, styles.opuDirectoryButton]}
                                onPress={() => navigation.navigate(OPU_ROUTES.LIST)}
                            >
                                <Text style={styles.opuDirectoryText}>OPU</Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetTransfers ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir ciclos de receptoras"
                                accessibilityHint="Consulta ciclos, transferências realizadas e resultados gestacionais"
                                style={[styles.targetDirectoryButton, styles.transferDirectoryButton]}
                                onPress={() => navigation.navigate(
                                    TRANSFER_ROUTES.RECIPIENT_CYCLE_LIST
                                )}
                            >
                                <Text style={styles.opuDirectoryText}>Ciclos de receptoras</Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetInventory ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir inventário criogênico"
                                accessibilityHint="Consulta packages, locais e movimentos físicos"
                                style={[styles.targetDirectoryButton, styles.inventoryDirectoryButton]}
                                onPress={() => navigation.navigate(INVENTORY_ROUTES.LIST)}
                            >
                                <Text style={styles.opuDirectoryText}>Inventário criogênico</Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetDocuments ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir diretório de documentos"
                                accessibilityHint="Consulta documentos e o histórico imutável de versões"
                                style={[styles.targetDirectoryButton, styles.documentDirectoryButton]}
                                onPress={() => navigation.navigate(DOCUMENT_ROUTES.LIST)}
                            >
                                <Text style={styles.opuDirectoryText}>Documentos</Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetCorrections ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir solicitações de correção histórica"
                                accessibilityHint="Consulta solicitações registradas e seu impacto atual"
                                style={[styles.targetDirectoryButton, styles.correctionDirectoryButton]}
                                onPress={() => navigation.navigate(CORRECTION_ROUTES.LIST)}
                            >
                                <Text style={styles.opuDirectoryText}>
                                    Solicitações de correção histórica
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetShipments ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir distribuição"
                                accessibilityHint="Consulta remessas e readiness operacional"
                                style={[styles.targetDirectoryButton, styles.shipmentDirectoryButton]}
                                onPress={() => navigation.navigate(
                                    DISTRIBUTION_ROUTES.SHIPMENT_LIST
                                )}
                            >
                                <Text style={styles.opuDirectoryText}>Distribuição</Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetRecalls ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir Recalls"
                                accessibilityHint="Consulta casos de Recall e impacto recalculado"
                                style={[styles.targetDirectoryButton, styles.recallDirectoryButton]}
                                onPress={() => navigation.navigate(
                                    DISTRIBUTION_ROUTES.RECALL_LIST
                                )}
                            >
                                <Text style={styles.opuDirectoryText}>Recalls</Text>
                            </TouchableOpacity>
                        ) : null}
                        {showTargetDataQuality ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Abrir qualidade de dados"
                                accessibilityHint="Consulta issues derivados de Embryos e Packages"
                                style={[styles.targetDirectoryButton, styles.dataQualityDirectoryButton]}
                                onPress={() => navigation.navigate(DATA_QUALITY_ROUTES.LIST)}
                            >
                                <Text style={styles.opuDirectoryText}>Qualidade de dados</Text>
                            </TouchableOpacity>
                        ) : null}
                    </ScrollView>
                </View>
            ) : null}
            <View style={styles.legacySection}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                    Produção FIV
                </Text>
                <Text style={styles.sectionSubtitle}>
                    Fluxo legado de produção e acompanhamento
                </Text>
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
                accessibilityRole="button"
                accessibilityLabel="Criar nova FIV"
                accessibilityHint="Abre o fluxo legado de cadastro de FIV"
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
        flex: 1,
        width: '100%',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: '2%',
    },
    list: {
        marginLeft: 20,
        width: '90%',
        flex: 1,
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
        minHeight: 44,
        width: 104,
        alignItems: 'center',
        alignSelf: 'flex-end',
        justifyContent: 'center',
        marginRight: 20,
        marginBottom: 10,
    },
    newFivText: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
        color: '#FFFFFF',
        textAlign: 'center',
        paddingTop: 3,
    },
    targetSection: {
        marginBottom: 8,
    },
    targetDirectoryContent: {
        paddingHorizontal: 20,
        paddingBottom: 6,
    },
    targetDirectoryButton: {
        width: 210,
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        paddingHorizontal: 12,
        borderRadius: 24,
    },
    sectionTitle: {
        marginHorizontal: 20,
        marginBottom: 6,
        color: '#092955',
        fontSize: 18,
        fontWeight: '700',
    },
    sectionSubtitle: {
        marginHorizontal: 20,
        marginBottom: 6,
        color: '#475569',
        fontSize: 13,
    },
    legacySection: {
        marginTop: 4,
    },
    opuDirectoryButton: {
        backgroundColor: '#092955',
    },
    opuDirectoryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    transferDirectoryButton: {
        backgroundColor: '#164E63',
    },
    inventoryDirectoryButton: {
        backgroundColor: '#334155',
    },
    documentDirectoryButton: {
        backgroundColor: '#4338CA',
    },
    correctionDirectoryButton: {
        backgroundColor: '#7C2D12',
    },
    shipmentDirectoryButton: {
        backgroundColor: '#155E75',
    },
    recallDirectoryButton: {
        backgroundColor: '#9F1239',
    },
    dataQualityDirectoryButton: {
        backgroundColor: '#0F766E',
    },
})
