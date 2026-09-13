import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import style from '../../../components/style'

export default function EmbryoDispositionForm({
    label,
    placeholder,
    value,
    isSubmitting,
    onChange,
    onSave,
}) {
    return (
        <>
            <View style={style.content}>
                <Text style={style.label}>{label}</Text>
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={value}
                    style={style.input}
                    onChangeText={onChange}
                />
            </View>
            <View>
                <TouchableOpacity
                    style={[style.button, styles.saveButton]}
                    onPress={onSave}
                    disabled={isSubmitting}
                >
                    <MaterialIcons name="done" size={20} color="#fff" />
                    <Text style={[style.buttonText, styles.saveText]}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    saveButton: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: '40%',
        marginTop: 0,
    },
    saveText: {
        marginLeft: 5,
        paddingBottom: 2,
    },
})
