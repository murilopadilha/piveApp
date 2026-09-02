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
    const [loadError, setLoadError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [deletingReceiverIds, setDeletingReceiverIds] = useState([])
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const registrationNumberRef = React.useRef(registrationNumber)
    const deletingReceiverIdsRef = React.useRef(new Set())
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    registrationNumberRef.current = registrationNumber

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
        }
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            const debounceTimer = setTimeout(() => {
                loadApi(registrationNumber)
            }, 500)

            return () => {
                isScreenFocusedRef.current = false
                clearTimeout(debounceTimer);
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [registrationNumber])
    )

    async function loadApi(query = '') {
        if (!isScreenFocusedRef.current) return

        abortControllerRef.current?.abort()
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        const requestId = ++requestIdRef.current

        setLoading(true)

        try {
            let receivers
            if (query) {
                receivers = await searchReceivers(query, {
                    signal: abortController.signal,
                })
            } else {
                receivers = await listReceivers({ signal: abortController.signal })
            }

            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return

            setData(receivers)
            setLoadError(null)
            setHasLoaded(true)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível carregar as receptoras.')
            if (apiError.isCanceled) return
            if (
                requestId !== requestIdRef.current ||
                !isScreenFocusedRef.current
            ) return
            console.error(apiError.message)
            setLoadError(apiError.message)
            setHasLoaded(true)
        } finally {
            if (requestId === requestIdRef.current) {
                abortControllerRef.current = null
                if (isScreenFocusedRef.current) {
                    setLoading(false)
                }
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
        if (deletingReceiverIdsRef.current.has(id)) return

        deletingReceiverIdsRef.current.add(id)
        setDeletingReceiverIds(Array.from(deletingReceiverIdsRef.current))

        try {
            await deleteReceiver(id);

            if (!isScreenFocusedRef.current) return

            await loadApi(registrationNumberRef.current)
        } catch (error) {
            const apiError = normalizeApiError(error, 'Não foi possível excluir a receptora.')
            if (apiError.isCanceled) return
            if (!isMountedRef.current || !isScreenFocusedRef.current) return
            console.error("Erro ao deletar o item:", apiError.message);
        } finally {
            deletingReceiverIdsRef.current.delete(id)
            if (isMountedRef.current) {
                setDeletingReceiverIds(Array.from(deletingReceiverIdsRef.current))
            }
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
                {loadError && (
                    <Text style={{ color: '#B00020', marginHorizontal: 20, marginTop: 5 }}>
                        {loadError}
                    </Text>
                )}
                <FlatList
                    showsVerticalScrollIndicator={false}
                    style={{ marginTop: 5 }}
                    contentContainerStyle={{ marginHorizontal: 20, paddingBottom: 300 }}
                    data={data}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                        <ListItem
                            data={item}
                            isDeleting={deletingReceiverIds.includes(item.id)}
                            onRemove={confirmRemove}
                            navigation={navigation}
                        />
                    )}
                    ListEmptyComponent={
                        !hasLoaded || loading ? (
                            <ActivityIndicator size={25} color="#092955" />
                        ) : loadError ? null : (
                            <Text style={{ textAlign: 'center', marginTop: 10 }}>
                                Nenhuma receptora encontrada.
                            </Text>
                        )
                    }
                    ListFooterComponent={<FooterList load={loading && data.length > 0} />}
                />
            </View>
        </SafeAreaView>
    )
}

function ListItem({ data, isDeleting, onRemove, navigation }) {
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
                    disabled={isDeleting}
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
