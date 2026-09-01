import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import Octicons from '@expo/vector-icons/Octicons';
import { SafeAreaView } from "react-native-safe-area-context";
import {
    deleteReceiver,
    listReceivers,
    searchReceivers,
} from "../../api/receiverService";
import { normalizeApiError } from "../../api/errors";

export default ({ navigation }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [registrationNumber, setRegistrationNumber] = useState('')
    const loadingRef = React.useRef(false)
    const pendingLoadRef = React.useRef(null)

    useFocusEffect(
        React.useCallback(() => {
            const debounceTimer = setTimeout(() => {
                loadApi(registrationNumber)
            }, 500)

            return () => {
                clearTimeout(debounceTimer);
                pendingLoadRef.current = null
            }
        }, [registrationNumber])
    )

    async function loadApi(query = '') {
        if (loadingRef.current) {
            pendingLoadRef.current = () => loadApi(query)
            return
        }

        loadingRef.current = true
        setLoading(true)

        try {
            if (query) {
                const receivers = await searchReceivers(query)
                setData(receivers);
            } else {
                const receivers = await listReceivers()
                setData(receivers)
            }
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as receptoras.')
            if (apiError.isCanceled) return
            console.error(apiError.message)
        } finally {
            loadingRef.current = false
            const pendingLoad = pendingLoadRef.current
            pendingLoadRef.current = null

            if (pendingLoad) {
                pendingLoad()
            } else {
                setLoading(false)
            }
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
            await deleteReceiver(id);
            setData(data.filter(item => item.id !== id));
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir a receptora.')
            if (apiError.isCanceled) return
            console.error("Erro ao deletar o item:", apiError.message);
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
                <Text style={style.titleText}>Receptoras cadastradas</Text>
            </View>
            <View style={style.contentList}>
                <View style={style.search}>
                    <TextInput
                        placeholder="Número de registro"
                        placeholderTextColor="#888"
                        value={registrationNumber}
                        style={[style.input, {width: 340}]}
                        onChangeText={setRegistrationNumber}
                    />
                </View>
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
            <View style={{alignSelf: 'center'}}>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Nome: </Text>
                    {data.name} ({data.breed})
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
                    style={[style.listButtonDelete, { marginTop: 3 }]}
                    onPress={() => navigation.navigate('EditarReceptora', { donor: data })}
                >
                    <Octicons name="pencil" size={20} color="#908D8E" />
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
