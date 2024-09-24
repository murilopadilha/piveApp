import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from 'react-native-dropdown-select-list';
import { IPAdress } from "../../components/APIip";

export default ({ navigation }) => {
    const baseURL = `http://${IPAdress}`
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [filterOption, setFilterOption] = useState('all')

    const filterOptions = [
        { key: 'all', value: 'Todos os touros' },
        { key: 'highest-average-embryo-percentage', value: 'Maior eficiência de embriões viáveis' },
        { key: 'combination', value: 'Combinação de touros com doadoras' },
    ]

    useEffect(() => {
        loadApi();
    }, [filterOption])

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            loadApi(registrationNumber)
        }, 500)

        return () => clearTimeout(debounceTimer)
    }, [registrationNumber])

    async function loadApi(query = '') {
        if (loading) return

        setLoading(true)

        try {
            let response;
            let apiUrl = getApiUrl()

            if (filterOption === 'combination') {
                apiUrl = `${baseURL}/donor-bull-combinations`
                response = await axios.get(apiUrl)

                if (query) {
                    const filteredData = response.data.filter(item => 
                        (item.donor.name && item.donor.name.includes(query)) ||
                        (item.bull.name && item.bull.name.includes(query)) ||
                        (item.donor.registrationNumber && item.donor.registrationNumber.includes(query)) ||
                        (item.bull.registrationNumber && item.bull.registrationNumber.includes(query))
                    );
                    setData(filteredData)
                } else {
                    setData(response.data)
                }
            } else {
                if (query) {
                    response = await axios.get(`${baseURL}/bull/search?registrationNumber=${query}`)
                    setData(response.data)
                } else {
                    response = await axios.get(apiUrl)
                    setData(response.data)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    function getApiUrl() {
        switch (filterOption) {
            case 'highest-average-embryo-percentage':
                return `${baseURL}/bull/highest-average-embryo-percentage`
            case 'all':
            default:
                return `${baseURL}/bull`
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
            await axios.delete(`${baseURL}/bull/${id}`);
            setData(data.filter(item => item.id !== id));
        } catch (error) {
            console.error("Erro ao deletar o item:", error);
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
                            if (item.donor && item.bull) {
                                return (
                                    <View style={style.listItem}>
                                        <View style={style.listText}>
                                            <Text style={style.listText}>
                                                <Text style={{ fontWeight: 'bold' }}>Doadora: </Text>
                                                {item.donor.name || 'N/A'} ({item.donor.registrationNumber || 'N/A'})
                                            </Text>
                                            <Text style={style.listText}>
                                                <Text style={{ fontWeight: 'bold' }}>Touro: </Text>
                                                {item.bull.name || 'N/A'} ({item.bull.registrationNumber || 'N/A'}) 
                                            </Text>
                                            <Text style={style.listText}>
                                                <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
                                                {item.averageCombinationEmbryosPercentage || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            } else {
                                return <Text style={style.listText}>Dados incompletos</Text>
                            }
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
                    {data.name}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Número de registro: </Text>
                    {data.registrationNumber}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
                    {data.averageEmbryoPercentage}
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
