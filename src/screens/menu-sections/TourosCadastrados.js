import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from 'react-native-dropdown-select-list';
import {
    deleteBull,
    listBulls,
    listBullsByHighestAverageEmbryoPercentage,
    searchBulls,
} from "../../api/bullService";
import { listDonorBullCombinations } from "../../api/donorBullCombinationService";
import { normalizeApiError } from "../../api/errors";

export default ({ navigation }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [filterOption, setFilterOption] = useState('all')
    const [loadError, setLoadError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [deletingBullIds, setDeletingBullIds] = useState([])
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const registrationNumberRef = React.useRef(registrationNumber)
    const filterOptionRef = React.useRef(filterOption)
    const deletingBullIdsRef = React.useRef(new Set())
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    registrationNumberRef.current = registrationNumber
    filterOptionRef.current = filterOption

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
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
            const debounceTimer = setTimeout(() => {
                loadApi(filterOption, registrationNumber)
            }, 500)

            return () => {
                isScreenFocusedRef.current = false
                clearTimeout(debounceTimer)
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [filterOption, registrationNumber])
    )

    async function loadApi(currentFilterOption, query = '') {
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
            } else {
                if (query) {
                    bulls = await searchBulls(query, {
                        signal: abortController.signal,
                    })
                } else {
                    bulls = await getBullsByFilter(currentFilterOption, {
                        signal: abortController.signal,
                    })
                }
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
    }

    function getBullsByFilter(currentFilterOption, options) {
        switch (currentFilterOption) {
            case 'highest-average-embryo-percentage':
                return listBullsByHighestAverageEmbryoPercentage(options)
            case 'all':
            default:
                return listBulls(options)
        }
    }

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

        deletingBullIdsRef.current.add(id)
        setDeletingBullIds(Array.from(deletingBullIdsRef.current))

        try {
            await deleteBull(id);

            if (!isScreenFocusedRef.current) return

            await loadApi(
                filterOptionRef.current,
                registrationNumberRef.current
            )
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir o touro.')
            if (apiError.isCanceled) return
            if (!isMountedRef.current || !isScreenFocusedRef.current) return
            console.error("Erro ao deletar o item:", apiError.message);
        } finally {
            deletingBullIdsRef.current.delete(id)
            if (isMountedRef.current) {
                setDeletingBullIds(Array.from(deletingBullIdsRef.current))
            }
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '8%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Touros cadastrados</Text>
            </View>
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
                    keyExtractor={item => item?.id ? String(item.id) : Math.random().toString()}
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
                                <ListItem
                                    data={item}
                                    isDeleting={deletingBullIds.includes(item.id)}
                                    onRemove={confirmRemove}
                                    navigation={navigation}
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
                    ListFooterComponent={<FooterList load={loading && data.length > 0} />}
                />
            </View>
        </SafeAreaView>
    )
}

function ListItem({ data, isDeleting, onRemove, navigation }) {
    return (
        <View style={style.listItem}>
            <View style={{ alignSelf: 'center' }}>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nome: </Text>
                    {data?.name || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Número de registro: </Text>
                    {data?.registrationNumber || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
                    {data?.averageEmbryoPercentage ?? '-'}
                </Text>
            </View>
            <View style={style.listButtons}>
                <TouchableOpacity
                    disabled={isDeleting}
                    style={style.listButtonDelete}
                    onPress={() => onRemove(data.id)}
                >
                    <Octicons name="trash" size={20} color="#908D8E" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[style.listButtonDelete, { marginTop: 2 }]}
                    onPress={() => navigation.navigate('EditarTouro', { donor: data })}
                >
                    <Octicons name="pencil" size={20} color="#908D8E" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

function FooterList({ load }) {
    if (!load) return null

    return (
        <View>
            <ActivityIndicator size={25} color="#092955" />
        </View>
    )
}
