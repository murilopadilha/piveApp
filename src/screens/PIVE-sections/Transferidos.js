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
    const { fiv, id } = route.params
    const [newFarm, setFarm] = useState('')
    const [oocyteCollection, setOocyteCollection] = useState(null)
    const [transfers, setTransfers] = useState([])
    const [recipients, setRecipients] = useState([]) 
    const [selectedTransfer, setSelectedTransfer] = useState(null) 
    const [selectedReceiver, setSelectedReceiver] = useState(null)  

    useEffect(() => {
        const fetchTransfers = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/transfer?fivId=${fiv.id}`)
                console.log("Transferências recebidas:", response.data)
                setTransfers(response.data)
            } catch (error) {
                Alert.alert("Erro", error.response?.data || "Erro ao buscar transferências")
                console.error(error)
            }
        }

        const fetchOocyteCollection = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/oocyte-collection/${id}`)
                setOocyteCollection(response.data)
            } catch (error) {
                Alert.alert("Erro", error.response?.data || "Erro ao buscar coleta de oócitos")
                console.error(error)
            }
        }

        const fetchRecipients = async () => {
            try {
                const response = await axios.get(`http://${IPAdress}/receiver/available`)
                setRecipients(response.data)
            } catch (error) {
                Alert.alert("Erro", "Não foi possível buscar as receptoras")
            }
        }

        fetchTransfers()
        fetchRecipients()
        fetchOocyteCollection()
    }, [fiv.id, id])

    const postTransfer = async () => {
        if (!oocyteCollection || !selectedTransfer || !selectedReceiver) {
            Alert.alert("Erro", "Por favor, selecione todos os campos.")
            return;
        }

        const transferData = {
            productionId: oocyteCollection.embryoProduction.id,
            transferId: selectedTransfer, 
            receiverId: selectedReceiver
        }

        try {
            const response = await axios.post(`http://${IPAdress}/embryo/transfer`, transferData)
            Alert.alert("Successo", "Transferência salva com sucesso.")
        } catch (error) {
            Alert.alert("Erro", error.response?.data || "Ocorreu um erro")
            console.error(error)
        }
    }

    const transferOptions = transfers.map(transfer => ({
        key: transfer.id.toString(), 
        value: `${transfer.farm} (${transfer.date})`
    }))
    
    const recipientOptions = recipients.map(recipient => ({
        key: recipient.id.toString(),
        value: `${recipient.name} (${recipient.registrationNumber})`
    }))

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
                    setSelected={selected => {
                        console.log("Transferência selecionada:", selected);
                        setSelectedTransfer(selected);

                        const selectedData = transfers.find(item => item.id.toString() === selected)
                        console.log("Dados da transferência selecionada:", selectedData)

                        if (selectedData) {
                            setFarm(selectedData.farm);
                        } else {
                            console.log("Transferência não encontrada.");
                        }
                    }}
                    data={transferOptions}
                    placeholder="Selecione uma transferência"
                    boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                />
                
                <Text style={{ marginVertical: 10 }}>Selecionar Receptora:</Text>
                <SelectList 
                    setSelected={selected => {
                        console.log("Receptora selecionada:", selected);
                        const selectedData = recipients.find(item => item.id.toString() === selected);
                        if (selectedData) {
                            setSelectedReceiver(selectedData.id);
                        }
                    }}
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
    )
}
