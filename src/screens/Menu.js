import { Text, View, TouchableOpacity, StyleSheet, Image, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import style from "../components/style";
import { ANIMAL_ROUTES } from '../features/animals/routes';

export default ({ navigation, showCanonicalDirectory = false }) => {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={[style.divTitleMain]} >
                <Image source={require('../images/menu/logo.png')} style={styles.logo}/>
                <Text style={style.titleTextMain}>BovInA</Text>
            </View>
            <ScrollView contentContainerStyle={styles.menuContent}>
                {showCanonicalDirectory ? (
                    <View>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Abrir diretório de animais"
                            accessibilityHint="Consulta identidades e históricos de animais"
                            style={styles.menuContentButton}
                            onPress={() => navigation.navigate(ANIMAL_ROUTES.SEARCH)}
                        >
                            <MaterialCommunityIcons
                                name="text-box-search-outline"
                                size={76}
                                color="#092955"
                            />
                        </TouchableOpacity>
                        <Text style={styles.buttonText}>Diretório de Animais</Text>
                    </View>
                ) : null}
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
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
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
        paddingBottom: 120,
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
