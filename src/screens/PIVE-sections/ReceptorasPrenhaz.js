import React, { useState } from "react";
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { IPAdress } from "../../components/APIip";
import { listPregnantReceivers } from "../../api/receiverService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const baseURL = `http://${IPAdress}/receiver/pregnant`
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            loadApi()

            return () => {
                isScreenFocusedRef.current = false
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [])
    )

    async function loadApi() {
        if (!isScreenFocusedRef.current) return

        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true)

        try {
            const pregnantReceivers = await listPregnantReceivers({
                signal: abortController.signal,
            })

            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setData(pregnantReceivers);
            setHasLoaded(true)
            setError(null)
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Não foi possível carregar as receptoras prenhas.'
            )
            if (apiError.isCanceled) return
            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            setError(apiError.message)
            console.error(apiError.message);
        } finally {
            if (requestId === requestIdRef.current) {
                abortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setLoading(false);
                }
            }
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

    if (loading && !hasLoaded) {
        return <ActivityIndicator size={25} color="#092955" />
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
            {error && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {error}
                </Text>
            )}
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
                    ListEmptyComponent={
                        !loading && hasLoaded && !error ? (
                            <Text style={{ textAlign: 'center', marginTop: 10 }}>
                                Nenhuma receptora prenha encontrada.
                            </Text>
                        ) : null
                    }
                    ListFooterComponent={<FooterList load={loading && hasLoaded} />}
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
                    {data?.name || '-'} ({data?.registrationNumber || '-'})
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Raça: </Text>
                    {data?.breed || '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Dia de Transferência: </Text>
                    {data?.pregnancy?.transferDay ?? '-'}
                </Text>
                <Text style={style.listText}>
                    <Text style={{ fontWeight: 'bold' }}>Ano de Gestação: </Text>
                    {data?.pregnancy?.gestationalAge ?? '-'}
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
