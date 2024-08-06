import React, {useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";

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
    }, [])

    async function loadApi(){
        if(loading) return

        setLoading(true)

        const response = await axios.get(`${baseURL}/search/repositories?q=react&per_page=${perPage}&page=${page}`)

        setData([...data, ...response.data.items])
        setPage(page + 1)
        setLoading(false)
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
                <TouchableOpacity style={style.listButtonEdit}>
                    <Text style={style.listButtonTextEdit}>Buscar</Text>
                </TouchableOpacity>
                </View>
                <FlatList 
                    style={{marginTop: 5}}
                    contentContainerStyle={{ marginHorizontal: 20 }}
                    data={data}
                    keyExtractor={ item => String(item.id)}
                    renderItem={({ item }) => <ListItem data={item}/>}
                    onEndReached={loadApi}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={ <FooterList load={loading}/>}
                />
            </View>
        </View>
    )
}

function ListItem({ data }) {
    return (
        <View style={style.listItem}>
            <View>
                <Text style={style.listText}>{`Nome: ${data.name}`}</Text>
                <Text style={style.listText}>{`Identificação: ${data.id}`}</Text>
            </View>
            <View style={style.listButtons}>
                <TouchableOpacity style={style.listButtonDelete}>
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