import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { oocyteCollectionId } = route.params
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [totalEmbryos, setTotalEmbryos] = useState('')
    const [fivData, setFivData] = useState(null)

    const fetchFivData = async () => {
        try {
            const fivResponse = await axios.get(`http://${IPAdress}/fiv`)
            const fivList = fivResponse.data

            const foundFiv = fivList.find(fiv => 
                fiv.oocyteCollections.some(oocyteCollection => oocyteCollection.id === oocyteCollectionId)
            )

            setFivData(foundFiv)

            if (foundFiv) {
                const response = await axios.get(`http://${IPAdress}/oocyte-collection/${oocyteCollectionId}`)
                setData(response.data)
                setTotalEmbryos(response.data.embryoProduction?.totalEmbryos || '')
            }
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFivData()

        const intervalId = setInterval(() => {
            fetchFivData()
        }, 3000)

        return () => clearInterval(intervalId)
    }, [oocyteCollectionId])

    const handleSave = async () => {
        try {
            await axios.post(`http://${IPAdress}/production`, {
                oocyteCollectionId,
                totalEmbryos,
            })
            Alert.alert('Sucesso', 'Total de embriões salvo com sucesso!')
        } catch (error) {
            Alert.alert('Erro', error.response?.data || 'Ocorreu um erro')
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={style.menu}>
                <ActivityIndicator size="small" color="#092955" />
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={style.menu}>
                <Text>Error: {error.message}</Text>
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
            <View style={{ padding: 20 }}>
                {data?.embryoProduction?.totalEmbryos !== undefined ? (
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
                            onChangeText={setTotalEmbryos}
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
