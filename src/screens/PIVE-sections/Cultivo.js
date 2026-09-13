import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, AppState } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { createEmbryoProduction } from "../../api/oocyteCollectionService";
import { normalizeApiError } from "../../api/errors";
import CultivationDraftForm from '../../features/pive/components/CultivationDraftForm';
import CultivationSummary from '../../features/pive/components/CultivationSummary';
import useCultivationSession from '../../features/pive/hooks/useCultivationSession';
import piveStyles from '../../features/pive/styles';

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
    const draftInitializedIdRef = React.useRef(null)
    const isDraftDirtyRef = React.useRef(false)
    const totalEmbryosRef = React.useRef(totalEmbryos)

    const handleSessionContextReset = React.useCallback(() => {
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

    const handleBack = () => {
        if (fivData) {
            navigation.navigate('Embrioes', { fiv: fivData })
            return
        }

        navigation.goBack()
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
            <View style={[style.divTitle, piveStyles.sectionHeader]}>
                <TouchableOpacity onPress={handleBack}>
                    <View style={piveStyles.backButton}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, piveStyles.sectionTitle]}>Total de Embriões</Text>
            </View>
            {error && (
                <Text style={piveStyles.loadError}>
                    Error: {error}
                </Text>
            )}
            <View style={{ padding: 20 }}>
                {data?.embryoProduction?.totalEmbryos !== undefined &&
                !isDraftDirtyRef.current ? (
                    <CultivationSummary
                        embryoProduction={data.embryoProduction}
                        onOpenDiscarded={() => navigation.navigate('Descartados', { id: oocyteCollectionId })}
                        onOpenFrozen={() => navigation.navigate('Congelados', { id: oocyteCollectionId })}
                        onOpenTransferred={() => navigation.navigate('Transferidos', { fiv: fivData, id: oocyteCollectionId })}
                    />
                ) : (
                    <CultivationDraftForm
                        value={totalEmbryos}
                        isSubmitting={isSubmitting}
                        onChange={handleTotalEmbryosChange}
                        onSave={handleSave}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}
