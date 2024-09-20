import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform, Image } from 'react-native';
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
const BULLS_API_URL = `http://${IPAdress}/bull`
const DONORS_API_URL = `http://${IPAdress}/donor`

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
            Alert.alert('Erro', error.message)
        }
    }

    const fetchSecondaryOptions = async (url) => {
        try {
            const response = await axios.get(url)
            const options = response.data.map(item => ({
                key: item.id.toString(),
                value: `${item.name} (${item.registrationNumber || item.breed || item.birth})`
            }));
            setSecondaryOptions(options);
        } catch (error) {
            Alert.alert('Erro', error.message)
        }
    }

    const fetchFilteredFIVs = async (id, type) => {
        const url = type === 'donor' ? `http://${IPAdress}/fiv/donor?donorId=${id}` : `http://${IPAdress}/fiv/bull?bullId=${id}`
        try {
            const response = await axios.get(url)
            setFilteredItems(response.data)
        } catch (error) {
            Alert.alert('Erro', error.message)
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            fetchItems()
            return () => {}
        }, [])
    )

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
            await axios.post(API_URL);
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
            ])
            setIcon('cow')
        } else {
            setCategories([
                { key: 'ALL', value: 'Todas as FIVs' },
                { key: 'IN_PROCESS', value: 'Em processo' },
                { key: 'OOCYTE_COLLECTION_COMPLETED', value: 'Coleta de oócitos completa' },
                { key: 'COMPLETED', value: 'FIV completa' },
            ]);
            setIcon('list-status')
            setSecondaryCategory(null)
            setSecondaryOptions([])
            setSecondaryPlaceholder('Selecione uma opção')

            setCategory('ALL')
            setFilteredItems(items)
        }
    }

    return (
        <SafeAreaView style={{width: '100%', height: '100%'}}>
            <View style={[style.divTitleMain]}>
                <Image source={require('../images/menu/logo.png')} style={{width: 40, height: 40, marginRight: '2%'}}/>
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
            <ScrollView style={style.listPive} showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}>
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
                            <View style={{ display: 'flex', flexDirection: 'row', marginBottom: '1%' }}>
                                <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, marginTop: '0.5%'}}>FIV ID: </Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10, marginTop: '0.5%'}}>{item.id}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: '2%' }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Coleta dos Oócitos: </Text>
                                    {item.status === 'OOCYTE_COLLECTION_COMPLETED' || item.status === 'COMPLETED' ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: '0%' }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Embriões: </Text>
                                    {item.status === 'COMPLETED'  ? (
                                        <MaterialIcons name="done" size={20} color="#555" />
                                    ) : (
                                        <Feather name="x" size={20} color="#555" />
                                    )}
                                </View>
                            </View>
                            <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 5}}>
                                <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Data Asp: </Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10,}}>{item.date ? item.date : '-'}</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'row'}}>
                                <Text style={{ fontWeight: 'bold', fontSize: Platform.OS === 'ios' ? 13 : 10, }}>Cliente/Fazenda: </Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10}}>{item.client ? item.client : '-'}</Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10}}>/</Text>
                                <Text style={{fontSize: Platform.OS === 'ios' ? 13 : 10,}}>{item.farm ? item.farm : '-'}</Text>
                            </View>   
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
                style={[style.listButtonSearch, { paddingTop: '2%',marginTop: '175%', width: '20%', height: '5%', marginLeft: '70%', position: 'absolute', zIndex: 5 }]}
                onPress={() => navigation.navigate('Cabecalho')}
            >
                <Text style={{ fontSize: Platform.OS === 'ios' ? 13 : 10, color: '#FFFFFF', textAlign: 'center', paddingTop: 3 }}>Nova FIV</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}
