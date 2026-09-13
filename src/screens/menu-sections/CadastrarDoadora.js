import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import style from "../../components/style";
import { createDonor } from "../../api/donorService";
import { API_ERROR_TYPES, normalizeApiError } from "../../api/errors";

export default ({ navigation }) => {
    const [newDonorName, setName] = useState('');
    const [newDonorBreed, setBreed] = useState('');
    const [newDonorIdentification, setIdentification] = useState('');
    const [newDonorDateOfBirth, setDateOfBirth] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = React.useRef(false);
    const isMountedRef = React.useRef(true);
    const isScreenFocusedRef = React.useRef(false);
    const mutationAbortControllerRef = React.useRef(null);

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

    const postDonors = async (name, breed, registrationNumber, birth) => {
        if (isSubmittingRef.current) return;

        const receiverData = {
            "name": name,
            "breed": breed,
            "birth": birth,
            "registrationNumber": registrationNumber
        };
        const abortController = new AbortController();

        isSubmittingRef.current = true;
        mutationAbortControllerRef.current = abortController;
        setIsSubmitting(true);

        try {
            const receivers = await createDonor(receiverData, {
                signal: abortController.signal,
            });

            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return;

            console.log(receivers);
            Alert.alert('Sucesso', 'Doadora cadastrada com sucesso!');
            setName('');
            setBreed('');
            setIdentification('');
            setDateOfBirth('');
        } catch (error) {
            const apiError = normalizeApiError(error, 'Erro ao enviar dados');
            if (apiError.isCanceled) return;
            if (
                !isMountedRef.current ||
                !isScreenFocusedRef.current ||
                mutationAbortControllerRef.current !== abortController
            ) return;
            if (apiError.type === API_ERROR_TYPES.HTTP && apiError.status !== 409) {
                Alert.alert('Erro', 'Erro ao enviar dados');
                return;
            }
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

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
        setDateOfBirth(formattedDate);
        hideDatePicker();
    };

    return (
        <SafeAreaView style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: '9%' }}>
                        <AntDesign name="arrowleft" size={24} color="#092955" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Cadastro da doadora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da doadora"
                    placeholderTextColor="#888"
                    value={newDonorName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da doadora"
                    placeholderTextColor="#888"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da doadora"
                    placeholderTextColor="#888"
                    value={newDonorIdentification}
                    style={style.input}
                    onChangeText={setIdentification}
                />
                <Text style={style.label}>Data de Nascimento:</Text>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{newDonorDateOfBirth || "Selecione a data"}</Text>
                    <AntDesign style={{ paddingLeft: '20%' }} name="calendar" size={24} color="#000" />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                />
                <View>
                    <TouchableOpacity
                        disabled={isSubmitting}
                        style={[style.button, { display: 'flex', flexDirection: 'row' }]}
                        onPress={() => postDonors(newDonorName, newDonorBreed, newDonorIdentification, newDonorDateOfBirth)}
                    >
                        <MaterialIcons name="done" size={20} color="#fff" />
                        <Text style={[style.buttonText, { marginLeft: 5, paddingBottom: 2 }]}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};
