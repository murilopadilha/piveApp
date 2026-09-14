import React, { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import style from "../../components/style";
import piveStyles from "../../features/pive/styles";
import { getFivDetails } from "../../api/fivService";
import { normalizeApiError } from "../../api/errors";

export default ({ route, navigation }) => {
    const { fiv } = route.params
    const [oocyteCollections, setOocyteCollections] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fiv.id)
    const loadedFivIdRef = React.useRef(null)
    const abortControllerRef = React.useRef(null)
    const requestIdRef = React.useRef(0)

    activeFivIdRef.current = fiv.id

    useFocusEffect(
        React.useCallback(() => {
            const currentFivId = fiv.id
            isScreenFocusedRef.current = true

            if (loadedFivIdRef.current !== currentFivId) {
                loadedFivIdRef.current = null
                setOocyteCollections([])
                setError(null)
                setHasLoaded(false)
                setLoading(true)
            }

            const fetchData = async () => {
                abortControllerRef.current?.abort()
                const abortController = new AbortController()
                abortControllerRef.current = abortController
                const requestId = ++requestIdRef.current

                setLoading(true)

                try {
                    const responseData = await getFivDetails(currentFivId, {
                        signal: abortController.signal,
                    })

                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeFivIdRef.current !== currentFivId
                    ) return

                    setOocyteCollections(responseData.oocyteCollections)
                    loadedFivIdRef.current = currentFivId
                    setHasLoaded(true)
                    setError(null)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar as coletas de oócitos.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== requestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeFivIdRef.current !== currentFivId
                    ) return
                    setError(apiError.message)
                } finally {
                    if (requestId === requestIdRef.current) {
                        abortControllerRef.current = null
                        if (
                            isScreenFocusedRef.current &&
                            activeFivIdRef.current === currentFivId
                        ) {
                            setLoading(false)
                        }
                    }
                }
            }

            fetchData()

            return () => {
                isScreenFocusedRef.current = false
                requestIdRef.current += 1
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
            }
        }, [fiv.id])
    )

    if (loading && !hasLoaded) {
        return (
            <SafeAreaView style={style.menu}>
                <ActivityIndicator size="small" color="#092955" />
            </SafeAreaView>
        )
    }

    if (error && !hasLoaded) {
        return (
            <SafeAreaView style={style.menu}>
                <Text>Error: {error}</Text>
            </SafeAreaView>
        )
    }

    const handlePress = (id) => {
        navigation.navigate('Cultivo', { oocyteCollectionId: id })
    }

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity style={styles.item} onPress={() => handlePress(item.id)}>
                <View style={styles.row}>
                    <Text style={styles.label}>Doadora:</Text>
                    <Text style={styles.value}>{item.donorCattle?.registrationNumber || '-'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Touro:</Text>
                    <Text style={styles.value}>{item.bull?.registrationNumber || '-'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Total Oócitos:</Text>
                    <Text style={styles.value}>{item.totalOocytes}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Oócitos Viáveis:</Text>
                    <Text style={styles.value}>{item.viableOocytes}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Aproveitamento Embriões:</Text>
                    {item.embryoProduction
                        ? <Text style={styles.value}>{item.embryoProduction.embryosPercentage ?? '-'}</Text>
                        : <Text style={styles.value}>-</Text>
                    }
                </View>
            </TouchableOpacity>
        </View>
    )

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, piveStyles.sectionHeader]}>
                <TouchableOpacity onPress={() => navigation.navigate('FivInfo', { fiv: fiv })}>
                    <View style={piveStyles.backButton}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, piveStyles.sectionTitle]}>Coletas realizadas</Text>
            </View>
            {error && (
                <Text style={piveStyles.loadError}>
                    Error: {error}
                </Text>
            )}
            <FlatList
                data={oocyteCollections}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    !loading && hasLoaded && !error ? (
                        <Text style={{ textAlign: 'center', marginTop: 10 }}>
                            Nenhuma coleta encontrada.
                        </Text>
                    ) : null
                }
                ListFooterComponent={
                    loading && hasLoaded ? (
                        <ActivityIndicator size="small" color="#092955" />
                    ) : null
                }
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 10,
    },
    itemContainer: {
        marginBottom: 10,
    },
    item: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
        fontWeight: 'bold',
    },
    value: {
        fontSize: Platform.OS === 'ios' ? 13 : 10,
    },
})
