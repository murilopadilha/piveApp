import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import axios from "axios";
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";
import { SelectList } from 'react-native-dropdown-select-list';  // Importe o SelectList

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
        <View style={styles.container}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Informação da FIV</Text>
            </View>
            <ScrollView style={[styles.scrollContainer, { marginHorizontal: 20 }]}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coleta dos Oócitos</Text>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Data da coleta:</Text>
                            <Text style={styles.value}>{oocyteCollection.date || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Fazenda:</Text>
                            <Text style={styles.value}>{oocyteCollection.farm || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Cliente:</Text>
                            <Text style={styles.value}>{oocyteCollection.client || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Veterinário:</Text>
                            <Text style={styles.value}>{oocyteCollection.veterinarian || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Técnico:</Text>
                            <Text style={styles.value}>{oocyteCollection.technical || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Doadora:</Text>
                            <Text style={styles.value}>
                                {oocyteCollection.donorCattle ? `${oocyteCollection.donorCattle.name} (${oocyteCollection.donorCattle.registrationNumber})` : '-'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Touro:</Text>
                            <Text style={styles.value}>
                                {oocyteCollection.bull ? `${oocyteCollection.bull.name} (${oocyteCollection.bull.registrationNumber})` : '-'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.sectionTitle, styles.oocytesTitle]}>Oócitos:</Text>
                    <View style={styles.oocytesContainer}>
                        <View style={styles.oocytesRow}>
                            <View style={styles.oocytesItem}>
                                <Text style={styles.label}>Total:</Text>
                                <Text style={styles.value}>{oocyteCollection.totalOocytes || '-'}</Text>
                            </View>
                            <View style={styles.oocytesItem}>
                                <Text style={styles.label}>Viáveis:</Text>
                                <Text style={styles.value}>{oocyteCollection.viableOocytes || '-'}</Text>
                            </View>
                            <View style={styles.oocytesItem}>
                                <Text style={styles.label}>Inviáveis:</Text>
                                <Text style={styles.value}>{oocyteCollection.nonViableOocytes || '-'}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={[styles.sectionTitle, styles.cultivationTitle]}>Cultivo</Text>
                    <View style={styles.cultivationContainer}>
                        <View style={styles.cultivationItem}>
                            <Text style={styles.label}>Total de Embriões:</Text>
                            <Text style={styles.value}>{cultivation.totalEmbryos || '-'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.cultivationItem}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={[styles.label, { textDecorationLine: 'underline' }]}>Embriões Viáveis:</Text>
                            <Text style={styles.value}>{cultivation.viableEmbryos || '-'}</Text>
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
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Gerenciar Embriões Viáveis</Text>
                        <Text style={styles.modalSubtitle}>Registro {}/{}</Text>
                        <View style={styles.optionContainer}>
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
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.navigationButton}
                            >
                                <Text style={styles.navigationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.navigationButton}
                            >
                                <Text style={styles.navigationButtonText}>Próximo</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
        flex: 1,
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
        padding: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoContainer: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    label: {
        fontWeight: 'bold',
    },
    value: {
        color: '#555',
    },
    oocytesTitle: {
        marginTop: 20,
    },
    oocytesContainer: {
        marginBottom: 20,
    },
    oocytesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    oocytesItem: {
        flex: 1,
        alignItems: 'center',
    },
    cultivationTitle: {
        marginTop: 20,
    },
    cultivationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 20,
    },
    cultivationItem: {
        flex: 1,
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
    },
    optionContainer: {
        width: '100%',
        marginBottom: 20,
    },
    optionLabel: {
        fontWeight: 'bold',
        marginBottom: 10,
    },
    optionButtons: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    optionButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 5,
    },
    optionButtonSelected: {
        backgroundColor: '#092955',
    },
    optionButtonSelectedText: {
        color: '#fff',
    },
    optionButtonText: {
        color: '#555',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    navigationButton: {
        backgroundColor: '#092955',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    navigationButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: '#E0E0E0',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#555',
        fontWeight: 'bold',
    },
    selectListDropdown: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        maxHeight: 150, // Ajuste a altura máxima se necessário
    },
});
