import React, { useState, useEffect } from 'react';
import { Text, TextInput, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import style from '../components/style';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { SelectList } from 'react-native-dropdown-select-list';
import { IPAdress } from '../components/APIip';

const API_URL = `http://${IPAdress}/fiv`

export default ({ navigation }) => {
    const [category, setCategory] = useState('')
    const [items, setItems] = useState([])

    const categories = [
        { key: 'BULL_REGISTRED', value: 'Touro' },
        { key: 'DONATOR_REGISTRED', value: 'Doadora' },
        { key: 'FIV_REGISTRED', value: 'FIV' },
    ]

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const fetchItems = async () => {
        try {
            const response = await axios.get(API_URL)
            setItems(response.data)
        } catch (error) {
            
        }
    }

    useEffect(() => {
        fetchItems()

        const intervalId = setInterval(() => {
            fetchItems()
        }, 1000 * 3)

        return () => clearInterval(intervalId)
    }, [])

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setCategory(selectedCategory.key)
        }
    }

    const handleNewFIV = async () => {
        try {
            await axios.post(API_URL)
            Alert.alert(
                "Sucesso",
                "FIV criada com sucesso!",
                [{ text: "OK" }]
            )
        } catch (error) {
            console.error(error)
            Alert.alert('Erro', 'Ocorreu um erro ao processar sua requisição.')
        }
    }

    return (
        <SafeAreaView>
            <View style={[style.divTitle]} >
                <TouchableOpacity>
                    <View style={{ marginRight: 50 }}></View>
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
            </View>
            <View style={style.searchPive}>
                <TextInput
                    placeholder="Filtrar FIV"
                    style={style.input}
                />
                <SelectList
                    setSelected={handleSelect}
                    data={categoryData}
                    placeholder={"Selecione"}
                    boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={[style.selectListDropdownPive, { marginLeft: 10, marginRight: 5 }]}
                />
                <TouchableOpacity>
                    <Ionicons style={{ marginRight: 5 }} name="search-circle-sharp" size={45} color="#092955" />
                </TouchableOpacity>
            </View>
            <ScrollView style={style.listPive}>
                {items.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={style.listItemPive}
                        onPress={() => navigation.navigate('FivInfo', { fiv: item })}
                    >
                        <View style={{ display: 'flex', flexDirection: 'column', width: 320 }}>
                            <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 20 }}>
                                <Text style={{ fontWeight: 'bold' }}>FIV ID: </Text>
                                <Text>{item.id}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 25 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Coleta dos Oócitos: </Text>
                                    {item.oocyteCollection ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 25 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Cultivo: </Text>
                                    {item.cultivation ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                            </View>
                            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontWeight: 'bold' }}>Data Asp: </Text>
                                <Text>{item.oocyteCollection ? item.oocyteCollection.date : '-'}</Text>
                                <Text style={{ fontWeight: 'bold' }}>Total Emb: </Text>
                                <Text>{item.cultivation ? item.cultivation.totalEmbryos : '-'}</Text>
                                <Text style={{ fontWeight: 'bold' }}>Emb Via: </Text>
                                <Text>{item.cultivation ? item.cultivation.viableEmbryos : '-'}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
                style={[style.listButtonSearch, { width: 80, height: 35, marginLeft: 155 }]}
                onPress={handleNewFIV}
            >
                <Text style={{ color: '#FFFFFF', textAlign: 'center', paddingTop: 3 }}>Nova FIV</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}
