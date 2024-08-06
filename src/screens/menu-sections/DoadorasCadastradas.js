import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";

export default ({ navigation }) => {
    const baseURL = 'https://api.github.com'
    const perPage = 20

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [donorName, setDonorName] = useState('')

    useEffect(() => {
        loadApi()
    }, [])

    async function loadApi(query = '') {
        if (loading) return

        setLoading(true)

        try {
            let response;
            if (query) {
                // Busca pelo nome
                response = await axios.get(`${baseURL}/search/repositories?q=${query} in:name&per_page=${perPage}`)
                setData(response.data.items);
            } else {
                // Busca genérica
                response = await axios.get(`${baseURL}/search/repositories?q=react&per_page=${perPage}`)
                setData(response.data.items);
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }

    function handleSearch() {
        if (donorName) {
            setData([]) // Limpa os dados antes da nova busca
            loadApi(donorName)
        }
    }

    async function removeItem(id) {
        try {
            await axios.delete(`${baseURL}/repositories/${id}`);
            setData(data.filter(item => item.id !== id));
        } catch (error) {
            console.error("Erro ao deletar o item:", error);
        }
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => {
                    navigation.navigate('Menu')
                }}>
                    <View style={{marginRight: 50}}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Doadoras Cadastradas</Text>
            </View>
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Nome da Doadora"
                        value={donorName}
                        style={style.input}
                        onChangeText={setDonorName}
                    />
                    <TouchableOpacity style={style.listButtonEdit} onPress={handleSearch}>
                        <Text style={style.listButtonTextEdit}>Buscar</Text>
                    </TouchableOpacity>
                </View>
                <FlatList 
                    style={{marginTop: 5}}
                    contentContainerStyle={{ marginHorizontal: 20 }}
                    data={data}
                    keyExtractor={ item => String(item.id)}
                    renderItem={({ item }) => <ListItem data={item} onRemove={removeItem} />}
                    onEndReached={() => loadApi('')}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={ <FooterList load={loading}/>}
                />
            </View>
        </View>
    )
}

function ListItem({ data, onRemove }) {
    return (
        <View style={style.listItemDonor}>
            <Text style={style.listText}>{`Nome: ${data.name}`}</Text>
            <Text style={style.listText}>{`Identificação: ${data.id}  \nNascimento: ${data.created_at}`}</Text>
            <View style={style.listButtonsDonor}>
                <TouchableOpacity 
                    style={style.listButtonDeleteDonor}
                    onPress={() => onRemove(data.id)} // Chama a função de remoção
                >
                    <Text style={style.listButtonTextDelete}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

function FooterList({ load }) {
    if(!load) return null

    return(
        <View>
            <ActivityIndicator size={25} color="#092955"/>
        </View>
    )
}
