import React from 'react'
import { Text, View } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

import style from '../../../components/style'

export default function EmbryoTransferSelectors({
    transferOptions,
    recipientOptions,
    showNoTransfers,
    showNoRecipients,
    onTransferSelect,
    onRecipientSelect,
}) {
    return (
        <View style={style.content}>
            <Text style={{ marginBottom: 10 }}>Selecionar Transferência:</Text>
            <SelectList
                setSelected={onTransferSelect}
                data={transferOptions}
                placeholder="Selecione uma transferência"
                boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                inputStyles={style.selectListInput}
                dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
            />
            {showNoTransfers && (
                <Text style={{ textAlign: 'center', marginTop: 10 }}>
                    Nenhuma transferência encontrada.
                </Text>
            )}

            <Text style={{ marginVertical: 10 }}>Selecionar Receptora:</Text>
            <SelectList
                setSelected={onRecipientSelect}
                data={recipientOptions}
                placeholder="Selecione uma receptora"
                boxStyles={[style.selectListBox, { height: 45, marginLeft: 0 }]}
                inputStyles={style.selectListInput}
                dropdownStyles={[style.selectListDropdown, { marginLeft: 0, width: 300 }]}
            />
            {showNoRecipients && (
                <Text style={{ textAlign: 'center', marginTop: 10 }}>
                    Nenhuma receptora disponível.
                </Text>
            )}
        </View>
    )
}
