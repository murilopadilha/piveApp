import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import axios from "axios";
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";
import { SelectList } from 'react-native-dropdown-select-list';  // Importe o SelectList
import stylesEmbryos from "../../components/stylesEmbryos"

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

    // Defina categories antes de usá-las
    const categories = [
        { key: 'true', value: 'Sim' },
        { key: 'false', value: 'Não' },
    ];

    // Use categories para gerar categoryData
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
        const selectedReceiver = receiver.find(rec => rec.id === selectedId);
        if (selectedReceiver) {
            setSelectedReceiver(selectedReceiver.name);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/fiv/${fiv.id}`);
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setData(response.data[0]);
                } else if (response.data && (response.data.oocyteCollection || response.data.cultivation)) {
                    setData(response.data);
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

    useEffect(() => {
        const fetchReceivers = async () => {
            try {
                const response = await axios.get('http://18.218.115.38:8080/receiver/available');
                setReceiver(response.data);
            } catch (err) {
                console.error(err.message);
            }
        };

        fetchReceivers();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" color="#092955" />;
    }

    if (error) {
        return <Text>Error: {error}</Text>;
    }

    const oocyteCollection = data?.oocyteCollection || {};
    const cultivation = data?.cultivation || {};

    return (
        <View style={stylesEmbryos.container}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
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
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={[stylesEmbryos.label, { textDecorationLine: 'underline' }]}>Embriões Viáveis:</Text>
                            <Text style={stylesEmbryos.value}>{cultivation.viableEmbryos || '-'}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ColetaOocitos', { fiv: fiv })}
                        style={[style.listButtonEdit, { marginTop: 0, marginLeft: 125, marginTop: 40, marginBottom: 10, height: 30, width: 90 }]}
                    >
                        <Octicons name="pencil" size={20} color="#E0E0E0" />
                        <Text style={{ color: '#E0E0E0', paddingTop: 1 }}>Registrar</Text>
                    </TouchableOpacity>
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
                        <Text style={stylesEmbryos.modalSubtitle}>Registro {}/{}</Text>
                        <View style={stylesEmbryos.optionContainer}>
                            <Text>Congelado: </Text>
                            <SelectList
                                setSelected={handleSelect}
                                data={categoryData}
                                placeholder={"Selecione uma opção"}
                                boxStyles={[style.selectListBox, { marginBottom: 15 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown]}
                            />
                            <Text>Receptora: </Text>
                            <SelectList
                                setSelected={handleReceiverSelect}
                                data={receiver.map(rec => ({
                                    key: rec.id.toString(),
                                    value: rec.name
                                }))}
                                placeholder={"Selecione a receptora"}
                                boxStyles={[style.selectListBox, { marginBottom: 15 }]}
                                inputStyles={style.selectListInput}
                                dropdownStyles={[style.selectListDropdown]}
                            />
                        </View>
                        <View style={stylesEmbryos.buttonContainer}>
                            <TouchableOpacity
                                style={stylesEmbryos.navigationButton}
                            >
                                <Text style={stylesEmbryos.navigationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={stylesEmbryos.navigationButton}
                            >
                                <Text style={stylesEmbryos.navigationButtonText}>Próximo</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={stylesEmbryos.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={stylesEmbryos.closeButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


