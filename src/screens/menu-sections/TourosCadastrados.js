import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";

export default ({ navigation }) => {
    const baseURL = 'http://172.20.7.184:8080'
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')

    useEffect(() => {
        loadApi()
    }, [])

    async function loadApi(query = '') {
        if (loading) return

        setLoading(true)

        try {
            let response;
            if (query) {
                // Busca pelo registrationNumber exato
                response = await axios.get(`${baseURL}/bull/search?registrationNumber=${query}`)
                setData(response.data)  // Define data com o resultado da busca
            } else {
                // Busca inicial ou genérica
                response = await axios.get(`${baseURL}/bull`)
                setData(response.data)  // Define data com todos os itens
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }

    function handleSearch() {
        if (registrationNumber) {
            loadApi(registrationNumber)  // Carrega dados baseados no registrationNumber
        }
    }

    async function removeItem(id) {
        try {
            // Supondo que você tenha uma rota de API para deletar o item pelo ID
            await axios.delete(`${baseURL}/bull/${id}`)
            // Remove o item da lista localmente após a exclusão bem-sucedida
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
                        placeholder="Número de Registro"
                        value={registrationNumber}
                        style={style.input}
                        onChangeText={setRegistrationNumber}
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
                <Text style={style.listText}>{`Número de Registro: ${data.registrationNumber}`}</Text>
            </View>
            <View style={style.listButtons}>
                <TouchableOpacity
                    style={style.listButtonDelete}
                    onPress={() => onRemove(data.id)}
                >
                    <Text style={style.listButtonTextDelete}>Excluir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={style.listButtonEdit}
                    onPress={() => null}
                >
                    <Text style={style.listButtonTextEdit}>Editar</Text>
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
