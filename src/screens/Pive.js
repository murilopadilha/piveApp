import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { SelectList } from 'react-native-dropdown-select-list';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import style from '../components/style';
import stylesEmbryos from '../components/stylesEmbryos';
import { IPAdress } from '../components/APIip';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = `http://${IPAdress}/fiv`
const BULLS_API_URL = `http://18.218.115.38:8080/bull`
const DONORS_API_URL = `http://18.218.115.38:8080/donor`

export default ({ navigation }) => {
    const [category, setCategory] = useState('ALL')
    const [items, setItems] = useState([])
    const [filteredItems, setFilteredItems] = useState([])
    const [categories, setCategories] = useState([
        { key: 'ALL', value: 'Todas as FIVs'},
        { key: 'IN_PROCESS', value: 'Em processo' },
        { key: 'OOCYTE_COLLECTION_COMPLETED', value: 'Coleta de oócitos completa' },
        { key: 'COMPLETED', value: 'FIV completa' },
    ])
    const [icon, setIcon] = useState('list-status')
    const [secondaryOptions, setSecondaryOptions] = useState([])
    const [secondaryCategory, setSecondaryCategory] = useState(null)
    const [secondaryPlaceholder, setSecondaryPlaceholder] = useState('Selecione uma opção')
    const [selectedSecondary, setSelectedSecondary] = useState(null)

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }))

    const fetchItems = async () => {
        try {
            const response = await axios.get(API_URL)
            setItems(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchSecondaryOptions = async (url) => {
        try {
            const response = await axios.get(url)
            const options = response.data.map(item => ({
                key: item.id.toString(),
                value: `${item.name} (${item.registrationNumber || item.breed || item.birth})`
            }))
            setSecondaryOptions(options);
        } catch (error) {
            console.error(error)
        }
    }

    const fetchFilteredFIVs = async (id, type) => {
        const url = type === 'donor' ? `http://18.218.115.38:8080/fiv/donor?donorId=${id}` : `http://18.218.115.38:8080/fiv/bull?bullId=${id}`
        try {
            const response = await axios.get(url)
            setFilteredItems(response.data)
        } catch (error) {
            console.error(error);
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            fetchItems()

            // No interval needed, just clean up when the screen is unfocused
            return () => {
                // Any clean up code if necessary
            }
        }, [])
    );

    useEffect(() => {
        if (category === 'ALL') {
            setFilteredItems(items)
        } else {
            setFilteredItems(items.filter(item => item.status === category))
        }
    }, [category, items])

    const handleSelect = async (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey)
        if (selectedCategory) {
            setCategory(selectedCategory.key)
            if (selectedKey === 'donor') {
                fetchSecondaryOptions(DONORS_API_URL)
                setSecondaryCategory('donor')
                setSecondaryPlaceholder('Selecione uma doadora')
            } else if (selectedKey === 'bull') {
                fetchSecondaryOptions(BULLS_API_URL)
                setSecondaryCategory('bull')
                setSecondaryPlaceholder('Selecione um touro')
            } else {
                setSecondaryCategory(null)
                setSecondaryOptions([])
                setSecondaryPlaceholder('Selecione uma opção')
                setFilteredItems(items.filter(item => item.status === selectedKey))
            }
        }
    }

    const handleSecondarySelect = (selectedKey) => {
        const selected = secondaryOptions.find(option => option.key === selectedKey)
        if (selected) {
            setSelectedSecondary(selectedKey)
            fetchFilteredFIVs(selectedKey, secondaryCategory)
        }
    }

    const handleNewFIV = async () => {
        try {
            await axios.post(API_URL)
            Alert.alert("Sucesso", "FIV criada com sucesso!", [{ text: "OK" }])
        } catch (error) {
            console.error(error)
            Alert.alert('Erro', 'Ocorreu um erro ao processar sua requisição.')
        }
    }

    const toggleCategory = () => {
        if (icon === 'list-status') {
            setCategories([
                { key: 'donor', value: 'Doadoras' },
                { key: 'bull', value: 'Touros' },
            ]);
            setIcon('cow');
        } else {
            setCategories([
                { key: 'ALL', value: 'Todas as FIVs'},
                { key: 'IN_PROCESS', value: 'Em processo' },
                { key: 'OOCYTE_COLLECTION_COMPLETED', value: 'Coleta de oócitos completa' },
                { key: 'COMPLETED', value: 'FIV completa' },
            ])
            setIcon('list-status')
            setSecondaryCategory(null)
            setSecondaryOptions([])
            setSecondaryPlaceholder('Selecione uma opção')
            setFilteredItems(items.filter(item => item.status === category))
        }
    }

    return (
        <SafeAreaView>
            <View style={[style.divTitleMain]}>
                <MaterialCommunityIcons style={{ marginRight: 3 }} name="cow" size={34} color="#092955" />
                <Text style={style.titleTextMain}>BovInA</Text>
            </View>
            <View style={style.searchPive}>
                <SelectList
                    setSelected={handleSelect}
                    data={categoryData}
                    placeholder={"Selecione a opção para filtrar"}
                    boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={style.selectListDropdownPive}
                />
                <TouchableOpacity style={stylesEmbryos.buttonSearchFiv} onPress={toggleCategory}>
                    <MaterialCommunityIcons name={icon} size={30} color="#092955" />
                </TouchableOpacity>
            </View>
            {secondaryCategory && (
                <View style={{ marginTop: 1, marginLeft: 20 }}>
                    <SelectList
                        setSelected={handleSecondarySelect}
                        data={secondaryOptions}
                        placeholder={secondaryPlaceholder}
                        boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={style.selectListDropdownPive}
                    />
                </View>
            )}
            <ScrollView style={style.listPive} showsVerticalScrollIndicator={false}>
                {filteredItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[style.listItemPive, { 
                            shadowColor: '#000', 
                            shadowOffset: { width: 0, height: 3 }, 
                            shadowOpacity: 0.3, 
                            shadowRadius: 4, 
                            elevation: 5,
                        }]}
                        onPress={() => navigation.navigate('FivInfo', { fiv: item })}
                    >
                        <View style={{ display: 'flex', flexDirection: 'column', width: 320 }}>
                            <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 20 }}>
                                <Text style={{ fontWeight: 'bold' }}>FIV ID: </Text>
                                <Text>{item.id}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 25 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Coleta dos Oócitos: </Text>
                                    {item.status === 'OOCYTE_COLLECTION_COMPLETED' || item.status === 'COMPLETED' ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 25 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Cultivo: </Text>
                                    {item.status === 'COMPLETED'  ? (
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
                style={[style.listButtonSearch, { marginTop: 650, width: 80, height: 35, marginLeft: 260, position: 'absolute', zIndex: 5 }]}
                onPress={handleNewFIV}
            >
                <Text style={{ color: '#FFFFFF', textAlign: 'center', paddingTop: 3 }}>Nova FIV</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}
