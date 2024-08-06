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
    const [page, setPage] = useState(1)
    const [bullIdentification, setIdentification] = useState('')

    useEffect(() => {
        loadApi()
    }, []);

    async function loadApi(query = '') {
        if (loading) return

        setLoading(true)

        try {
            let response
            if (query) {
                // Busca pelo nome do touro
                response = await axios.get(`${baseURL}/search/repositories?q=${query} in:name&per_page=${perPage}`);
                setData(response.data.items)
            } else {
                // Busca genérica
                response = await axios.get(`${baseURL}/search/repositories?q=react&per_page=${perPage}&page=${page}`);
                setData([...data, ...response.data.items])
                setPage(page + 1)
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }

    function handleSearch() {
        if (bullIdentification) {
            setData([]); // Limpa os dados antes da nova busca
            loadApi(bullIdentification)
        }
    }

    async function removeItem(id) {
        try {
            // Supondo que você tenha uma rota de API para deletar o item pelo ID
            await axios.delete(`${baseURL}/repositories/${id}`)
            // Remover o item da lista localmente após a exclusão bem-sucedida
            setData(data.filter(item => item.id !== id))
        } catch (error) {
            console.error("Erro ao deletar o item:", error)
        }
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Touros Cadastrados</Text>
            </View>
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Identificação do Touro"
                        value={bullIdentification}
                        style={style.input}
                        onChangeText={setIdentification}
                    />
                    <TouchableOpacity style={style.listButtonEdit} onPress={handleSearch}>
                        <Text style={style.listButtonTextEdit}>Buscar</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    style={{ marginTop: 5 }}
                    contentContainerStyle={{ marginHorizontal: 20 }}
                    data={data}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => <ListItem data={item} onRemove={removeItem} />}
                    onEndReached={() => loadApi()}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={<FooterList load={loading} />}
                />
            </View>
        </View>
    )
}

function ListItem({ data, onRemove }) {
    return (
        <View style={style.listItem}>
            <View>
                <Text style={style.listText}>{`Nome: ${data.name}`}</Text>
                <Text style={style.listText}>{`Identificação: ${data.id}`}</Text>
            </View>
            <View style={style.listButtons}>
                <TouchableOpacity
                    style={style.listButtonDelete}
                    onPress={() => onRemove(data.id)} // Chama a função de remoção
                >
                    <Text style={style.listButtonTextDelete}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

function FooterList({ load }) {
    if (!load) return null;

    return (
        <View>
            <ActivityIndicator size={25} color="#092955" />
        </View>
    )
}
