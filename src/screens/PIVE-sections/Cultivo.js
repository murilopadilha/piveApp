import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput, AppState } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { listFivs } from "../../api/fivService";
import {
    createEmbryoProduction,
    getOocyteCollection,
} from "../../api/oocyteCollectionService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { oocyteCollectionId } = route.params
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [totalEmbryos, setTotalEmbryos] = useState('')
    const [fivData, setFivData] = useState(null)
    const isScreenFocusedRef = React.useRef(false)
    const isPollingActiveRef = React.useRef(false)
    const appStateRef = React.useRef(AppState.currentState)
    const pollingTimeoutRef = React.useRef(null)
    const pollingAbortControllerRef = React.useRef(null)
    const pollingRequestIdRef = React.useRef(0)
    const activeOocyteCollectionIdRef = React.useRef(oocyteCollectionId)
    const draftContextIdRef = React.useRef(null)
    const draftInitializedIdRef = React.useRef(null)
    const isDraftDirtyRef = React.useRef(false)
    const totalEmbryosRef = React.useRef(totalEmbryos)
    const restartPollingRef = React.useRef(null)

    activeOocyteCollectionIdRef.current = oocyteCollectionId
    totalEmbryosRef.current = totalEmbryos

    useFocusEffect(
        React.useCallback(() => {
            const currentOocyteCollectionId = oocyteCollectionId

            isScreenFocusedRef.current = true
            appStateRef.current = AppState.currentState
            isPollingActiveRef.current = AppState.currentState === 'active'

            if (draftContextIdRef.current !== currentOocyteCollectionId) {
                draftContextIdRef.current = currentOocyteCollectionId
                draftInitializedIdRef.current = null
                isDraftDirtyRef.current = false
                totalEmbryosRef.current = ''
                setTotalEmbryos('')
                setData(null)
                setFivData(null)
                setError(null)
                setLoading(true)
            }

            function scheduleNextPoll() {
                if (
                    !isPollingActiveRef.current ||
                    !isScreenFocusedRef.current ||
                    appStateRef.current !== 'active' ||
                    activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                ) return

                pollingTimeoutRef.current = setTimeout(() => {
                    pollingTimeoutRef.current = null
                    runPollingCycle()
                }, 3000)
            }

            async function runPollingCycle() {
                if (
                    !isPollingActiveRef.current ||
                    !isScreenFocusedRef.current ||
                    appStateRef.current !== 'active' ||
                    activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                ) return

                const abortController = new AbortController()
                pollingAbortControllerRef.current = abortController
                const requestId = ++pollingRequestIdRef.current

                try {
                    const fivList = await listFivs({ signal: abortController.signal })

                    if (
                        requestId !== pollingRequestIdRef.current ||
                        !isPollingActiveRef.current ||
                        !isScreenFocusedRef.current ||
                        appStateRef.current !== 'active' ||
                        activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                    ) return

                    const foundFiv = fivList.find(fiv =>
                        fiv.oocyteCollections.some(oocyteCollection =>
                            oocyteCollection.id === currentOocyteCollectionId
                        )
                    )

                    let oocyteCollectionData = null
                    if (foundFiv) {
                        oocyteCollectionData = await getOocyteCollection(
                            currentOocyteCollectionId,
                            { signal: abortController.signal }
                        )
                    }

                    if (
                        requestId !== pollingRequestIdRef.current ||
                        !isPollingActiveRef.current ||
                        !isScreenFocusedRef.current ||
                        appStateRef.current !== 'active' ||
                        activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                    ) return

                    setFivData(foundFiv)

                    if (foundFiv) {
                        setData(oocyteCollectionData)

                        const serverTotalEmbryos =
                            oocyteCollectionData.embryoProduction?.totalEmbryos ?? ''

                        if (
                            draftInitializedIdRef.current !== currentOocyteCollectionId ||
                            !isDraftDirtyRef.current
                        ) {
                            draftInitializedIdRef.current = currentOocyteCollectionId
                            totalEmbryosRef.current = serverTotalEmbryos
                            setTotalEmbryos(serverTotalEmbryos)
                        }
                    }

                    setError(null)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar os dados do cultivo.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== pollingRequestIdRef.current ||
                        !isPollingActiveRef.current ||
                        !isScreenFocusedRef.current ||
                        appStateRef.current !== 'active' ||
                        activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                    ) return
                    setError(apiError.message)
                } finally {
                    if (requestId === pollingRequestIdRef.current) {
                        pollingAbortControllerRef.current = null
                        if (
                            isPollingActiveRef.current &&
                            isScreenFocusedRef.current &&
                            appStateRef.current === 'active' &&
                            activeOocyteCollectionIdRef.current === currentOocyteCollectionId
                        ) {
                            setLoading(false)
                            scheduleNextPoll()
                        }
                    }
                }
            }

            function restartPolling() {
                if (
                    !isPollingActiveRef.current ||
                    !isScreenFocusedRef.current ||
                    appStateRef.current !== 'active' ||
                    activeOocyteCollectionIdRef.current !== currentOocyteCollectionId
                ) return

                if (pollingTimeoutRef.current) {
                    clearTimeout(pollingTimeoutRef.current)
                    pollingTimeoutRef.current = null
                }

                pollingRequestIdRef.current += 1
                pollingAbortControllerRef.current?.abort()
                pollingAbortControllerRef.current = null
                runPollingCycle()
            }

            restartPollingRef.current = restartPolling

            const handleAppStateChange = (nextAppState) => {
                const wasActive = appStateRef.current === 'active'
                appStateRef.current = nextAppState

                if (nextAppState !== 'active') {
                    isPollingActiveRef.current = false
                    if (pollingTimeoutRef.current) {
                        clearTimeout(pollingTimeoutRef.current)
                        pollingTimeoutRef.current = null
                    }
                    pollingRequestIdRef.current += 1
                    pollingAbortControllerRef.current?.abort()
                    pollingAbortControllerRef.current = null
                    return
                }

                if (!isScreenFocusedRef.current || wasActive) return

                isPollingActiveRef.current = true
                runPollingCycle()
            }

            const appStateSubscription = AppState.addEventListener(
                'change',
                handleAppStateChange
            )

            if (isPollingActiveRef.current) {
                runPollingCycle()
            }

            return () => {
                isScreenFocusedRef.current = false
                isPollingActiveRef.current = false
                restartPollingRef.current = null

                if (pollingTimeoutRef.current) {
                    clearTimeout(pollingTimeoutRef.current)
                    pollingTimeoutRef.current = null
                }

                pollingRequestIdRef.current += 1
                pollingAbortControllerRef.current?.abort()
                pollingAbortControllerRef.current = null
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
        const submittedOocyteCollectionId = oocyteCollectionId
        const submittedTotalEmbryos = totalEmbryos

        try {
            await createEmbryoProduction({
                oocyteCollectionId: submittedOocyteCollectionId,
                totalEmbryos: submittedTotalEmbryos,
            })

            if (
                activeOocyteCollectionIdRef.current !== submittedOocyteCollectionId
            ) return

            Alert.alert('Sucesso', 'Total de embriões salvo com sucesso!')

            if (totalEmbryosRef.current === submittedTotalEmbryos) {
                isDraftDirtyRef.current = false
                draftInitializedIdRef.current = submittedOocyteCollectionId
                restartPollingRef.current?.()
            }
        } catch (saveError) {
            const apiError = normalizeApiError(saveError, 'Ocorreu um erro')
            if (apiError.isCanceled) return
            Alert.alert('Erro', apiError.message)
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
                        <TouchableOpacity onPress={handleSave}
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
