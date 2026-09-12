import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import style from '../../../components/style'

export default function CultivationSummary({
    embryoProduction,
    onOpenDiscarded,
    onOpenFrozen,
    onOpenTransferred,
}) {
    return (
        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                    <Text style={[style.text, { fontWeight: 'bold' }]}>Total de Embriões:</Text>
                    <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{embryoProduction.totalEmbryos}</Text>
                </View>
                <View>
                    <Text style={[style.text, { fontWeight: 'bold' }]}>Embriões registrados:</Text>
                    <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{embryoProduction.embryosRegistered}/{embryoProduction.totalEmbryos}</Text>
                </View>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '10%' }}>
                <View>
                    <Text style={[style.text, { fontWeight: 'bold' }]}>Transferidos:</Text>
                    <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{embryoProduction.numberTransferredEmbryos}</Text>
                </View>
                <View>
                    <Text style={[style.text, { fontWeight: 'bold' }]}>Congelados:</Text>
                    <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{embryoProduction.numberFrozenEmbryos}</Text>
                </View>
                <View>
                    <Text style={[style.text, { fontWeight: 'bold' }]}>Descartados:</Text>
                    <Text style={{ alignSelf: 'center', marginRight: '3%' }}>{embryoProduction.numberDiscardedEmbryos}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: '20%' }}>
                <TouchableOpacity
                    onPress={onOpenDiscarded}
                    style={[style.listButtonSearch, { width: '30%', paddingLeft: '0%', paddingBottom: '2%' }]}
                >
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Descartados</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onOpenFrozen}
                    style={[style.listButtonSearch, { width: '30%' }]}
                >
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Congelados</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onOpenTransferred}
                    style={[style.listButtonSearch, { width: '30%', paddingLeft: '0%', paddingBottom: '2%' }]}
                >
                    <Text style={{ color: '#FFFFFF', paddingTop: 3, paddingLeft: 10 }}>Transferidos</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
