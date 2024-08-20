import React, { useState } from 'react';
import { Text, TextInput, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { SelectList } from 'react-native-dropdown-select-list';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import style from '../components/style';

const API_URL = 'http://3.135.1.128:8080/fiv';

export default ({ navigation }) => {
    const [category, setCategory] = useState('');
    const [items, setItems] = useState([]);

    const categories = [
        { key: 'BULL_REGISTRED', value: 'Touro' },
        { key: 'DONATOR_REGISTRED', value: 'Doadora' },
        { key: 'FIV_REGISTRED', value: 'FIV' },
    ];

    const categoryData = categories.map(cat => ({
        key: cat.key,
        value: cat.value
    }));

    const handleSelect = (selectedKey) => {
        const selectedCategory = categories.find(cat => cat.key === selectedKey);
        if (selectedCategory) {
            setCategory(selectedCategory.key);
        }
    };

    const handleNewFIV = async () => {
        try {
            // Making a POST request
            await axios.post(API_URL);
            // Making a GET request to retrieve updated list
            const response = await axios.get(API_URL);
            setItems(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred while processing your request.');
        }
    };

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
                    <TouchableOpacity key={item.id} style={style.listItem}>
                        <Text>FIV ID: {item.id}</Text>
                        <Text>Coleta dos Oócitos: {item.oocyteCollection || 'N/A'}</Text>
                        <Text>Cultivo: {item.cultivation || 'N/A'}</Text>
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
    );
};
