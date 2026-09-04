import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { createFiv } from "../../api/fivService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const [newOocyteCollectionDate, setDateOfOocyteCollection] = useState('');
    const [farm, setFarm] = useState('');
    const [client, setClient] = useState('');
    const [laboratory, setLaboratory] = useState('');
    const [veterinarian, setVeterinarian] = useState('');
    const [technical, setTechnical] = useState('');
    const [TE, setTE] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isMountedRef = React.useRef(true);
    const isScreenFocusedRef = React.useRef(false);
    const isSubmittingRef = React.useRef(false);
    const mutationAbortControllerRef = React.useRef(null);
    const dateRef = React.useRef(newOocyteCollectionDate);
    const farmRef = React.useRef(farm);
    const laboratoryRef = React.useRef(laboratory);
    const clientRef = React.useRef(client);
    const veterinarianRef = React.useRef(veterinarian);
    const technicalRef = React.useRef(technical);
    const TERef = React.useRef(TE);

    dateRef.current = newOocyteCollectionDate;
    farmRef.current = farm;
    laboratoryRef.current = laboratory;
    clientRef.current = client;
    veterinarianRef.current = veterinarian;
    technicalRef.current = technical;
    TERef.current = TE;

    React.useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            mutationAbortControllerRef.current?.abort();
            mutationAbortControllerRef.current = null;
        };
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true;

            return () => {
                isScreenFocusedRef.current = false;
                mutationAbortControllerRef.current?.abort();
                mutationAbortControllerRef.current = null;
            };
        }, [])
    );

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
        dateRef.current = formattedDate;
        setDateOfOocyteCollection(formattedDate);
        hideDatePicker();
    };

    const handleSave = async () => {
        if (isSubmittingRef.current) return;

        const submittedDate = newOocyteCollectionDate;
        const submittedFarm = farm;
        const submittedLaboratory = laboratory;
        const submittedClient = client;
        const submittedVeterinarian = veterinarian;
        const submittedTechnical = technical;
        const submittedTE = TE;
        const payload = {
            date: submittedDate,
            farm: submittedFarm,
            laboratory: submittedLaboratory,
            client: submittedClient,
            veterinarian: submittedVeterinarian,
            technical: submittedTechnical,
            TE: submittedTE,
        };
        const abortController = new AbortController();

        isSubmittingRef.current = true;
        mutationAbortControllerRef.current = abortController;
        setIsSubmitting(true);

        try {
            await createFiv(payload, {
                signal: abortController.signal,
            });

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return;

            Alert.alert('Sucesso', 'FIV salva com sucesso!');

            if (dateRef.current === submittedDate) {
                dateRef.current = '';
                setDateOfOocyteCollection('');
            }
            if (farmRef.current === submittedFarm) {
                farmRef.current = '';
                setFarm('');
            }
            if (clientRef.current === submittedClient) {
                clientRef.current = '';
                setClient('');
            }
            if (laboratoryRef.current === submittedLaboratory) {
                laboratoryRef.current = '';
                setLaboratory('');
            }
            if (veterinarianRef.current === submittedVeterinarian) {
                veterinarianRef.current = '';
                setVeterinarian('');
            }
            if (technicalRef.current === submittedTechnical) {
                technicalRef.current = '';
                setTechnical('');
            }
            if (TERef.current === submittedTE) {
                TERef.current = '';
                setTE('');
            }
        } catch (requestError) {
            const apiError = normalizeApiError(requestError, 'Não foi possível salvar a FIV.');
            if (apiError.isCanceled) return;
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return;

            Alert.alert('Erro', apiError.message);
        } finally {
            if (mutationAbortControllerRef.current === abortController) {
                mutationAbortControllerRef.current = null;
            }
            isSubmittingRef.current = false;
            if (isMountedRef.current) {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Pive')}>
                    <View style={{ marginRight: '10%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Informações da FIV</Text>
            </View>
            <View style={[style.content, { marginTop: 0, paddingTop: 0 }]}>
                <ScrollView style={{ height: '90%' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 250 }}>
                    <Text style={style.label}>Data da coleta:</Text>
                    <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                        <Text style={style.dateText}>{newOocyteCollectionDate || "Selecione a Data"}</Text>
                        <AntDesign style={{ paddingLeft: '20%' }} name="calendar" size={24} color="#000" />
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                    />
                    <Text style={style.label}>Fazenda:</Text>
                    <TextInput
                        placeholder="Nome da fazenda"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={farm}
                        onChangeText={(text) => {
                            farmRef.current = text;
                            setFarm(text);
                        }}
                    />
                    <Text style={style.label}>Cliente:</Text>
                    <TextInput
                        placeholder="Nome do cliente"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={client}
                        onChangeText={(text) => {
                            clientRef.current = text;
                            setClient(text);
                        }}
                    />
                    <Text style={style.label}>Laboratório:</Text>
                    <TextInput
                        placeholder="Nome do laboratório"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={laboratory}
                        onChangeText={(text) => {
                            laboratoryRef.current = text;
                            setLaboratory(text);
                        }}
                    />
                    <Text style={style.label}>Veterinário:</Text>
                    <TextInput
                        placeholder="Nome do veterinário"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={veterinarian}
                        onChangeText={(text) => {
                            veterinarianRef.current = text;
                            setVeterinarian(text);
                        }}
                    />
                    <Text style={style.label}>Técnico:</Text>
                    <TextInput
                        placeholder="Nome do técnico"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={technical}
                        onChangeText={(text) => {
                            technicalRef.current = text;
                            setTechnical(text);
                        }}
                    />
                    <Text style={style.label}>TE:</Text>
                    <TextInput
                        placeholder="Nome do TE"
                        placeholderTextColor="#888"
                        style={style.input}
                        value={TE}
                        onChangeText={(text) => {
                            TERef.current = text;
                            setTE(text);
                        }}
                    />
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleSave}
                            disabled={isSubmitting}
                            style={[style.listButtonSearch, { width: '30%', height: '58%', display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '60%' }]}>
                            <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
