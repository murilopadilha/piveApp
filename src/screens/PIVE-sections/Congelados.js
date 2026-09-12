import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import EmbryoDispositionForm from '../../features/pive/components/EmbryoDispositionForm';
import useEmbryoProductionContext from '../../features/pive/hooks/useEmbryoProductionContext';
import useFrozenEmbryoSubmission from '../../features/pive/hooks/useFrozenEmbryoSubmission';

export default ({ route, navigation }) => {
    const { id } = route.params
    const [newNumber, setNumber] = useState('')
    const handleLoadError = React.useCallback((message) => {
        Alert.alert("Erro", message)
    }, [])
    const {
        productionId,
        loadedCollectionId,
        loading,
        error,
        hasLoaded,
    } = useEmbryoProductionContext({
        collectionId: id,
        onLoadError: handleLoadError,
    })
    const {
        isSubmitting,
        submitFrozenEmbryos,
    } = useFrozenEmbryoSubmission({
        collectionId: id,
        productionId,
        loadedCollectionId,
    })

    const postFrozenEmbryos = async () => {
        if (loadedCollectionId !== id || !productionId) {
            Alert.alert("Erro", "Não foi possível localizar a produção embrionária necessária para esta operação.")
            return
        }

        if (!newNumber) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.")
            return
        }

        const submittedCollectionId = id
        const submittedProductionId = productionId
        const submittedNumber = newNumber
        const submittedEmbryosQuantity = parseInt(submittedNumber)
        const frozenEmbryosData = {
            productionId: submittedProductionId,
            embryosQuantity: submittedEmbryosQuantity,
        }
        await submitFrozenEmbryos({
            payload: frozenEmbryosData,
            submittedCollectionId,
            onSuccess: () => {
                Alert.alert("Sucesso", "Embriões congelados com sucesso!")
                navigation.goBack()
            },
            onError: (message) => {
                Alert.alert("Erro", message)
            },
        })
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
            <EmbryoDispositionForm
                label="Embriões congelados:"
                placeholder="Quantidade de embriões congelados"
                value={newNumber}
                isSubmitting={isSubmitting}
                onChange={setNumber}
                onSave={postFrozenEmbryos}
            />
        </SafeAreaView>
    )
}
