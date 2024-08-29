import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';

import { IPAdress } from "../../components/APIip";

export default ({ navigation }) => {
    const baseURL = `http://${IPAdress}`
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            loadApi(registrationNumber);
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [registrationNumber]);

    async function loadApi(query = '') {
        if (loading) return

        setLoading(true)

        try {
            let response
            if (query) {
                response = await axios.get(`${baseURL}/bull/search?registrationNumber=${query}`)
                setData(response.data)
            } else {
                response = await axios.get(`${baseURL}/bull`)
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
            await axios.delete(`${baseURL}/bull/${id}`)
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
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Touros cadastrados</Text>
            </View>
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Número de registro"
                        keyboardType="numeric"
                        value={registrationNumber}
                        style={[style.input, {width: 340}]}
                        onChangeText={setRegistrationNumber}
                    />
                </View>
                <FlatList
                    showsVerticalScrollIndicator={false}
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
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nome: </Text>
                    {data.name}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Número de registro: </Text>
                    {data.registrationNumber}
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
