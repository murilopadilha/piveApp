import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";

export default ({ route, navigation }) => {
    const { donor } = route.params; // Recebe os dados da doadora da navegação
    const [newDonorName, setName] = useState(donor.name);
    const [newDonorBreed, setBreed] = useState(donor.breed);
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber);
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth);
    const [donorId, setDonorId] = useState(donor.id); // Adiciona o ID da doadora

    async function updateDonor(id, name, breed, registrationNumber, birth) {
        const donorData = {
            "name": name,
            "breed": breed,
            "birth": birth,
            "registrationNumber": registrationNumber
        };

        try {
            const response = await fetch(`http://3.138.173.182:8080/donor/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donorData)
            });
            const result = await response.json();
            console.log(result); // Para depuração
            Alert.alert('Sucesso', 'Doadora atualizada com sucesso!');
            navigation.goBack(); // Volta para a tela anterior
        } catch (error) {
            console.error('Erro ao atualizar o doador:', error);
            Alert.alert('Erro', 'Não foi possível atualizar os dados.');
        }
    }

    const confirmUpdate = () => {
        Alert.alert(
            "Confirmar Edição",
            "Você tem certeza de que deseja editar os dados da doadora?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Editar",
                    onPress: () => updateDonor(donorId, newDonorName, newDonorBreed, newDonorIndentification, newDonorDateOfBirth)
                }
            ]
        );
    };

    // Função para formatar e definir a data
    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`;
        setDateOfBirth(formattedDate);
    };

    const showDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: onChangeDate,
        });
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Editar Doadora</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome da Doadora"
                    value={newDonorName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Raça:</Text>
                <TextInput
                    placeholder="Raça da Doadora"
                    value={newDonorBreed}
                    style={style.input}
                    onChangeText={setBreed}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação da Doadora"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <Text style={style.label}>Data de Nascimento:</Text>
                <TouchableOpacity onPress={showDatePicker} style={style.dateInput}>
                    <Text style={style.dateText}>{newDonorDateOfBirth || "Selecione a Data"}</Text>
                </TouchableOpacity>
                <View>
                    <TouchableOpacity 
                        style={style.button} 
                        onPress={confirmUpdate}
                    >
                        <Text style={style.buttonText}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
