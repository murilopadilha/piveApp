import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";

export default ({ navigation }) => {
    const baseURL = 'http://3.135.1.128:8080'
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
            let response
            if (query) {
                response = await axios.get(`${baseURL}/receiver/search?registrationNumber=${query}`)
                setData(response.data) 
            } else {
                response = await axios.get(`${baseURL}/receiver`)
                setData(response.data)
            }
        } catch (error) {
            
        } finally {
            setLoading(false)
        }
    }

    function handleSearch() {
        if (registrationNumber) {
            loadApi(registrationNumber) 
        }
    }

    function confirmRemove(id) {
        Alert.alert(
            "Confirmar Exclusão",
            "Você tem certeza de que deseja excluir esta receptora?",
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
            await axios.delete(`${baseURL}/receiver/${id}`)
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
                <Text style={style.titleText}>Receptoras Cadastradas</Text>
            </View>
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Número de Registro"
                        value={registrationNumber}
                        style={style.input}
                        onChangeText={setRegistrationNumber}
                    />
                    <TouchableOpacity style={style.listButtonSearch} onPress={handleSearch}>
                        <Text style={style.listButtonTextEdit}>Buscar</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                style={{ marginTop: 5 }}
                contentContainerStyle={{ marginHorizontal: 20 }}
                data={data}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                    <ListItem data={item} onRemove={confirmRemove} navigation={navigation} />
                )}
                ListFooterComponent={<FooterList load={loading} />}
                />
            </View>
        </View>
    )
}

function ListItem({ data, onRemove, navigation }) {
    return (
        <View style={style.listItem}>
            <View>
                <Text style={style.listText}>{`Nome: ${data.name} (${data.breed})`}</Text>
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
                    onPress={() => navigation.navigate('EditarReceptora', { donor: data })}
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
