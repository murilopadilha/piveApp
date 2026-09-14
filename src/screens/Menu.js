import { Text, View,  TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import style from "../components/style";

export default ({ navigation }) => {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={[style.divTitleMain]} >
                <Image source={require('../images/menu/logo.png')} style={styles.logo}/>
                <Text style={style.titleTextMain}>BovInA</Text>
            </View>
            <View style={styles.menuContent}>
                <View>
                    <TouchableOpacity style={styles.menuContentButton} onPress={() => {
                        navigation.navigate('CadastrarReceptora')
                    }}>
                        <Image source={require('../images/menu/CadastrarReceptora.png')} style={styles.menuImage}/>
                    </TouchableOpacity>
                    <Text style={styles.buttonText}>Cadastrar Receptora</Text>
                </View>
                <View>
                    <TouchableOpacity style={styles.menuContentButton} onPress={() => {
                        navigation.navigate('CadastrarDoadora')
                    }}>
                    <Image source={require('../images/menu/CadastrarDoadora.png')} style={styles.menuImage}/>
                    </TouchableOpacity>
                    <Text style={styles.buttonText}>Cadastrar Doadora</Text>
                </View>
                <View>
                    <TouchableOpacity style={styles.menuContentButton} onPress={() => {
                        navigation.navigate('CadastrarTouro')
                    }}>
                    <Image source={require('../images/menu/CadastrarTouro.png')} style={styles.menuImage}/>
                    </TouchableOpacity>
                    <Text style={styles.buttonText}>Cadastrar Touro</Text>
                </View>
                <View>
                    <TouchableOpacity style={styles.menuContentButton} onPress={() => {
                        navigation.navigate('ReceptorasCadastradas')
                    }}>
                    <Image source={require('../images/menu/ListarReceptoras.png')} style={styles.menuImage}/>
                    </TouchableOpacity>
                    <Text style={styles.buttonText}>Receptoras Cadastradas</Text>
                </View>
                <View>
                    <TouchableOpacity style={styles.menuContentButton} onPress={() => {
                        navigation.navigate('DoadorasCadastradas')
                    }}>
                    <Image source={require('../images/menu/ListarDoadoras.png')} style={styles.menuImage}/>
                    </TouchableOpacity>
                    <Text style={styles.buttonText}>Doadoras Cadastradas</Text>
                </View>
                <View>
                    <TouchableOpacity style={styles.menuContentButton} onPress={() => {
                        navigation.navigate('TourosCadastrados')
                    }}>
                    <Image source={require('../images/menu/ListarTouros.png')} style={styles.menuImage}/>
                    </TouchableOpacity>
                    <Text style={styles.buttonText}>Touros Cadastrados</Text>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: '#F1F2F4',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: '2%',
    },
    menuContent: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: '5%',
        marginTop: 0,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        height: '100%',
    },
    menuContentButton: {
        backgroundColor: '#FFFFFF',
        marginTop: '10%',
        margin: '1%',
        width: 150,
        height: 150,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonText: {
        textAlign: 'center',
        fontSize: Platform.OS === 'ios' ? 12 : 10,
    },
    menuImage: {
        width: 125,
        height: 125,
    },
})
