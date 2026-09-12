import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import style from '../../../components/style'
import stylesEmbryos from '../../../components/stylesEmbryos'

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
            <View style={style.searchPive}>
                <SelectList
                    setSelected={onPrimarySelect}
                    data={primaryOptions}
                    placeholder={"Selecione a opção para filtrar"}
                    searchPlaceholder={"Filtros"}
                    boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                    inputStyles={style.selectListInput}
                    dropdownStyles={style.selectListDropdownPive}
                />
                <TouchableOpacity style={stylesEmbryos.buttonSearchFiv} onPress={onToggleCatalog}>
                    <MaterialCommunityIcons name={icon} size={30} color="#092955" />
                </TouchableOpacity>
            </View>
            {secondaryCategory && (
                <View style={{ marginTop: 1, marginLeft: 20 }}>
                    <SelectList
                        setSelected={onSecondarySelect}
                        data={secondaryOptions}
                        placeholder={secondaryPlaceholder}
                        searchPlaceholder={"Filtros"}
                        boxStyles={[style.selectListBoxPive, { marginRight: 5 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={style.selectListDropdownPive}
                    />
                    {secondaryOptionsLoading && (
                        <ActivityIndicator size={25} color="#092955" />
                    )}
                    {secondaryOptionsError && (
                        <Text style={{ color: '#B00020', marginTop: 5 }}>
                            {secondaryOptionsError}
                        </Text>
                    )}
                    {!secondaryOptionsLoading &&
                        hasLoadedSecondaryOptions &&
                        !secondaryOptionsError &&
                        secondaryOptions.length === 0 && (
                            <Text style={{ textAlign: 'center', marginTop: 10 }}>
                                Nenhuma opção encontrada.
                            </Text>
                        )}
                </View>
            )}
        </>
    )
}
