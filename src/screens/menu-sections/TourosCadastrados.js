import React, { useState } from "react";
import { Text, TextInput, View, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import ListFooterLoader from "../../components/ListFooterLoader";
import ScreenHeader from "../../components/ScreenHeader";
import { SelectList } from 'react-native-dropdown-select-list';
import { deleteBull } from "../../api/bullService";
import { normalizeApiError } from "../../api/errors";
import BullListItem from "../../features/animals/components/BullListItem";
import useBullList from "../../features/animals/hooks/useBullList";

function getBullListItemKey(item, index) {
    if (item?.id != null) return String(item.id)

    const donorKey = item?.donor?.id ?? item?.donor?.registrationNumber
    const bullKey = item?.bull?.id ?? item?.bull?.registrationNumber

    if (donorKey != null || bullKey != null) {
        return `combination-${donorKey ?? 'donor'}-${bullKey ?? 'bull'}`
    }

    return `item-${index}`
}

export default ({ navigation }) => {
    const {
        data,
        loading,
        loadError,
        hasLoaded,
        registrationNumber,
        setRegistrationNumber,
        filterOption,
        setFilterOption,
        reload,
    } = useBullList()
    const [deletingBullIds, setDeletingBullIds] = useState([])
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const deletingBullIdsRef = React.useRef(new Set())
    const deleteAbortControllersRef = React.useRef(new Map())

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            deleteAbortControllersRef.current.forEach((controller) => controller.abort())
            deleteAbortControllersRef.current.clear()
        }
    }, [])

    const filterOptions = [
        { key: 'all', value: 'Todos os touros' },
        { key: 'highest-average-embryo-percentage', value: 'Maior eficiência de embriões viáveis' },
        { key: 'combination', value: 'Combinação de touros com doadoras' },
    ]

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true

            return () => {
                isScreenFocusedRef.current = false
                deleteAbortControllersRef.current.forEach((controller) => controller.abort())
                deleteAbortControllersRef.current.clear()
            }
        }, [])
    )

    function confirmRemove(id) {
        Alert.alert(
            "Confirmar Exclusão",
            "Você tem certeza de que deseja excluir este touro?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    onPress: () => removeItem(id)
                }
            ]
        )
    }

    async function removeItem(id) {
        if (deletingBullIdsRef.current.has(id)) return

        const abortController = new AbortController()
        deletingBullIdsRef.current.add(id)
        deleteAbortControllersRef.current.set(id, abortController)
        setDeletingBullIds(Array.from(deletingBullIdsRef.current))

        try {
            await deleteBull(id, {
                signal: abortController.signal,
            });

            if (
                !isScreenFocusedRef.current ||
                deleteAbortControllersRef.current.get(id) !== abortController
            ) return

            await reload()
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir o touro.')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                deleteAbortControllersRef.current.get(id) !== abortController
            ) return
            Alert.alert("Erro", apiError.message)
        } finally {
            if (deleteAbortControllersRef.current.get(id) === abortController) {
                deleteAbortControllersRef.current.delete(id)
            }
            deletingBullIdsRef.current.delete(id)
            if (isMountedRef.current) {
                setDeletingBullIds(Array.from(deletingBullIdsRef.current))
            }
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <ScreenHeader
                title="Touros cadastrados"
                onBack={() => navigation.navigate('Menu')}
            />
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Número de registro"
                        placeholderTextColor="#888"
                        value={registrationNumber}
                        style={[style.input, { width: 340, marginBottom: 0 }]}
                        onChangeText={setRegistrationNumber}
                    />
                </View>
                <SelectList
                    setSelected={setFilterOption}
                    data={filterOptions}
                    placeholder={"Filtrar touros"}
                    searchPlaceholder={"Filtros"}
                    boxStyles={[style.selectListBox, { paddingBottom: '1%' }]}
                    inputStyles={style.selectListInput}
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
                    data={data}
                    keyExtractor={getBullListItemKey}
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
                        } else {
                            return (
                                <BullListItem
                                    data={item}
                                    isDeleting={deletingBullIds.includes(item.id)}
                                    onRemove={confirmRemove}
                                    onEdit={(bull) => navigation.navigate('EditarTouro', { donor: bull })}
                                />
                            )
                        }
                    }}
                    ListEmptyComponent={
                        !hasLoaded || loading ? (
                            <ActivityIndicator size={25} color="#092955" />
                        ) : loadError ? null : (
                            <Text style={{ textAlign: 'center', marginTop: 10 }}>
                                Nenhum touro encontrado.
                            </Text>
                        )
                    }
                    ListFooterComponent={
                        <ListFooterLoader loading={loading && data.length > 0} />
                    }
                />
            </View>
        </SafeAreaView>
    )
}
