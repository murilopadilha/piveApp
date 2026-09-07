import React, { useState } from "react";
import { Text, TextInput, View, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from "react-native-safe-area-context";
import ListFooterLoader from "../../components/ListFooterLoader";
import ScreenHeader from "../../components/ScreenHeader";
import { deleteDonor } from "../../api/donorService";
import { normalizeApiError } from "../../api/errors";
import DonorListItem from "../../features/animals/components/DonorListItem";
import useDonorList from "../../features/animals/hooks/useDonorList";

export default ({ navigation }) => {
    const {
        visibleData,
        loading,
        loadError,
        hasLoaded,
        registrationNumber,
        setRegistrationNumber,
        filterOption,
        setFilterOption,
        reload,
    } = useDonorList()
    const [deletingDonorIds, setDeletingDonorIds] = useState([])
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const deletingDonorIdsRef = React.useRef(new Set())

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
        }
    }, [])

    const filterOptions = [
        { key: 'all', value: 'Todas as doadoras' },
        { key: 'highest-average-oocytes', value: 'Maior média oócitos viáveis' },
        { key: 'highest-average-embryo-percentage', value: 'Maior eficiência de embriões viáveis' },
        { key: 'combination', value: 'Combinação de touros com doadoras' },
    ]

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true

            return () => {
                isScreenFocusedRef.current = false
            }
        }, [])
    )

    async function removeItem(id) {
        if (deletingDonorIdsRef.current.has(id)) return

        deletingDonorIdsRef.current.add(id)
        setDeletingDonorIds(Array.from(deletingDonorIdsRef.current))

        try {
            await deleteDonor(id)

            if (!isScreenFocusedRef.current) return

            await reload()
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir a doadora.')
            if (apiError.isCanceled) return
            if (!isMountedRef.current || !isScreenFocusedRef.current) return
            console.error("Error deleting item:", apiError.message)
        } finally {
            deletingDonorIdsRef.current.delete(id)
            if (isMountedRef.current) {
                setDeletingDonorIds(Array.from(deletingDonorIdsRef.current))
            }
        }
    }

    function confirmRemove(id) {
        Alert.alert(
            "Confirmar Exclusão",
            "Você tem certeza de que deseja excluir esta doadora?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", onPress: () => removeItem(id) }
            ]
        )
    }

    return (
        <SafeAreaView style={style.menu}>
            <ScreenHeader
                title="Doadoras cadastradas"
                onBack={() => navigation.navigate('Menu')}
            />
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Identificação da doadora"
                        placeholderTextColor="#888"
                        value={registrationNumber}
                        style={[style.input, { width: 340, marginBottom: 0 }]}
                        onChangeText={setRegistrationNumber}
                    />
                </View>
                <SelectList
                    setSelected={setFilterOption}
                    data={filterOptions}
                    searchPlaceholder={"Filtros"}
                    placeholder={"Filtrar doadoras"}
                    boxStyles={[style.selectListBox, { paddingBottom: '1%' }]}
                    inputStyles={[style.selectListInput, { color: '#000' }]}
                    dropdownStyles={style.selectListDropdown}
                />
                {loadError && (
                    <Text style={{ color: '#B00020', marginHorizontal: 20, marginTop: 5 }}>
                        {loadError}
                    </Text>
                )}
                <FlatList
                    showsVerticalScrollIndicator={false}
                    style={{ marginTop: 5 }}
                    contentContainerStyle={{ marginHorizontal: 20, paddingBottom: 300 }}
                    data={visibleData}
                    keyExtractor={(item) => item?.id ? String(item.id) : Math.random().toString()}
                    renderItem={({ item }) => {
                        if (filterOption === 'combination') {
                            return (
                                <View style={style.listItem}>
                                    <View style={style.listText}>
                                        <Text style={style.listText}>
                                            <Text style={{ fontWeight: 'bold' }}>Doadora: </Text>
                                            {item?.donor?.name || '-'} ({item?.donor?.registrationNumber || '-'})
                                        </Text>
                                        <Text style={style.listText}>
                                            <Text style={{ fontWeight: 'bold' }}>Touro: </Text>
                                            {item?.bull?.name || '-'} ({item?.bull?.registrationNumber || '-'})
                                        </Text>
                                        <Text style={style.listText}>
                                            <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
                                            {item?.averageCombinationEmbryosPercentage ?? '-'}
                                        </Text>
                                    </View>
                                </View>
                            )
                        }
                        return (
                            <DonorListItem
                                data={item}
                                isDeleting={deletingDonorIds.includes(item.id)}
                                onRemove={confirmRemove}
                                onEdit={(donor) => navigation.navigate('EditarDoadora', { donor })}
                            />
                        )
                    }}
                    ListEmptyComponent={
                        !hasLoaded || loading ? (
                            <ActivityIndicator size={25} color="#092955" />
                        ) : loadError ? null : (
                            <Text style={{ textAlign: 'center', marginTop: 10 }}>
                                Nenhuma doadora encontrada.
                            </Text>
                        )
                    }
                    ListFooterComponent={
                        <ListFooterLoader loading={loading && visibleData.length > 0} />
                    }
                />
            </View>
        </SafeAreaView>
    )
}
