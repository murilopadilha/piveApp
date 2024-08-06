import React, {useState} from "react";
import { Text, View,  TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LinearGradient from 'react-native-linear-gradient';

import style from "../components/style";
import CadastrarReceptoras from "./menu-sections/CadastrarReceptora";

export default ({ navigation }) => {
    return (
        <SafeAreaView style={{backgroundColor: '#F1F2F4'}}>  
            <View style={[style.divTitle]} >
                <TouchableOpacity>
                    <View style={{marginRight: 50}}>
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
            </View>
            <View style={style.menuContent}>
                <View>
                <TouchableOpacity style={style.menuContentButton} onPress={() => {
                    navigation.navigate('CadastrarReceptora')
                }}>
                    <Image source={require('../images/menu/CadastrarReceptora.png')} style={style.imgsMenu}/>
                </TouchableOpacity>
                <Text style={style.textButtonMenu}>Cadastrar Receptora</Text>
                </View>
                <View>
                <TouchableOpacity style={style.menuContentButton} onPress={() => {
                    navigation.navigate('CadastrarDoadora')
                }}>
                <Image source={require('../images/menu/CadastrarDoadora.png')} style={style.imgsMenu}/>
                </TouchableOpacity>
                <Text style={style.textButtonMenu}>Cadastrar Doadora</Text>
                </View>
                <View>
                <TouchableOpacity style={style.menuContentButton} onPress={() => {
                    navigation.navigate('CadastrarTouro')
                }}>
                <Image source={require('../images/menu/CadastrarTouro.png')} style={style.imgsMenu}/>
                </TouchableOpacity>
                <Text style={style.textButtonMenu}>Cadastrar Touro</Text>
                </View>
                <View>
                <TouchableOpacity style={style.menuContentButton} onPress={() => {
                    navigation.navigate('ReceptorasCadastradas')
                }}>
                <Image source={require('../images/menu/ListarReceptoras.png')} style={style.imgsMenu}/>
                </TouchableOpacity>
                <Text style={style.textButtonMenu}>Receptoras Cadastradas</Text>
                </View>
                <View>
                <TouchableOpacity style={style.menuContentButton} onPress={() => {
                    navigation.navigate('DoadorasCadastradas')
                }}>
                <Image source={require('../images/menu/ListarDoadoras.png')} style={style.imgsMenu}/>
                </TouchableOpacity>
                <Text style={style.textButtonMenu}>Doadoras Cadastradas</Text>
                </View>
                <View>
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