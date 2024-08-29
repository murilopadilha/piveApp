import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import axios from "axios";
import style from "../../components/style";
import { SelectList } from 'react-native-dropdown-select-list';
import stylesEmbryos from "../../components/stylesEmbryos";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [viableEmbryos, setViableEmbryos] = useState([])
    const [category, setCategory] = useState('')
    const [receiver, setReceiver] = useState([])
    const [selectedReceiver, setSelectedReceiver] = useState('')
    const [cultivationId, setCultivationId] = useState(null)
    const [embryosRegistered, setEmbryosRegistered] = useState(0)

    const categories = [
        { key: 'true', value: 'Sim' },
        { key: 'false', value: 'Não' },
    ]

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setCategory(selectedCategory.key)
        }
    }

    const handleReceiverSelect = (selectedId) => {
        console.log("Selected Receiver ID:", selectedId)
        const selectedReceiver = receiver.find(rec => rec.id.toString() === selectedId)
        if (selectedReceiver) {
            console.log("Selected Receiver:", selectedReceiver)
            setSelectedReceiver(selectedReceiver.name)
        } else {
            console.log("Receiver not found for ID:", selectedId)
        }
    }

    const fetchEmbryosRegistered = async (cultivationId) => {
        try {
            const response = await axios.get(`http://${IPAdress}/cultivation/${cultivationId}`)
            if (response.data) {
                setEmbryosRegistered(response.data.embryosRegistered)
            }
        } catch (err) {
            console.error("Erro ao buscar embriões registrados:", err.message)
        }
    }

    const fetchReceivers = async () => {
        try {
            const response = await axios.get(`http://${IPAdress}/receiver/available`)
            console.log("Receivers:", response.data)
            setReceiver(response.data)
        } catch (err) {
            console.error(err.message)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/fiv/${fiv.id}`)
                if (Array.isArray(response.data) && response.data.length > 0) {
                    const fetchedData = response.data[0]
                    setData(fetchedData)
                    if (fetchedData.cultivation) {
                        setCultivationId(fetchedData.cultivation.id)
                    }
                } else if (response.data && (response.data.oocyteCollection || response.data.cultivation)) {
                    setData(response.data)
                    if (response.data.cultivation) {
                        setCultivationId(response.data.cultivation.id)
                    }
                } else {
                    setData(null)
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [fiv])

    useEffect(() => {
        if (data && data.cultivation) {
            const embryos = Array.isArray(data.cultivation.viableEmbryos) ? data.cultivation.viableEmbryos : []
            setViableEmbryos(embryos)
        }
    }, [data])

    const openModal = async () => {
        setModalVisible(true)
        if (cultivationId) {
            fetchEmbryosRegistered(cultivationId)
        }
        await fetchReceivers()
    };

    const handleSave = async () => {
        console.log("Cultivation ID:", cultivationId)
        console.log("Category:", category)
        console.log("Selected Receiver:", selectedReceiver)
    
        if (!cultivationId || category === '' || !selectedReceiver) {
            alert("Por favor, preencha todos os campos.")
            return
        }
    
        try {
            const receiverId = receiver.find(rec => rec.name === selectedReceiver)?.id || 0
    
            if (embryosRegistered >= cultivation.viableEmbryos) {
                alert("Todos os embriões desse cultivo já foram registrados.")
                return
            }
    
            const response = await axios.post(`http://${IPAdress}/embryo`, {
                cultivationId: cultivationId,
                frozen: category === 'true',
                receiverCattleId: receiverId
            })
    
            console.log(response)
            await fetchEmbryosRegistered(cultivationId)
    
            setCategory('')
            setSelectedReceiver('')
            setModalVisible(false)
        } catch (err) {
            console.error("Erro ao salvar os dados:", err.message)
        }
    };    

    if (loading) {
        return <ActivityIndicator size="large" color="#092955" />
    }

    if (error) {
        return <Text>Error: {error}</Text>
    }

    const oocyteCollection = data?.oocyteCollection || {}
    const cultivation = data?.cultivation || {}

    return (
        <View style={stylesEmbryos.container}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Informação da FIV</Text>
            </View>
            <ScrollView style={[stylesEmbryos.scrollContainer, { marginHorizontal: 20 }]}>
                <View style={stylesEmbryos.section}>
                    <Text style={stylesEmbryos.sectionTitle}>Coleta dos Oócitos</Text>
                    <View style={stylesEmbryos.infoContainer}>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Data da coleta:</Text>
                            <Text style={stylesEmbryos.value}>{oocyteCollection.date || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Fazenda:</Text>
                            <Text style={stylesEmbryos.value}>{oocyteCollection.farm || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Cliente:</Text>
                            <Text style={stylesEmbryos.value}>{oocyteCollection.client || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Veterinário:</Text>
                            <Text style={stylesEmbryos.value}>{oocyteCollection.veterinarian || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Técnico:</Text>
                            <Text style={stylesEmbryos.value}>{oocyteCollection.technical || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Doadora:</Text>
                            <Text style={stylesEmbryos.value}>
                                {oocyteCollection.donorCattle ? `${oocyteCollection.donorCattle.name} (${oocyteCollection.donorCattle.registrationNumber})` : '-'}
                            </Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Touro:</Text>
                            <Text style={stylesEmbryos.value}>
                                {oocyteCollection.bull ? `${oocyteCollection.bull.name} (${oocyteCollection.bull.registrationNumber})` : '-'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[stylesEmbryos.sectionTitle, stylesEmbryos.oocytesTitle]}>Oócitos:</Text>
                    <View style={stylesEmbryos.oocytesContainer}>
                        <View style={stylesEmbryos.oocytesRow}>
                            <View style={stylesEmbryos.oocytesItem}>
                                <Text style={stylesEmbryos.label}>Total:</Text>
                                <Text style={stylesEmbryos.value}>{oocyteCollection.totalOocytes || '-'}</Text>
                            </View>
                            <View style={stylesEmbryos.oocytesItem}>
                                <Text style={stylesEmbryos.label}>Viáveis:</Text>
                                <Text style={stylesEmbryos.value}>{oocyteCollection.viableOocytes || '-'}</Text>
                            </View>
                            <View style={stylesEmbryos.oocytesItem}>
                                <Text style={stylesEmbryos.label}>Inviáveis:</Text>
                                <Text style={stylesEmbryos.value}>{oocyteCollection.nonViableOocytes || '-'}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={[stylesEmbryos.sectionTitle, stylesEmbryos.cultivationTitle]}>Cultivo</Text>
                    <View style={stylesEmbryos.cultivationContainer}>
                        <View style={stylesEmbryos.cultivationItem}>
                            <Text style={stylesEmbryos.label}>Total de Embriões:</Text>
                            <Text style={stylesEmbryos.value}>{cultivation.totalEmbryos || '-'}</Text>
                        </View>
                        <TouchableOpacity
                            style={stylesEmbryos.cultivationItem}
                            onPress={openModal}
                        >
                            <Text style={[stylesEmbryos.label, { textDecorationLine: 'underline' }]}>Embriões Viáveis:</Text>
                            <Text style={stylesEmbryos.value}>{cultivation.viableEmbryos || '-'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{display: 'flex', flexDirection: 'row'}}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('EmbrioesViaveis', { cultivationId: cultivationId })}
                        style={[style.listButtonEdit, { marginTop: 0, marginLeft: 25, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                    >
                        <FontAwesome6 name="clipboard-list" size={20} color="#E0E0E0" />
                        <Text style={{ color: '#E0E0E0', paddingTop: 1, paddingLeft: 5 }}>Embriões</Text>
                    </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ColetaOocitos', { fiv: fiv })}
                            style={[style.listButtonEdit, { marginTop: 0, marginLeft: 100, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                        >
                            <Octicons name="pencil" size={20} color="#E0E0E0" />
                            <Text style={{ color: '#E0E0E0', paddingTop: 1 }}>Registrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <Modal
                transparent={true}
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={stylesEmbryos.modalContainer}>
                    <View style={stylesEmbryos.modalContent}>
                        <Text style={stylesEmbryos.modalTitle}>Gerenciar Embriões Viáveis</Text>
                        <Text style={stylesEmbryos.modalSubtitle}>Registro {embryosRegistered}/{cultivation.viableEmbryos || '-'}</Text>
                        <View style={stylesEmbryos.optionContainer}>
                            <Text style={{ textAlign: 'center' }}>Congelado: </Text>
                            <SelectList
                                setSelected={handleSelect}
                                data={categoryData}
                                placeholder={"Clique"}
                                boxStyles={[style.selectListBox, { marginBottom: 30, zIndex: 2, width: 73, paddingLeft: 4, marginLeft: 90 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown, { zIndex: 3, zIndex: 10, elevation: 10, position: 'absolute', marginTop: 10, marginLeft: 90 }]}
                            />
                            <Text style={{ textAlign: 'center' }}>Receptora: </Text>
                            <SelectList
                                setSelected={handleReceiverSelect}
                                data={receiver.map(rec => ({
                                    key: rec.id.toString(),
                                    value: rec.name
                                }))}
                                placeholder={"Selecione a receptora"}
                                boxStyles={[style.selectListBox, { marginBottom: 15, zIndex: 2, marginLeft: 15 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown, { zIndex: 3, zIndex: 10, elevation: 10, position: 'absolute', marginTop: 60, width: 235, marginLeft: 15 }]}
                            />
                        </View>
                        <View style={stylesEmbryos.buttonContainer}>
                            <TouchableOpacity
                                style={stylesEmbryos.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={stylesEmbryos.closeButtonText}>Fechar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={stylesEmbryos.navigationButton}
                                onPress={handleSave}
                            >
                                <Text style={stylesEmbryos.navigationButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
