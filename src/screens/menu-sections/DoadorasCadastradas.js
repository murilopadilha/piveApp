import React, { useState, useEffect } from "react";
import { Text, TextInput, View, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import axios from "axios";
import style from "../../components/style";
import { SelectList } from 'react-native-dropdown-select-list';
import Octicons from '@expo/vector-icons/Octicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { IPAdress } from "../../components/APIip";
import { SafeAreaView } from "react-native-safe-area-context";

export default ({ navigation }) => {
    const baseURL = `http://${IPAdress}`
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [filterOption, setFilterOption] = useState('all')

    const filterOptions = [
        { key: 'all', value: 'Todas as doadoras' },
        { key: 'highest-average-oocytes', value: 'Maior média oócitos viáveis' },
        { key: 'highest-average-embryo-percentage', value: 'Maior eficiência de embriões viáveis' },
        { key: 'combination', value: 'Combinação de touros com doadoras' },
    ]

    useEffect(() => {
        loadApi()
    }, [filterOption])

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            loadApi()
        }, 500)

        return () => clearTimeout(debounceTimer)
    }, [registrationNumber])

    async function loadApi() {
        if (loading) return

        setLoading(true);
        let response

        try {
            let apiUrl

            if (filterOption === 'combination') {
                apiUrl = `${baseURL}/donor-bull-combinations`
                response = await axios.get(apiUrl)
            } else {
                apiUrl = getApiUrl()
                if (registrationNumber) {
                    response = await axios.get(`${baseURL}/donor/search`, {
                        params: { registrationNumber }
                    })
                } else {
                    response = await axios.get(apiUrl)
                }
            }

            setData(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    function getApiUrl() {
        switch (filterOption) {
            case 'highest-average-oocytes':
                return `${baseURL}/donor/highest-average-oocytes`
            case 'highest-average-embryo-percentage':
                return `${baseURL}/donor/highest-average-embryo-percentage`
            case 'all':
            default:
                return `${baseURL}/donor`
        }
    }

    async function removeItem(id) {
        try {
            await axios.delete(`${baseURL}/donor/${id}`)
            setData(data.filter(item => item.id !== id))
        } catch (error) {
            console.error("Error deleting item:", error)
        }
    }

    const filteredData = () => {
        if (filterOption === 'combination') {
            return data.filter(item =>
                item.donor && (
                    item.donor.name.toLowerCase().includes(registrationNumber.toLowerCase()) ||
                    item.donor.registrationNumber.includes(registrationNumber)
                )
            )
        }
        return data
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '5%' }}>
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
                    placeholder={"Filtrar doadoras"}
                    boxStyles={[style.selectListBox, { paddingBottom: '1%' }]}
                    inputStyles={style.selectListInput}
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
                                    {item.donor && item.bull ? (
                                        <View style={style.listText}>
                                            <Text style={style.listText}>
                                                <Text style={{ fontWeight: 'bold' }}>Doadora: </Text>
                                                {item.donor.name} ({item.donor.registrationNumber})
                                            </Text>
                                            <Text style={style.listText}>
                                                <Text style={{ fontWeight: 'bold' }}>Touro: </Text>
                                                {item.bull.name} ({item.bull.registrationNumber}) 
                                            </Text>
                                            <Text style={style.listText}>
                                                <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
                                                {item.averageCombinationEmbryosPercentage}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={style.listText}>Dados não disponíveis</Text>
                                    )}
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
                    {data.name} ({data.breed})
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Identificação: </Text>
                    {data.registrationNumber}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nascimento: </Text>
                    {data.birth}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Média oócitos viáveis: </Text>
                    {data.averageViableOocytes}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Eficiência emb viáveis: </Text>
                    {data.averageEmbryoPercentage}
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
