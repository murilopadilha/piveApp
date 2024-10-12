import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const baseURL = `http://${IPAdress}/receiver/pregnant`
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadApi()
    }, [])

    async function loadApi() {
        try {
            const response = await axios.get(baseURL);
            setData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function confirmRemove(id) {
        Alert.alert(
            "Confirmar Exclusão",
            "Você tem certeza de que deseja excluir esta receptora?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", onPress: () => removeItem(id) }
            ]
        )
    }

    async function removeItem(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            setData(data.filter(item => item.id !== id));
        } catch (error) {
            console.error("Erro ao deletar o item:", error);
        }
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Prenhez', { fiv: fiv })}>
                    <View style={{ marginRight: '8%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Receptoras Prenhaz</Text>
            </View>
            <View style={style.contentList}>
                <FlatList
                    showsVerticalScrollIndicator={false}
                    style={{ marginTop: 5 }}
                    contentContainerStyle={{ marginHorizontal: 20, paddingBottom: 300 }}
                    data={data}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                        <ListItem data={item} onRemove={confirmRemove} navigation={navigation} />
                    )}
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
                    {data.name} ({data.registrationNumber})
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Raça: </Text>
                    {data.breed}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Dia de Transferência: </Text>
                    {data.pregnancy.transferDay}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Ano de Gestação: </Text>
                    {data.pregnancy.gestationalAge}
                </Text>
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
