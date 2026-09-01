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
    listDonorBullCombinations,
    searchBulls,
} from "../../api/bullService";
import { normalizeApiError } from "../../api/errors";

export default ({ navigation }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [filterOption, setFilterOption] = useState('all')
    const loadingRef = React.useRef(false)
    const pendingLoadRef = React.useRef(null)

    const filterOptions = [
        { key: 'all', value: 'Todos os touros' },
        { key: 'highest-average-embryo-percentage', value: 'Maior eficiência de embriões viáveis' },
        { key: 'combination', value: 'Combinação de touros com doadoras' },
    ]

    useFocusEffect(
        React.useCallback(() => {
            const debounceTimer = setTimeout(() => {
                loadApi(registrationNumber)
            }, 500)

            return () => {
                clearTimeout(debounceTimer)
                pendingLoadRef.current = null
            }
        }, [filterOption, registrationNumber])
    )

    async function loadApi(query = '') {
        if (loadingRef.current) {
            pendingLoadRef.current = () => loadApi(query)
            return
        }

        loadingRef.current = true
        setLoading(true)

        try {
            if (filterOption === 'combination') {
                const combinations = await listDonorBullCombinations()

                if (query) {
                    const filteredData = combinations.filter(item => {
                        const donorName = String(item?.donor?.name ?? '')
                        const bullName = String(item?.bull?.name ?? '')
                        const donorRegistrationNumber = String(item?.donor?.registrationNumber ?? '')
                        const bullRegistrationNumber = String(item?.bull?.registrationNumber ?? '')

                        return donorName.includes(query) ||
                            bullName.includes(query) ||
                            donorRegistrationNumber.includes(query) ||
                            bullRegistrationNumber.includes(query)
                    });
                    setData(filteredData)
                } else {
                    setData(combinations)
                }
            } else {
                if (query) {
                    const bulls = await searchBulls(query)
                    setData(bulls)
                } else {
                    const bulls = await getBullsByFilter()
                    setData(bulls)
                }
            }
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar os touros.')
            if (apiError.isCanceled) return
            console.error(apiError.message)
        } finally {
            loadingRef.current = false
            const pendingLoad = pendingLoadRef.current
            pendingLoadRef.current = null

            if (pendingLoad) {
                pendingLoad()
            } else {
                setLoading(false)
            }
        }
    }

    function getBullsByFilter() {
        switch (filterOption) {
            case 'highest-average-embryo-percentage':
                return listBullsByHighestAverageEmbryoPercentage()
            case 'all':
            default:
                return listBulls()
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
        try {
            await deleteBull(id);
            setData(data.filter(item => item.id !== id));
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir o touro.')
            if (apiError.isCanceled) return
            console.error("Erro ao deletar o item:", apiError.message);
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
                            return <ListItem data={item} onRemove={confirmRemove} navigation={navigation} />
                        }
                    }}
                    ListFooterComponent={<FooterList load={loading} />}
                />
            </View>
        </SafeAreaView>
    )
}

function ListItem({ data, onRemove, navigation }) {
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
