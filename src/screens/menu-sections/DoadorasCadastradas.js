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
    const loadingRef = React.useRef(false)
    const pendingLoadRef = React.useRef(null)

    const filterOptions = [
        { key: 'all', value: 'Todas as doadoras' },
        { key: 'highest-average-oocytes', value: 'Maior média oócitos viáveis' },
        { key: 'highest-average-embryo-percentage', value: 'Maior eficiência de embriões viáveis' },
        { key: 'combination', value: 'Combinação de touros com doadoras' },
    ]

    useFocusEffect(
        React.useCallback(() => {
            const debounceTimer = setTimeout(() => {
                loadApi()
            }, 500)

            return () => {
                clearTimeout(debounceTimer)
                pendingLoadRef.current = null
            }
        }, [filterOption, registrationNumber])
    )

    async function loadApi() {
        if (loadingRef.current) {
            pendingLoadRef.current = () => loadApi()
            return
        }

        loadingRef.current = true
        setLoading(true);
        let donors

        try {
            if (filterOption === 'combination') {
                donors = await listDonorBullCombinations()
            } else {
                if (registrationNumber) {
                    donors = await searchDonors(registrationNumber)
                } else {
                    donors = await getDonorsByFilter()
                }
            }

            setData(donors)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as doadoras.')
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

    function getDonorsByFilter() {
        switch (filterOption) {
            case 'highest-average-oocytes':
                return listDonorsByHighestAverageOocytes()
            case 'highest-average-embryo-percentage':
                return listDonorsByHighestAverageEmbryoPercentage()
            case 'all':
            default:
                return listDonors()
        }
    }

    async function removeItem(id) {
        try {
            await deleteDonor(id)
            setData(data.filter(item => item.id !== id))
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir a doadora.')
            if (apiError.isCanceled) return
            console.error("Error deleting item:", apiError.message)
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
                <FlatList
                    showsVerticalScrollIndicator={false}
                    style={{ marginTop: 5 }}
                    contentContainerStyle={{ marginHorizontal: 20, paddingBottom: 300 }}
                    data={filteredData()}
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
                        return <ListItem data={item} onRemove={removeItem} navigation={navigation} />
                    }}
                    ListFooterComponent={<FooterList load={loading} />}
                />
            </View>
        </SafeAreaView>
    )
}

function ListItem({ data, onRemove, navigation }) {
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
