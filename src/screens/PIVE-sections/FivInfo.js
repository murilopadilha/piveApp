import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import axios from "axios";
import style from "../../components/style";
import { SelectList } from 'react-native-dropdown-select-list';
import stylesEmbryos from "../../components/stylesEmbryos";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SafeAreaView } from "react-native-safe-area-context";

import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [viableEmbryos, setViableEmbryos] = useState([]);
    const [category, setCategory] = useState('');
    const [receiver, setReceiver] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState('');
    const [cultivationId, setCultivationId] = useState(null);
    const [embryosRegistered, setEmbryosRegistered] = useState(0);
    const [oocyteCollections, setOocyteCollections] = useState([]);

    const categories = [
        { key: 'true', value: 'Sim' },
        { key: 'false', value: 'Não' },
    ];

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }));

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey);
        if (selectedCategory) {
            setCategory(selectedCategory.key);
        }
    };

    const handleReceiverSelect = (selectedId) => {
        const selectedReceiver = receiver.find(rec => rec.id.toString() === selectedId);
        if (selectedReceiver) {
            setSelectedReceiver(selectedReceiver.name);
        } else {
            console.log("Receiver not found for ID:", selectedId);
        }
    };

    const fetchEmbryosRegistered = async (cultivationId) => {
        try {
            const response = await axios.get(`http://${IPAdress}/cultivation/${cultivationId}`);
            if (response.data) {
                setEmbryosRegistered(response.data.embryosRegistered);
            }
        } catch (err) {
            console.error("Erro ao buscar embriões registrados:", err.message);
        }
    };

    const fetchReceivers = async () => {
        try {
            const response = await axios.get(`http://${IPAdress}/receiver/available`);
            setReceiver(response.data);
        } catch (err) {
            console.error(err.message);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/fiv/${fiv.id}`);
                setOocyteCollections(response.data);
                if (Array.isArray(response.data) && response.data.length > 0) {
                    const fetchedData = response.data[0];
                    setData(fetchedData);
                    if (fetchedData.cultivation) {
                        setCultivationId(fetchedData.cultivation.id);
                    }
                } else if (response.data && (response.data.oocyteCollection || response.data.cultivation)) {
                    setData(response.data);
                    if (response.data.cultivation) {
                        setCultivationId(response.data.cultivation.id);
                    }
                } else {
                    setData(null);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fiv]);

    useEffect(() => {
        if (data && data.cultivation) {
            const embryos = Array.isArray(data.cultivation.viableEmbryos) ? data.cultivation.viableEmbryos : [];
            setViableEmbryos(embryos);
        }
    }, [data]);

    const openModal = async () => {
        setModalVisible(true);
        if (cultivationId) {
            fetchEmbryosRegistered(cultivationId);
        }
        await fetchReceivers();
    };

    const handleSave = async () => {
        if (!cultivationId || category === '' || !selectedReceiver) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const receiverId = receiver.find(rec => rec.name === selectedReceiver)?.id || 0;

            if (embryosRegistered >= cultivation.viableEmbryos) {
                alert("Todos os embriões desse cultivo já foram registrados.");
                return;
            }

            const response = await axios.post(`http://${IPAdress}/embryo`, {
                cultivationId: cultivationId,
                frozen: category === 'true',
                receiverCattleId: receiverId
            });

            await fetchEmbryosRegistered(cultivationId);

            setCategory('');
            setSelectedReceiver('');
            setModalVisible(false);
        } catch (err) {
            console.error("Erro ao salvar os dados:", err.message);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#092955" />;
    }

    if (error) {
        return <Text>Error: {error}</Text>;
    }

    const oocyteCollection = data || {};
    const cultivation = data?.cultivation || {};

    return (
        <SafeAreaView style={stylesEmbryos.container} >
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Informação da FIV</Text>
            </View>
            <ScrollView style={[stylesEmbryos.scrollContainer, { marginHorizontal: 20 }]} contentContainerStyle={{ paddingBottom: '30%' }}>
                <View style={stylesEmbryos.section}>
                    <Text style={stylesEmbryos.sectionTitle}>Procedimento</Text>
                    <View style={stylesEmbryos.infoContainer}>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Data da coleta:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.date || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Fazenda:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.farm || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Laboratório:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.laboratory || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Cliente:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.client || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Veterinário:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.veterinarian || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>Técnico:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.technical || '-'}</Text>
                        </View>
                        <View style={stylesEmbryos.infoRow}>
                            <Text style={stylesEmbryos.label}>TE:</Text>
                            <Text style={stylesEmbryos.value}>{fiv.TE || '-'}</Text>
                        </View>
                    </View>
                    <Text style={[stylesEmbryos.label, { marginLeft: '31%', marginBottom: '3%' }]}>Coleta dos Oócitos:</Text>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[stylesEmbryos.label, {fontSize: 10}]}>N°</Text>
                        <Text style={stylesEmbryos.label}>Doadora</Text>
                        <Text style={stylesEmbryos.label}>Touro</Text>
                        <Text style={stylesEmbryos.label}>Total</Text>
                        <Text style={stylesEmbryos.label}>Viáveis</Text>
                        <Text style={stylesEmbryos.label}>Emb%</Text>
                    </View>
                    {oocyteCollections.oocyteCollections.map((collection, index) => {
                        const backgroundColor = index % 2 == 0 ? '#fff' : 'transparent'
                        return (
                            <View key={index} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', backgroundColor }}>
                                <View style={{width: '3%'}}>
                                    <Text style={[stylesEmbryos.value, {fontSize: 10}]}>{index + 1}</Text>
                                </View>
                                <View style={{width: '24%'}}>
                                    <Text style={stylesEmbryos.value}>{collection.donorCattle.registrationNumber}</Text>
                                </View>
                                <View style={{width: '20%'}}>
                                    <Text style={stylesEmbryos.value}>{collection.bull.registrationNumber}</Text>
                                </View>
                                <View style={{width: '10%', marginLeft: '5%'}}>
                                    <Text style={stylesEmbryos.value}>{collection.totalOocytes}</Text>
                                </View>
                                <View style={{width: '7%', marginLeft: '8%'}}>
                                    <Text style={stylesEmbryos.value}>{collection.viableOocytes}</Text>
                                </View>
                                <View style={{width: '17%', marginLeft: '8%'}}>
                                {collection.embryoProduction
                                    ? <Text style={stylesEmbryos.value}>{collection.embryoProduction.embryosPercentage || '-'}</Text>
                                    : <Text style={stylesEmbryos.value}>-</Text>
                                }
                                </View>   
                            </View>
                        )
                    })}
                    <Text style={[stylesEmbryos.sectionTitle, stylesEmbryos.oocytesTitle]}>Oócitos:</Text>
                    <View style={stylesEmbryos.oocytesContainer}>
                        <View style={stylesEmbryos.oocytesRow}>
                            <View style={stylesEmbryos.oocytesItem}>
                                <Text style={stylesEmbryos.label}>Total:</Text>
                                <Text style={stylesEmbryos.value}>{fiv.totalOocytesCollected || '-'}</Text>
                            </View>
                            <View style={stylesEmbryos.oocytesItem}>
                                <Text style={stylesEmbryos.label}>Viáveis:</Text>
                                <Text style={stylesEmbryos.value}>{fiv.totalViableOocytesCollected || '-'}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={[stylesEmbryos.sectionTitle, stylesEmbryos.cultivationTitle]}>Produção de Embriões</Text>
                    <View style={stylesEmbryos.cultivationContainer}>
                        <View style={stylesEmbryos.cultivationItem}>
                            <Text style={stylesEmbryos.label}>Total de Embriões:</Text>
                            <Text style={stylesEmbryos.value}>{cultivation.totalEmbryos || '-'}</Text>
                        </View>
                        <View
                            style={stylesEmbryos.cultivationItem}
                            onPress={openModal}
                        >
                            <Text style={stylesEmbryos.label}>Porcentual Embriões:</Text>
                            <Text style={stylesEmbryos.value}>{cultivation.viableEmbryos || '-'}</Text>
                        </View>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row' }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Embrioes', { fiv: fiv })}
                            style={[style.listButtonEdit, { marginTop: 0, marginLeft: 25, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                        >
                            <FontAwesome6 name="clipboard-list" size={20} color="#E0E0E0" />
                            <Text style={{ color: '#E0E0E0', paddingTop: 1, paddingLeft: 5 }}>Embriões</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => fiv.status === 'IN_PROCESS' ? navigation.navigate('ColetaOocitos', { fiv: fiv }) : navigation.navigate('Cultivo', { fiv: fiv })}
                            style={[style.listButtonEdit, { marginTop: 0, marginLeft: 100, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                        >
                            <Octicons name="pencil" size={20} color="#E0E0E0" />
                            <Text style={{ color: '#E0E0E0', paddingTop: 1 }}>Registrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
