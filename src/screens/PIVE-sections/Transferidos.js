import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from "axios";
import style from "../../components/style";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { IPAdress } from "../../components/APIip";
import { SelectList } from 'react-native-dropdown-select-list'; 

export default ({ route, navigation }) => {
    const { fiv } = route.params; 
    const [newNumber, setNumber] = useState('');
    const [newDate, setDate] = useState('');
    const [newFarmName, setFarmName] = useState('');
    const [transfers, setTransfers] = useState([]); 
    const [recipients, setRecipients] = useState([]); 
    const [selectedTransfer, setSelectedTransfer] = useState(null); 
    const [selectedRecipient, setSelectedRecipient] = useState(null); 

    useEffect(() => {
        const fetchTransfers = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/transfer?fivId=${fiv.id}`);
                setTransfers(response.data);
            } catch (error) {
                Alert.alert("Error", error.response.data);
                console.error(error);
            }
        };

        const fetchRecipients = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/receiver/available`); 
                setRecipients(response.data);
            } catch (error) {
                Alert.alert("Error", "Unable to fetch recipients");
                console.error(error);
            }
        };

        fetchTransfers();
        fetchRecipients();
    }, []);

    const postTransfer = async () => {
        const transferData = {
            fivId: fiv.id,
            date: newDate,
            responsible: newNumber,
            farm: newFarmName,
            recipientId: selectedRecipient 
        };

        try {
            const response = await axios.post(`http://${IPAdress}/transfer`, transferData);
            Alert.alert("Success", "Transferência salva com sucesso.");
            setNumber('');
            setDate('');
            setFarmName('');
            setSelectedRecipient(null);
        } catch (error) {
            Alert.alert("Error", error.response?.data || "Ocorreu um erro");
            console.error(error);
        }
    };

    const transferOptions = transfers.map(transfer => ({
        key: transfer.fivId,
        value: `${transfer.farm} (${transfer.date})`
    }));

    const recipientOptions = recipients.map(recipient => ({
        key: recipient.id, 
        value: `${recipient.name} (${recipient.registrationNumber})`
    }));

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, { marginBottom: 0 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ marginRight: '15%' }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: '20%' }]}>Embriões Transferidos</Text>
            </View>
            <View style={style.content}>
                <Text style={{ marginBottom: 10 }}>Selecionar Transferência:</Text>
                <SelectList 
                    setSelected={setSelectedTransfer}
                    data={transferOptions}
                    placeholder="Selecione uma transferência"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                    onSelect={(selected) => {
                        const selectedData = transfers.find(item => item.fivId === selected);
                        if (selectedData) {
                            setFarmName(selectedData.farm);
                            setDate(selectedData.date);
                            setNumber(selectedData.responsible);
                        }
                    }}
                />
                
                <Text style={{ marginVertical: 10 }}>Selecionar Receptora:</Text>
                <SelectList 
                    setSelected={setSelectedRecipient}
                    data={recipientOptions}
                    placeholder="Selecione uma receptora"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                />
            </View>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Transferencia', { fiv: fiv })}
                    style={[style.listButtonEdit, { marginLeft: '10%', marginTop: '5%', height: '60%', width: '35%', paddingTop: '1%' }]}
                >
                    <FontAwesome6 name="clipboard-list" size={20} color="#E0E0E0" />
                    <Text style={{ color: '#E0E0E0', paddingTop: 1, paddingLeft: 5 }}>Transferências</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[style.listButtonEdit, { marginLeft: '20%', marginTop: '5%', height: '60%', width: '23%', paddingTop: '1%' }]}
                    onPress={postTransfer}
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, { marginLeft: 5, paddingTop: '1%' }]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
