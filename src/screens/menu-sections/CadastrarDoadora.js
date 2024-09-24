import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from "react-native-safe-area-context";
import style from "../../components/style";
import { IPAdress } from "../../components/APIip";

export default ({ navigation }) => {
    const [newDonorName, setName] = useState('');
    const [newDonorBreed, setBreed] = useState('');
    const [newDonorIdentification, setIdentification] = useState('');
    const [newDonorDateOfBirth, setDateOfBirth] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const postDonors = async (name, breed, registrationNumber, birth) => {
        const receiverData = {
            "name": name,
            "breed": breed,
            "birth": birth,
            "registrationNumber": registrationNumber
        };

        try {
            const response = await fetch(`http://${IPAdress}/donor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(receiverData)
            });

            if (response.ok) {
                const receivers = await response.json();
                console.log(receivers);
                Alert.alert('Sucesso', 'Doadora cadastrada com sucesso!');
                setName('');
                setBreed('');
                setIdentification('');
                setDateOfBirth('');
            } else if (response.status === 409) {
                const errorMessage = await response.text();
                Alert.alert('Erro', errorMessage);
            } else {
                Alert.alert('Erro', "Erro ao enviar dados");
            }
        } catch (error) {
            Alert.alert('Erro', error.message);
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
