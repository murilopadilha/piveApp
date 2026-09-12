import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput, AppState } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createEmbryoProduction } from "../../api/oocyteCollectionService";
import { normalizeApiError } from "../../api/errors";
import useCultivationSession from '../../features/pive/hooks/useCultivationSession';

export default ({ route, navigation }) => {
    const { oocyteCollectionId } = route.params
    const [totalEmbryos, setTotalEmbryos] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isMountedRef = React.useRef(true)
    const isScreenFocusedRef = React.useRef(false)
    const isSubmittingRef = React.useRef(false)
    const mutationAbortControllerRef = React.useRef(null)
    const appStateRef = React.useRef(AppState.currentState)
    const activeOocyteCollectionIdRef = React.useRef(oocyteCollectionId)
    const draftContextIdRef = React.useRef(null)
    const draftInitializedIdRef = React.useRef(null)
    const isDraftDirtyRef = React.useRef(false)
    const totalEmbryosRef = React.useRef(totalEmbryos)

    const handleSessionContextReset = React.useCallback((currentOocyteCollectionId) => {
        draftContextIdRef.current = currentOocyteCollectionId
        draftInitializedIdRef.current = null
        isDraftDirtyRef.current = false
        totalEmbryosRef.current = ''
        setTotalEmbryos('')
    }, [])

    const handleServerTotalEmbryos = React.useCallback((
        currentOocyteCollectionId,
        serverTotalEmbryos
    ) => {
        if (
            draftInitializedIdRef.current !== currentOocyteCollectionId ||
            !isDraftDirtyRef.current
        ) {
            draftInitializedIdRef.current = currentOocyteCollectionId
            totalEmbryosRef.current = serverTotalEmbryos
            setTotalEmbryos(serverTotalEmbryos)
        }
    }, [])

    const {
        data,
        loading,
        error,
        fivData,
        restartPolling,
    } = useCultivationSession({
        oocyteCollectionId,
        onSessionContextReset: handleSessionContextReset,
        onServerTotalEmbryos: handleServerTotalEmbryos,
    })

    activeOocyteCollectionIdRef.current = oocyteCollectionId
    totalEmbryosRef.current = totalEmbryos

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
            isScreenFocusedRef.current = true
            appStateRef.current = AppState.currentState

            const handleAppStateChange = (nextAppState) => {
                appStateRef.current = nextAppState

                if (nextAppState !== 'active') {
                    mutationAbortControllerRef.current?.abort()
                    mutationAbortControllerRef.current = null
                }
            }

            const appStateSubscription = AppState.addEventListener(
                'change',
                handleAppStateChange
            )

            return () => {
                isScreenFocusedRef.current = false
                mutationAbortControllerRef.current?.abort()
                mutationAbortControllerRef.current = null
                appStateSubscription.remove()
            }
        }, [oocyteCollectionId])
    )

    const handleTotalEmbryosChange = (value) => {
        isDraftDirtyRef.current = true
        totalEmbryosRef.current = value
        setTotalEmbryos(value)
    }

    const handleSave = async () => {
        if (isSubmittingRef.current) return

        const submittedOocyteCollectionId = oocyteCollectionId
        const submittedTotalEmbryos = totalEmbryos
        const payload = {
            oocyteCollectionId: submittedOocyteCollectionId,
            totalEmbryos: submittedTotalEmbryos,
        }
        const abortController = new AbortController()

        isSubmittingRef.current = true
        mutationAbortControllerRef.current = abortController
        setIsSubmitting(true)

        try {
            await createEmbryoProduction(payload, {
                signal: abortController.signal,
            })

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                appStateRef.current !== 'active' ||
                mutationAbortControllerRef.current !== abortController ||
                activeOocyteCollectionIdRef.current !== submittedOocyteCollectionId
            ) return

            Alert.alert('Sucesso', 'Total de embriões salvo com sucesso!')

            if (totalEmbryosRef.current === submittedTotalEmbryos) {
                isDraftDirtyRef.current = false
                draftInitializedIdRef.current = submittedOocyteCollectionId
                restartPolling()
            }
        } catch (saveError) {
            const apiError = normalizeApiError(saveError, 'Ocorreu um erro')
            if (apiError.isCanceled) return
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                appStateRef.current !== 'active' ||
                mutationAbortControllerRef.current !== abortController ||
                activeOocyteCollectionIdRef.current !== submittedOocyteCollectionId
            ) return

            Alert.alert('Erro', apiError.message)
        } finally {
            const hasNewerMutation =
                mutationAbortControllerRef.current !== null &&
                mutationAbortControllerRef.current !== abortController

            if (!hasNewerMutation) {
                if (mutationAbortControllerRef.current === abortController) {
                    mutationAbortControllerRef.current = null
                }
                isSubmittingRef.current = false
                if (isMountedRef.current) {
                    setIsSubmitting(false)
                }
            }
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={style.menu}>
                <ActivityIndicator size="small" color="#092955" />
            </SafeAreaView>
        )
    }

    if (error && !data) {
        return (
            <SafeAreaView style={style.menu}>
                <Text>Error: {error}</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Embrioes', { fiv: fivData })}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Total de Embriões</Text>
            </View>
            {error && (
                <Text style={{ color: '#B00020', marginHorizontal: 20 }}>
                    Error: {error}
                </Text>
            )}
            <View style={{ padding: 20 }}>
                {data?.embryoProduction?.totalEmbryos !== undefined &&
                !isDraftDirtyRef.current ? (
                    <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={[style.text, { fontWeight: 'bold' }]}>Total de Embriões:</Text>
                                <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{data.embryoProduction.totalEmbryos}</Text>
                            </View>
                            <View>
                                <Text style={[style.text, { fontWeight: 'bold' }]}>Embriões registrados:</Text>
                                <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{data.embryoProduction.embryosRegistered}/{data.embryoProduction.totalEmbryos}</Text>
                            </View>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '10%' }}>
                            <View>
                                <Text style={[style.text, { fontWeight: 'bold' }]}>Transferidos:</Text>
                                <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{data.embryoProduction.numberTransferredEmbryos}</Text>
                            </View>
                            <View>
                                <Text style={[style.text, { fontWeight: 'bold' }]}>Congelados:</Text>
                                <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{data.embryoProduction.numberFrozenEmbryos}</Text>
                            </View>
                            <View>
                                <Text style={[style.text, { fontWeight: 'bold' }]}>Descartados:</Text>
                                <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{data.embryoProduction.numberDiscardedEmbryos}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: '20%' }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Descartados', { id: oocyteCollectionId })}
                        style={[style.listButtonSearch, { width: '30%', paddingLeft: '0%', paddingBottom: '2%' }]}>
                        <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Descartados</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Congelados', { id: oocyteCollectionId })}
                        style={[style.listButtonSearch, { width: '30%' }]}>
                        <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Congelados</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Transferidos', { fiv: fivData, id: oocyteCollectionId })}
                        style={[style.listButtonSearch, { width: '30%', paddingLeft: '0%', paddingBottom: '2%' }]}>
                        <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Transferidos</Text>
                    </TouchableOpacity>
                </View>
                    </View>
                ) : (
                    <View>
                        <TextInput
                            style={style.input}
                            value={totalEmbryos}
                            placeholderTextColor={"#888"}
                            onChangeText={handleTotalEmbryosChange}
                            keyboardType="numeric"
                            placeholder="Digite o total de embriões"
                        />
                        <TouchableOpacity onPress={handleSave} disabled={isSubmitting}
                            style={[style.listButtonSearch, { width: '30%', height: '28%', display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '60%' }]}>
                            <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}
