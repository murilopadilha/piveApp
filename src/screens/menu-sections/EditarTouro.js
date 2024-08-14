import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import style from "../../components/style";

export default ({ route, navigation }) => {
    const { donor } = route.params; // Recebe os dados do touro da navegação
    const [newDonorName, setName] = useState(donor.name);
    const [newDonorBreed, setBreed] = useState(donor.breed);
    const [newDonorIndentification, setNumber] = useState(donor.registrationNumber);
    const [newDonorDateOfBirth, setDateOfBirth] = useState(donor.birth);
    const [donorId, setDonorId] = useState(donor.id); // Adiciona o ID do touro

    async function updateBull(id, name, registrationNumber) {
        const donorData = {
            "name": name,
            "registrationNumber": registrationNumber
        };

        try {
            const response = await fetch(`http://18.217.70.110:8080/bull/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donorData)
            });
            const result = await response.json();
            console.log(result); // Para depuração
            Alert.alert('Sucesso', 'Touro atualizado com sucesso!');
            navigation.goBack(); // Volta para a tela anterior
        } catch (error) {
            console.error('Erro ao atualizar o touro:', error);
            Alert.alert('Erro', 'Não foi possível atualizar os dados.');
        }
    }

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

    function confirmUpdate() {
        Alert.alert(
            "Confirmar Edição",
            "Você tem certeza de que deseja editar os dados do touro?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Editar",
                    onPress: () => updateBull(donorId, newDonorName, newDonorBreed, newDonorIndentification, newDonorDateOfBirth)
                }
            ]
        );
    }

    return (
        <View style={style.menu}>
            <View style={style.divTitle}>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                    <View style={{ marginRight: 50 }}>
                        <AntDesign name="arrowleft" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>Editar Touro</Text>
            </View>
            <View style={style.content}>
                <Text style={style.label}>Nome:</Text>
                <TextInput
                    placeholder="Nome do Touro"
                    value={newDonorName}
                    style={style.input}
                    onChangeText={setName}
                />
                <Text style={style.label}>Identificação:</Text>
                <TextInput
                    placeholder="Identificação do Touro"
                    value={newDonorIndentification}
                    style={style.input}
                    onChangeText={setNumber}
                />
                <View>
                    <TouchableOpacity 
                        style={style.button} 
                        onPress={confirmUpdate} // Altere para usar a função de confirmação
                    >
                        <Text style={style.buttonText}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
