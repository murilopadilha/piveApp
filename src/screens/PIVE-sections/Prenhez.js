import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from 'react-native-dropdown-select-list';
import { IPAdress } from "../../components/APIip";

export default ({ route, navigation }) => {
    const { fiv } = route.params;
    const [recipients, setRecipients] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState(null);

    useEffect(() => {
        const fetchRecipients = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/pregnancy/in-progress-receivers`);
                const formattedRecipients = response.data.map(recipient => ({
                    key: recipient.id.toString(),
                    value: `${recipient.name} (${recipient.registrationNumber})`
                }));
                setRecipients(formattedRecipients);
            } catch (error) {
                Alert.alert("Erro", "Não foi possível buscar as receptoras");
                console.error(error);
            }
        };

        fetchRecipients();
    }, []);

    const postPregnancy = async () => {
        if (!selectedReceiver) {
            Alert.alert("Erro", "Por favor, selecione uma receptora.");
            return;
        }

        const pregnancyData = {
            receiverCattleId: selectedReceiver,
            is_pregnant: true
        };

        try {
            await axios.post(`http://${IPAdress}/pregnancy`, pregnancyData);
            Alert.alert("Sucesso", "Receptora marcada como prenha com sucesso.");
        } catch (error) {
            Alert.alert("Erro", error.response?.data || "Ocorreu um erro ao salvar a prenhez");
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Registrar prenhez</Text>
            </View>
            <View style={style.content}>
                <Text style={{ marginBottom: 10 }}>Selecionar Receptora:</Text>
                <SelectList 
                    setSelected={setSelectedReceiver}
                    data={recipients}
                    placeholder="Selecione uma receptora"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                />
            </View>
            <TouchableOpacity onPress={postPregnancy}
                style={[style.listButtonSearch, { width: '25%', height: '11%', display: 'flex', flexDirection: 'row', marginTop: '5%', marginLeft: '60%' }]}>
                <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
