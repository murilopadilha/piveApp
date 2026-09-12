import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOocyteCollection } from "../../api/oocyteCollectionService";
import { discardEmbryos } from "../../api/embryoService";
import { normalizeApiError } from "../../api/errors";
import EmbryoDispositionForm from '../../features/pive/components/EmbryoDispositionForm';

export default ({ route, navigation }) => {
    const { id } = route.params
    const [newNumber, setNumber] = useState('')
    const [productionId, setProductionId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)
    const activeCollectionIdRef = React.useRef(id)
    const activeProductionIdRef = React.useRef(productionId)
    const productionCollectionIdRef = React.useRef(null)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    activeCollectionIdRef.current = id
    activeProductionIdRef.current = productionId

    React.useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            mutationAbortControllerRef.current?.abort()
            mutationAbortControllerRef.current = null
        }
    }, [])

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
                mutationAbortControllerRef.current?.abort()
                mutationAbortControllerRef.current = null
            }
        }, [id])
    )

    const postDiscardedEmbryos = async () => {
        if (isSubmittingRef.current) return

        if (productionCollectionIdRef.current !== id || !productionId) {
            Alert.alert("Erro", "Não foi possível localizar a produção embrionária necessária para esta operação.")
            return;
        }

        if (!newNumber) {
            Alert.alert("Erro", "Preencha todos os campos")
            return;
        }

        const submittedCollectionId = id
        const submittedProductionId = productionId
        const submittedNumber = newNumber
        const submittedEmbryosQuantity = parseInt(submittedNumber)
        const discardedEmbryosData = {
            productionId: submittedProductionId,
            embryosQuantity: submittedEmbryosQuantity,
        }
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await discardEmbryos(discardedEmbryosData, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeCollectionIdRef.current !== submittedCollectionId ||
                productionCollectionIdRef.current !== submittedCollectionId ||
                activeProductionIdRef.current !== submittedProductionId
            ) return

            Alert.alert("Successo", "Embriões descartados com sucesso!")
            navigation.goBack()
        } catch (requestError) {
            const apiError = normalizeApiError(
                requestError,
                'Não foi possível registrar os embriões descartados.'
            )
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController ||
                activeCollectionIdRef.current !== submittedCollectionId ||
                productionCollectionIdRef.current !== submittedCollectionId ||
                activeProductionIdRef.current !== submittedProductionId
            ) return

            Alert.alert("Erro", apiError.message)
        } finally {
            if (mutationAbortControllerRef.current === abortController) {
                mutationAbortControllerRef.current = null
            }
            isSubmittingRef.current = false
            if (isMountedRef.current) {
                setIsSubmitting(false)
            }
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
                <Text style={[style.titleText, { marginRight: '20%' }]}>Embriões Descartados</Text>
            </View>
            {loading && hasLoaded && (
                <ActivityIndicator size="small" color="#092955" />
            )}
            {error && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {error}
                </Text>
            )}
            <EmbryoDispositionForm
                label="Embriões descartados:"
                placeholder="Quantidade de embriões descartados"
                value={newNumber}
                isSubmitting={isSubmitting}
                onChange={setNumber}
                onSave={postDiscardedEmbryos}
            />
        </SafeAreaView>
    )
}
