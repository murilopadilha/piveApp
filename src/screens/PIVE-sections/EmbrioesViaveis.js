import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList, Modal } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from "axios";
import style from "../../components/style";
import stylesEmbryos from "../../components/stylesEmbryos";
import { SelectList } from 'react-native-dropdown-select-list';
import { IPAdress } from "../../components/APIip";
import { SafeAreaView } from "react-native-safe-area-context";

export default ({ route, navigation }) => {
    const { cultivationId } = route.params

    const [embryos, setEmbryos] = useState([])
    const [filteredItems, setFilteredItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [receiver, setReceiver] = useState([])
    const [selectedReceiver, setSelectedReceiver] = useState('')
    const [category, setCategory] = useState('')
    const [selectedEmbryoId, setSelectedEmbryoId] = useState(null)
    const [icon, setIcon] = useState('list-status')
    const [categories, setCategories] = useState([
        { key: 'ALL', value: 'Todos embriões' },
        { key: 'true', value: 'Congelados' },
        { key: 'false', value: 'Não congelados' },
        { key: 'receiver', value: 'Receptoras' },
    ])
    const [receiverOptions, setReceiverOptions] = useState([])
    const [showReceiverSelectList, setShowReceiverSelectList] = useState(false)

    useEffect(() => {
        const fetchEmbryos = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/cultivation/${cultivationId}`)
                if (response.data && Array.isArray(response.data.embryos)) {
                    setEmbryos(response.data.embryos)
                    filterEmbryos(response.data.embryos)
                } else {
                    console.warn("Erro ao salvar embriões")
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchEmbryos()
    }, [cultivationId])

    useEffect(() => {
        if (embryos.length > 0) {
            filterEmbryos(embryos)
        }
    }, [category])

    const fetchReceivers = async () => {
        try {
            const response = await axios.get(`http://${IPAdress}/receiver`);
            setReceiver(response.data)
            setReceiverOptions(response.data.map(rec => ({
                key: rec.id.toString(),
                value: `${rec.name} (${rec.registrationNumber})`
            })))
        } catch (err) {
            console.error(err.message)
        }
    }

    const fetchAvailableReceivers = async () => {
        try {
            const response = await axios.get(`http://${IPAdress}/receiver/available`)
            setReceiverOptions(response.data.map(rec => ({
                key: rec.id.toString(),
                value: `${rec.name} (${rec.registrationNumber})`
            })))
        } catch (err) {
            console.error(err.message);
        }
    }

    const filterEmbryos = (embryosList) => {
        let filteredList = embryosList

        if (category && category !== 'ALL') {
            filteredList = embryosList.filter(embryo => embryo.frozen.toString() === category)
        }

        setFilteredItems(filteredList);
    }

    const handleSelect = async (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey);
        if (selectedCategory) {
            setCategory(selectedCategory.key);

            if (selectedCategory.key === 'receiver') {
                setShowReceiverSelectList(true);
                await fetchReceivers();
            } else {
                setShowReceiverSelectList(false);
            }
        }
    }

    const handleReceiverSelect = async (selectedReceiverKey) => {
        const selectedReceiver = receiver.find(rec => rec.id.toString() === selectedReceiverKey)
        if (selectedReceiver) {
            try {
                const response = await axios.get(`http://${IPAdress}/cultivation/${cultivationId}`)
                if (response.data && Array.isArray(response.data.embryos)) {
                    const filteredEmbryos = response.data.embryos.filter(embryo =>
                        embryo.receiverCattle.registrationNumber === selectedReceiver.registrationNumber
                    )
                    setFilteredItems(filteredEmbryos)
                }
            } catch (err) {
                console.error(err.message)
            }
        }
    }

    const openModal = async (embryoId) => {
        setModalVisible(true)
        setSelectedEmbryoId(embryoId)
        await fetchAvailableReceivers()
    }

    const handleSave = async () => {
        if (!cultivationId || !category || !selectedReceiver || selectedEmbryoId === null) {
            alert("Por favor, preencha todos os campos.")
            return
        }

        try {
            const receiverId = receiver.find(rec => rec.name === selectedReceiver)?.id || 0

            await axios.put(`http://${IPAdress}/embryo/${selectedEmbryoId}`, {
                cultivationId: cultivationId,
                frozen: category === 'true',
                receiverCattleId: receiverId
            })

            const response = await axios.get(`http://${IPAdress}/cultivation/${cultivationId}`)
            if (response.data && Array.isArray(response.data.embryos)) {
                setEmbryos(response.data.embryos)
                filterEmbryos(response.data.embryos)
            }

            setCategory('')
            setSelectedReceiver('')
            setModalVisible(false)
        } catch (err) {
            console.error("Erro ao salvar os dados:", err.message)
        }
    }

    const toggleCategory = () => {
        if (icon === 'list-status') {
            setCategories([
                { key: 'ALL', value: 'Todos embriões' },
                { key: 'true', value: 'Congelados' },
                { key: 'false', value: 'Não congelados' },
                { key: 'receiver', value: 'Receptoras' },
            ])
            setIcon('list-status')
            setCategory('')
            setFilteredItems(embryos)
            setShowReceiverSelectList(false)
        } else {
            setCategories([
                { key: 'ALL', value: 'Todos embriões' },
                { key: 'true', value: 'Congelados' },
                { key: 'false', value: 'Não congelados' },
            ])
            setIcon('list-status')
            setCategory('')
            setFilteredItems(embryos)
            setShowReceiverSelectList(false)
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
                <Text style={styles.boldText}>Doadora:</Text>
                <Text style={styles.itemText}>{item.donorCattle.name} ({item.donorCattle.registrationNumber})</Text>
            </View>
            <View style={styles.itemRow}>
                <Text style={[styles.boldText, { textDecorationLine: 'underline' }]}>Receptora:</Text>
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
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Embriões Viáveis</Text>
            </View>
            <View style={[style.searchPive, { marginLeft: 45 }]}>
                <SelectList
                    setSelected={handleSelect}
                    data={categories}
                    placeholder={"Selecione a opção para filtrar"}
                    boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={style.selectListDropdownPive}
                />
            </View>
            {showReceiverSelectList && (
                <View style={[style.searchPive, { marginLeft: 45 }]}>
                    <SelectList
                        setSelected={handleReceiverSelect}
                        data={receiverOptions}
                        placeholder={"Selecione a receptora"}
                        boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={style.selectListDropdownPive}
                    />
                </View>
            )}
            <View style={[style.listItemEmbryo, { backgroundColor: '#F1F2F4', marginTop: 0, marginHorizontal: 20, paddingBottom: 250 }]}>
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={filteredItems}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 300 }}
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
                                data={categories}
                                placeholder={"Clique"}
                                boxStyles={[style.selectListBox, { marginBottom: 30, zIndex: 2, width: 73, paddingLeft: 4, marginLeft: 90 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown, { zIndex: 3, elevation: 10, position: 'absolute', marginTop: 60, marginLeft: 90 }]}
                            />
                            <Text style={{ textAlign: 'center' }}>Receptora: </Text>
                            <SelectList
                                setSelected={setSelectedReceiver}
                                data={receiverOptions}
                                placeholder={"Selecione a receptora"}
                                boxStyles={[style.selectListBox, { marginBottom: 15, zIndex: 2, marginLeft: 15 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown, { zIndex: 3, elevation: 10, position: 'absolute', marginTop: 60, width: 235, marginLeft: 15 }]}
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
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    itemContainer: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginTop: 5,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
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
