import React, {useState} from "react";
import { Text, View,  TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LinearGradient from 'react-native-linear-gradient';

import style from "../components/style";
import CadastrarReceptoras from "./menu-sections/CadastrarReceptora";

export default ({ navigation }) => {
    return (
        <SafeAreaView style={{backgroundColor: '#d3d3d3'}}>  
            <View style={[style.divTitle]} >
                <TouchableOpacity>
                    <View style={{marginRight: 50}}>
                    </View>
                </TouchableOpacity>
                <Text style={style.titleText}>PiveApper</Text>
            </View>
            <LinearGradient
                colors={['#2E4BA8', '#d3d3d3']} // Cores do degradê
                start={{ x: 0, y: 1 }} // Início do degradê (esquerda inferior)
                end={{ x: 1, y: 1 }}   // Fim do degradê (centro inferior)
                locations={[0.1, 0.9]}
                style={style.bottomBorder}
            />
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