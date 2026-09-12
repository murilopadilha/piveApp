import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import style from "../../components/style";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import { listAvailableDonors } from '../../api/donorService';
import { listBulls } from '../../api/bullService';
import { normalizeApiError } from '../../api/errors';
import useOocyteCollectionSubmission from '../../features/pive/hooks/useOocyteCollectionSubmission';

export default ({ route, navigation }) => {
    const [donorCattleId, setDonorCattleId] = useState(null)
    const [bullId, setBullId] = useState(null)
    const [totalOocytes, setTotalOocytes] = useState('')
    const [viableOocytes, setViableOocytes] = useState('')
    const [donors, setDonors] = useState([])
    const [bulls, setBulls] = useState([])
    const { fiv } = route.params;
    const isScreenFocusedRef = React.useRef(false)
    const activeFivIdRef = React.useRef(fiv.id)
    const donorsAbortControllerRef = React.useRef(null)
    const donorsRequestIdRef = React.useRef(0)
    const bullsAbortControllerRef = React.useRef(null)
    const bullsRequestIdRef = React.useRef(0)
    const loadErrorAlertShownRef = React.useRef(false)
    const donorCattleIdRef = React.useRef(donorCattleId)
    const bullIdRef = React.useRef(bullId)
    const totalOocytesRef = React.useRef(totalOocytes)
    const viableOocytesRef = React.useRef(viableOocytes)
    const {
        isSubmitting,
        submitOocyteCollection,
    } = useOocyteCollectionSubmission({ fivId: fiv.id })

    activeFivIdRef.current = fiv.id
    donorCattleIdRef.current = donorCattleId
    bullIdRef.current = bullId
    totalOocytesRef.current = totalOocytes
    viableOocytesRef.current = viableOocytes

    useFocusEffect(
        React.useCallback(() => {
            isScreenFocusedRef.current = true
            loadErrorAlertShownRef.current = false
            const currentFivId = fiv.id

            const fetchAvailableDonors = async () => {
                donorsAbortControllerRef.current?.abort()
                const abortController = new AbortController()
                donorsAbortControllerRef.current = abortController
                const requestId = ++donorsRequestIdRef.current

                try {
                    const donorData = await listAvailableDonors(currentFivId, {
                        signal: abortController.signal,
                    })

                    if (
                        requestId !== donorsRequestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeFivIdRef.current !== currentFivId
                    ) return

                    setDonors(donorData)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar doadoras e touros.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== donorsRequestIdRef.current ||
                        !isScreenFocusedRef.current ||
                        activeFivIdRef.current !== currentFivId
                    ) return

                    if (!loadErrorAlertShownRef.current) {
                        loadErrorAlertShownRef.current = true
                        Alert.alert('Erro', apiError.message)
                    }
                } finally {
                    if (requestId === donorsRequestIdRef.current) {
                        donorsAbortControllerRef.current = null
                    }
                }
            }

            const fetchBulls = async () => {
                bullsAbortControllerRef.current?.abort()
                const abortController = new AbortController()
                bullsAbortControllerRef.current = abortController
                const requestId = ++bullsRequestIdRef.current

                try {
                    const bullData = await listBulls({
                        signal: abortController.signal,
                    })

                    if (
                        requestId !== bullsRequestIdRef.current ||
                        !isScreenFocusedRef.current
                    ) return

                    setBulls(bullData)
                } catch (requestError) {
                    const apiError = normalizeApiError(
                        requestError,
                        'Não foi possível carregar doadoras e touros.'
                    )
                    if (apiError.isCanceled) return
                    if (
                        requestId !== bullsRequestIdRef.current ||
                        !isScreenFocusedRef.current
                    ) return

                    if (!loadErrorAlertShownRef.current) {
                        loadErrorAlertShownRef.current = true
                        Alert.alert('Erro', apiError.message)
                    }
                } finally {
                    if (requestId === bullsRequestIdRef.current) {
                        bullsAbortControllerRef.current = null
                    }
                }
            }

            fetchAvailableDonors()
            fetchBulls()

            return () => {
                isScreenFocusedRef.current = false

                donorsRequestIdRef.current += 1
                donorsAbortControllerRef.current?.abort()
                donorsAbortControllerRef.current = null

                bullsRequestIdRef.current += 1
                bullsAbortControllerRef.current?.abort()
                bullsAbortControllerRef.current = null
            }
        }, [fiv.id])
    )

    function confirmSave() {
        Alert.alert(
            "Confirmar",
            "Você tem certeza de que deseja finalizar essa coleta?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Finalizar",
                    onPress: () => handleSaveAndFinish()
                }
            ]
        )
    }

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || new Date()
        const formattedDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}`
        setDateOfOocyteCollection(formattedDate)
    }

    const showDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: onChangeDate,
        })
    }

    const donorOptions = donors.map(donor => ({
        key: donor.id,
        value: `${donor.name} (${donor.registrationNumber})`
    }))

    const bullOptions = bulls.map(bull => ({
        key: bull.id,
        value: `${bull.name} (${bull.registrationNumber})`
    }))

    const handleSave = async () => {
        console.log(totalOocytes)

        const submittedFivId = fiv.id
        const submittedDonorCattleId = donorCattleId
        const submittedBullId = bullId
        const submittedTotalOocytes = totalOocytes
        const submittedViableOocytes = viableOocytes
        const payload = {
            fivId: submittedFivId,
            donorCattleId: submittedDonorCattleId,
            bullId: submittedBullId,
            totalOocytes: parseInt(submittedTotalOocytes) || 0,
            viableOocytes: parseInt(submittedViableOocytes) || 0,
        }

        await submitOocyteCollection({
            payload,
            errorFallbackMessage: 'Não foi possível salvar a coleta.',
            onSuccess: () => {
                Alert.alert('Successo', 'Coleta salva com sucesso!')
                if (donorCattleIdRef.current === submittedDonorCattleId) {
                    donorCattleIdRef.current = null
                    setDonorCattleId(null)
                }
                if (bullIdRef.current === submittedBullId) {
                    bullIdRef.current = null
                    setBullId(null)
                }
                if (totalOocytesRef.current === submittedTotalOocytes) {
                    totalOocytesRef.current = ''
                    setTotalOocytes('')
                }
                if (viableOocytesRef.current === submittedViableOocytes) {
                    viableOocytesRef.current = ''
                    setViableOocytes('')
                }
            },
            onError: (message) => {
                Alert.alert(message)
            },
        })
    }

    const handleSaveAndFinish = async () => {
        console.log(totalOocytes)

        const submittedFivId = fiv.id
        const submittedDonorCattleId = donorCattleId
        const submittedBullId = bullId
        const submittedTotalOocytes = totalOocytes
        const submittedViableOocytes = viableOocytes
        const payload = {
            fivId: submittedFivId,
            finished: true,
            donorCattleId: submittedDonorCattleId,
            bullId: submittedBullId,
            totalOocytes: parseInt(submittedTotalOocytes) || 0,
            viableOocytes: parseInt(submittedViableOocytes) || 0,
        }

        await submitOocyteCollection({
            payload,
            errorFallbackMessage: 'Não foi possível salvar e concluir a coleta.',
            onSuccess: () => {
                Alert.alert('Successo', 'Coleta salva e concluída com sucesso!')
                if (donorCattleIdRef.current === submittedDonorCattleId) {
                    donorCattleIdRef.current = null
                    setDonorCattleId(null)
                }
                if (bullIdRef.current === submittedBullId) {
                    bullIdRef.current = null
                    setBullId(null)
                }
                if (totalOocytesRef.current === submittedTotalOocytes) {
                    totalOocytesRef.current = ''
                    setTotalOocytes('')
                }
                if (viableOocytesRef.current === submittedViableOocytes) {
                    viableOocytesRef.current = ''
                    setViableOocytes('')
                }
            },
            onError: (message) => {
                Alert.alert('Erro', message)
            },
        })
    }

    return (
        <SafeAreaView style={style.menu}>
            <View style={[style.divTitle, {marginBottom: 0}]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ marginRight: 80 }}>
                        <AntDesign name="arrowleft" size={24} color='#092955' />
                    </View>
                </TouchableOpacity>
                <Text style={[style.titleText, { marginRight: 120 }]}>Coleta Oócitos</Text>
            </View>
            <View style={[style.content, {marginTop: 0, paddingTop: 0}]}>
                <ScrollView style={{ height: '90%'}}
                showsVerticalScrollIndicator={false}>
                    <Text style={style.label}>Doadora:</Text>
                    <SelectList
                        setSelected={(value) => {
                            donorCattleIdRef.current = value
                            setDonorCattleId(value)
                        }}
                        data={donorOptions}
                        placeholder={"Selecione a doadora"}
                        boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                    />
                    <Text style={style.label}>Touro:</Text>
                    <SelectList
                        setSelected={(value) => {
                            bullIdRef.current = value
                            setBullId(value)
                        }}
                        data={bullOptions}
                        placeholder={"Selecione o touro"}
                        boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                        inputStyles={style.selectListInput}
                        dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
                    />
                    <Text style={[style.label, { textAlign: 'center', marginTop: 20 }]}>Oócitos:</Text>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: '11%' }}>
                        <View>
                            <Text style={style.label}>Total:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Total"
                                style={[style.input, { width: 70, textAlign: 'center', paddingLeft: 0 }]}
                                value={totalOocytes}
                                onChangeText={(text) => {
                                    totalOocytesRef.current = text
                                    setTotalOocytes(text)
                                }}
                            />
                        </View>
                        <View>
                            <Text style={style.label}>Viáveis:</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Viáveis"
                                style={[style.input, { width: 70, textAlign: 'center', paddingLeft: 0 }]}
                                value={viableOocytes}
                                onChangeText={(text) => {
                                    viableOocytesRef.current = text
                                    setViableOocytes(text)
                                }}
                            />
                        </View>
                        <View>
                        </View>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleSave} disabled={isSubmitting} style={[style.listButtonSearch, { width: 90, height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}>
                            <MaterialIcons name="done" size={20} color="white" style={{ paddingLeft: 5, paddingTop: 3 }} />
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[style.listButtonSearch, { width: '50%', height: 35, display: 'flex', flexDirection: 'row', marginTop: 20 }]}
                        disabled={isSubmitting}
                        onPress={confirmSave}>
                            <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Salvar e Finalizar</Text>
                            <AntDesign name="right" size={16} color="#FFFFFF" style={{ paddingLeft: 10, paddingTop: 5 }} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}
