import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { id } = route.params
    const [newNumber, setNumber] = useState('')
    const [productionId, setProductionId] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/oocyte-collection/${id}`)
                const fetchedProductionId = response.data?.embryoProduction?.id
                if (fetchedProductionId) {
                    setProductionId(fetchedProductionId)
                }
            } catch (error) {
                const responseData = error?.response?.data
                const message = typeof responseData === 'string'
                    ? responseData
                    : error?.message || 'Não foi possível carregar os dados da coleta.'
                Alert.alert("Erro", message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const postFrozenEmbryos = async () => {
        if (!productionId) {
            Alert.alert("Erro", "Não foi possível localizar a produção embrionária necessária para esta operação.")
            return
        }

        if (!newNumber) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.")
            return
        }

        try {
            await axios.post(`http://${IPAdress}/embryo/frozen`, {
                productionId,
                embryosQuantity: parseInt(newNumber),
            })
            Alert.alert("Sucesso", "Embriões congelados com sucesso!")
            navigation.goBack()
        } catch (error) {
            const responseData = error?.response?.data
            const message = typeof responseData === 'string'
                ? responseData
                : error?.message || 'Não foi possível registrar os embriões congelados.'
            Alert.alert("Erro", message)
        }
    }

    if (loading) {
        return <ActivityIndicator size="small" color="#092955" />
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Embriões Congelados</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Embriões congelados:</Text>
                <TextInput
                    placeholder="Quantidade de embriões congelados"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={newNumber}
                    style={style.input}
                    onChangeText={(text) => setNumber(text)}
                />
            </View>
            <View>
                <TouchableOpacity
                    style={[style.button, { display: 'flex', flexDirection: 'row', marginLeft: '40%', marginTop: 0 }]}
                    onPress={postFrozenEmbryos}
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, { marginLeft: 5, paddingBottom: 2 }]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
