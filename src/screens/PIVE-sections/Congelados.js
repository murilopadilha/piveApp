import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IPAdress } from "../../components/APIip";
import { getOocyteCollection } from "../../api/oocyteCollectionService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { id } = route.params
    const [newNumber, setNumber] = useState('')
    const [productionId, setProductionId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const activeCollectionIdRef = React.useRef(id)
    const productionCollectionIdRef = React.useRef(null)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    activeCollectionIdRef.current = id

    useFocusEffect(
        React.useCallback(() => {
            const currentCollectionId = id
            isScreenFocusedRef.current = true

            if (productionCollectionIdRef.current !== currentCollectionId) {
                productionCollectionIdRef.current = null
                setProductionId(null)
                setError(null)
                setHasLoaded(false)
                setLoading(true)
            }

            const fetchData = async () => {
                abortControllerRef.current?.abort()
                const abortController = new AbortController()
                abortControllerRef.current = abortController
                const requestId = ++requestIdRef.current

                setLoading(true)

                try {
                    const responseData = await getOocyteCollection(currentCollectionId, {
                        signal: abortController.signal,
                    })
                    const fetchedProductionId = responseData?.embryoProduction?.id

                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeCollectionIdRef.current !== currentCollectionId
                    ) return

                    setProductionId(fetchedProductionId ?? null)
                    productionCollectionIdRef.current = currentCollectionId
                    setHasLoaded(true)
                    setError(null)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar os dados da coleta.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeCollectionIdRef.current !== currentCollectionId
                    ) return
                    setError(apiError.message)
                    Alert.alert("Erro", apiError.message)
                } finally {
                    if (requestId === requestIdRef.current) {
                        abortControllerRef.current = null
                        if (
                            isScreenFocusedRef.current &&
                            activeCollectionIdRef.current === currentCollectionId
                        ) {
                            setLoading(false)
                        }
                    }
                }
            }

            fetchData()

            return () => {
                isScreenFocusedRef.current = false
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [id])
    )

    const postFrozenEmbryos = async () => {
        if (productionCollectionIdRef.current !== id || !productionId) {
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

    if (loading && !hasLoaded) {
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
            {loading && hasLoaded && (
                <ActivityIndicator size="small" color="#092955" />
            )}
            {error && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {error}
                </Text>
            )}
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
