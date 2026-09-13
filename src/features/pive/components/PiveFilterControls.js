import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import style from '../../../components/style'

export default function PiveFilterControls({
    primaryOptions,
    icon,
    onPrimarySelect,
    onToggleCatalog,
    secondaryCategory,
    secondaryOptions,
    secondaryPlaceholder,
    onSecondarySelect,
    secondaryOptionsLoading,
    secondaryOptionsError,
    hasLoadedSecondaryOptions,
}) {
    return (
        <>
            <View style={styles.search}>
                <SelectList
                    setSelected={onPrimarySelect}
                    data={primaryOptions}
                    placeholder={"Selecione a opção para filtrar"}
                    searchPlaceholder={"Filtros"}
                    boxStyles={[styles.selectListBox, styles.selectListBoxSpacing]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={styles.selectListDropdown}
                />
                <TouchableOpacity style={styles.toggleButton} onPress={onToggleCatalog}>
                    <MaterialCommunityIcons name={icon} size={30} color="#092955" />
                </TouchableOpacity>
            </View>
            {secondaryCategory && (
                <View style={styles.secondaryContainer}>
                    <SelectList
                        setSelected={onSecondarySelect}
                        data={secondaryOptions}
                        placeholder={secondaryPlaceholder}
                        searchPlaceholder={"Filtros"}
                        boxStyles={[styles.selectListBox, styles.selectListBoxSpacing]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={styles.selectListDropdown}
                    />
                    {secondaryOptionsLoading && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                    {secondaryOptionsError && (
                        <Text style={styles.errorText}>
                            {secondaryOptionsError}
                        </Text>
                    )}
                    {!secondaryOptionsLoading &&
                        hasLoadedSecondaryOptions &&
                        !secondaryOptionsError &&
                        secondaryOptions.length === 0 && (
                            <Text style={styles.emptyText}>
                                Nenhuma opção encontrada.
                            </Text>
                        )}
                </View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    search: {
        marginTop: 5,
        marginLeft: 20,
        display: 'flex',
        flexDirection: 'row',
    },
    selectListBox: {
        width: 280,
        height: 40,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: 'transparent',
        backgroundColor: '#FFFFFF',
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 15,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    selectListBoxSpacing: {
        marginRight: 5,
    },
    selectListDropdown: {
        marginTop: 0,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: 'transparent',
        backgroundColor: '#FFFFFF',
        width: 280,
    },
    toggleButton: {
        paddingTop: 5,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 5,
        height: 40,
    },
    secondaryContainer: {
        marginTop: 1,
        marginLeft: 20,
    },
    errorText: {
        color: '#B00020',
        marginTop: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
    },
})
