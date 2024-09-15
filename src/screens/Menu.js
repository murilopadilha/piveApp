import React, {useState} from "react";
import { Text, View,  TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import style from "../components/style";
import CadastrarReceptoras from "./menu-sections/CadastrarReceptora";

export default ({ navigation }) => {
    return (
        <SafeAreaView style={{backgroundColor: '#F1F2F4'}}>  
            <View style={[style.divTitleMain]} >
                <MaterialCommunityIcons style={{ marginRight: 3 }} name="cow" size={34} color="#092955" />
                <Text style={style.titleTextMain}>BovInA</Text>
            </View>
            <View style={style.menuContent}>
                <View style={style.squareButtonMenu}>
                    <TouchableOpacity style={style.menuContentButton} onPress={() => {
                        navigation.navigate('CadastrarReceptora')
                    }}>
                        <Image source={require('../images/menu/CadastrarReceptora.png')} style={style.imgsMenu}/>
                    </TouchableOpacity>
                    <Text style={style.textButtonMenu}>Cadastrar Receptora</Text>
                </View>
                <View style={style.squareButtonMenu}>
                    <TouchableOpacity style={style.menuContentButton} onPress={() => {
                        navigation.navigate('CadastrarDoadora')
                    }}>
                    <Image source={require('../images/menu/CadastrarDoadora.png')} style={style.imgsMenu}/>
                    </TouchableOpacity>
                    <Text style={style.textButtonMenu}>Cadastrar Doadora</Text>
                </View>
                <View style={style.squareButtonMenu}>
                    <TouchableOpacity style={style.menuContentButton} onPress={() => {
                        navigation.navigate('CadastrarTouro')
                    }}>
                    <Image source={require('../images/menu/CadastrarTouro.png')} style={style.imgsMenu}/>
                    </TouchableOpacity>
                    <Text style={style.textButtonMenu}>Cadastrar Touro</Text>
                </View>
                <View style={style.squareButtonMenu}>
                    <TouchableOpacity style={style.menuContentButton} onPress={() => {
                        navigation.navigate('ReceptorasCadastradas')
                    }}>
                    <Image source={require('../images/menu/ListarReceptoras.png')} style={style.imgsMenu}/>
                    </TouchableOpacity>
                    <Text style={style.textButtonMenu}>Receptoras Cadastradas</Text>
                </View>
                <View style={style.squareButtonMenu}>
                    <TouchableOpacity style={style.menuContentButton} onPress={() => {
                        navigation.navigate('DoadorasCadastradas')
                    }}>
                    <Image source={require('../images/menu/ListarDoadoras.png')} style={style.imgsMenu}/>
                    </TouchableOpacity>
                    <Text style={style.textButtonMenu}>Doadoras Cadastradas</Text>
                </View>
                <View style={style.squareButtonMenu}>
                    <TouchableOpacity style={style.menuContentButton} onPress={() => {
                        navigation.navigate('TourosCadastrados')
                    }}>
                    <Image source={require('../images/menu/ListarTouros.png')} style={style.imgsMenu}/>
                    </TouchableOpacity>
                    <Text style={style.textButtonMenu}>Touros Cadastrados</Text>
                </View>
            </View>
        </SafeAreaView>
    )
}