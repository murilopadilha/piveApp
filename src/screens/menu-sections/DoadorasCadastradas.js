import React, { useState } from "react";
import { Text, TextInput, View, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SelectList } from 'react-native-dropdown-select-list';
import Octicons from '@expo/vector-icons/Octicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from "react-native-safe-area-context";
import {
    deleteDonor,
    listDonorBullCombinations,
    listDonors,
    listDonorsByHighestAverageEmbryoPercentage,
    listDonorsByHighestAverageOocytes,
    searchDonors,
} from "../../api/donorService";
import { normalizeApiError } from "../../api/errors";

export default ({ navigation }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [filterOption, setFilterOption] = useState('all')
    const [loadError, setLoadError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [deletingDonorIds, setDeletingDonorIds] = useState([])
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const registrationNumberRef = React.useRef(registrationNumber)
    const filterOptionRef = React.useRef(filterOption)
    const deletingDonorIdsRef = React.useRef(new Set())
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
        { key: 'all', value: 'Todas as doadoras' },
        { key: 'highest-average-oocytes', value: 'Maior média oócitos viáveis' },
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

    async function loadApi(currentFilterOption, currentRegistrationNumber) {
        if (!isScreenFocusedRef.current) return

        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true);
        let donors

        try {
            if (currentFilterOption === 'combination') {
                donors = await listDonorBullCombinations({ signal: abortController.signal })
            } else {
                if (currentRegistrationNumber) {
                    donors = await searchDonors(currentRegistrationNumber, {
                        signal: abortController.signal,
                    })
                } else {
                    donors = await getDonorsByFilter(currentFilterOption, {
                        signal: abortController.signal,
                    })
                }
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
    }

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

    async function removeItem(id) {
        if (deletingDonorIdsRef.current.has(id)) return

        deletingDonorIdsRef.current.add(id)
        setDeletingDonorIds(Array.from(deletingDonorIdsRef.current))

        try {
            await deleteDonor(id)

            if (!isScreenFocusedRef.current) return

            await loadApi(
                filterOptionRef.current,
                registrationNumberRef.current
            )
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

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '8%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Doadoras cadastradas</Text>
            </View>
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
                            <ListItem
                                data={item}
                                isDeleting={deletingDonorIds.includes(item.id)}
                                onRemove={removeItem}
                                navigation={navigation}
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
                    ListFooterComponent={<FooterList load={loading && visibleData.length > 0} />}
                />
            </View>
        </SafeAreaView>
    )
}

function ListItem({ data, isDeleting, onRemove, navigation }) {
    const confirmDelete = (id) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Você tem certeza de que deseja excluir esta doadora?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", onPress: () => onRemove(id) }
            ]
        )
    }

    return (
        <View style={style.listItem}>
            <View style={{ alignSelf: 'center' }}>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nome: </Text>
                    {data?.name || '-'} ({data?.breed || '-'})
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Identificação: </Text>
                    {data?.registrationNumber || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nascimento: </Text>
                    {data?.birth || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Média oócitos viáveis: </Text>
                    {data?.averageViableOocytes ?? '-'}
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
                    onPress={() => confirmDelete(data.id)}
                >
                    <Octicons name="trash" size={20} color="#908D8E" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[style.listButtonDelete, { marginTop: 2 }]}
                    onPress={() => navigation.navigate('EditarDoadora', { donor: data })}
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
