import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, FlatList, Modal } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from "axios";
import style from "../../components/style";
import stylesEmbryos from "../../components/stylesEmbryos";
import { SelectList } from 'react-native-dropdown-select-list';

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { cultivationId } = route.params

    const [embryos, setEmbryos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [receiver, setReceiver] = useState([])
    const [embryosRegistered, setEmbryosRegistered] = useState(0)
    const [selectedReceiver, setSelectedReceiver] = useState('')
    const [category, setCategory] = useState('')
    const [selectedEmbryoId, setSelectedEmbryoId] = useState(null)

    const categories = [
        { key: 'true', value: 'Sim' },
        { key: 'false', value: 'Não' },
    ]

    useEffect(() => {
        const fetchEmbryos = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/cultivation/${cultivationId}`)
                console.log("Embryos data:", response.data.embryos)
                if (response.data && Array.isArray(response.data.embryos)) {
                    setEmbryos(response.data.embryos)
                } else {
                    console.warn("Embryos data is not an array or is empty.")
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchEmbryos()
    }, [cultivationId])

    const fetchReceivers = async () => {
        try {
            const response = await axios.get(`http://${IPAdress}/receiver/available`);
            console.log("Receivers:", response.data);
            setReceiver(response.data)
        } catch (err) {
            console.error(err.message)
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

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const openModal = async (embryoId) => {
        setModalVisible(true)
        setSelectedEmbryoId(embryoId)
        if (cultivationId) {
            fetchEmbryosRegistered(cultivationId);
        }
        await fetchReceivers()
    };

    const handleSave = async () => {
        console.log("Cultivation ID:", cultivationId)
        console.log("Category:", category)
        console.log("Selected Receiver:", selectedReceiver)

        if (!cultivationId || category === '' || !selectedReceiver || selectedEmbryoId === null) {
            alert("Por favor, preencha todos os campos.")
            return
        }

        try {
            const receiverId = receiver.find(rec => rec.name === selectedReceiver)?.id || 0

            const response = await axios.put(`http://${IPAdress}/embryo/${selectedEmbryoId}`, {
                cultivationId: cultivationId,
                frozen: category === 'true',
                receiverCattleId: receiverId
            })

            console.log(response);
            await fetchEmbryosRegistered(cultivationId)

            setCategory('')
            setSelectedReceiver('')
            setModalVisible(false)
        } catch (err) {
            console.error("Erro ao salvar os dados:", err.message)
        }
    }

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey);
        if (selectedCategory) {
            setCategory(selectedCategory.key);
        }
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => openModal(item.id)}>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>ID:</Text>
                <Text style={styles.itemText}>{item.id}</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>Touro:</Text>
                <Text style={styles.itemText}>{item.bull.name} ({item.bull.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={[styles.boldText, { textDecorationLine: 'underline' }]}>Doadora:</Text>
                <Text style={styles.itemText}>{item.donorCattle.name} ({item.donorCattle.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={styles.boldText}>Receptora:</Text>
                <Text style={styles.itemText}>{item.receiverCattle.name} ({item.receiverCattle.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={[styles.boldText, { textDecorationLine: 'underline' }]}>Congelado:</Text>
                <Text style={styles.itemText}>{item.frozen ? 'Sim' : 'Não'}</Text>
            </View>
        </TouchableOpacity>
    )

    if (loading) {
        return <ActivityIndicator size="large" color="#092955" />
    }

    if (error) {
        return <Text>Error: {error}</Text>
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Embriões Viáveis</Text>
            </View>
            <View style={[style.searchPive, {marginLeft: 30}]}>
                <TextInput
                    placeholder="Buscar Embrião"
                    style={style.input}
                />
            </View>
            <View style={[style.listItem, { backgroundColor: '#F1F2F4', marginTop: 0, marginHorizontal: 20, paddingBottom: 250 }]}>
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={embryos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                />
            </View>
            <Modal
                transparent={true}
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={stylesEmbryos.modalContainer}>
                    <View style={stylesEmbryos.modalContent}>
                        <Text style={stylesEmbryos.modalTitle}>Editar Embrião</Text>
                        <Text style={stylesEmbryos.modalSubtitle}>ID embrião: {selectedEmbryoId}</Text>
                        <View style={stylesEmbryos.optionContainer}>
                            <Text style={{ textAlign: 'center' }}>Congelado: </Text>
                            <SelectList
                                setSelected={handleSelect}
                                data={categoryData}
                                placeholder={"Clique"}
                                boxStyles={[style.selectListBox, { marginBottom: 30, zIndex: 2, width: 73, paddingLeft: 4, marginLeft: 90 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown, { zIndex: 3, zIndex: 10, elevation: 10, position: 'absolute', marginTop: 60, marginLeft: 90 }]}
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
                                <Text style={stylesEmbryos.navigationButtonText}>Editar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    itemContainer: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginTop: 5,
        borderRadius: 10
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    boldText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemText: {
        fontSize: 16,
        color: '#555',
    },
})
