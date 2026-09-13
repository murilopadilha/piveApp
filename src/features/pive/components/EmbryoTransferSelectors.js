import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
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
            <Text style={styles.transferLabel}>Selecionar Transferência:</Text>
            <SelectList
                setSelected={onTransferSelect}
                data={transferOptions}
                placeholder="Selecione uma transferência"
                boxStyles={[style.selectListBox, styles.selectListBox]}
                inputStyles={style.selectListInput}
                dropdownStyles={[style.selectListDropdown, styles.selectListDropdown]}
            />
            {showNoTransfers && (
                <Text style={styles.emptyText}>
                    Nenhuma transferência encontrada.
                </Text>
            )}

            <Text style={styles.recipientLabel}>Selecionar Receptora:</Text>
            <SelectList
                setSelected={onRecipientSelect}
                data={recipientOptions}
                placeholder="Selecione uma receptora"
                boxStyles={[style.selectListBox, styles.selectListBox]}
                inputStyles={style.selectListInput}
                dropdownStyles={[style.selectListDropdown, styles.selectListDropdown]}
            />
            {showNoRecipients && (
                <Text style={styles.emptyText}>
                    Nenhuma receptora disponível.
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    transferLabel: {
        marginBottom: 10,
    },
    recipientLabel: {
        marginVertical: 10,
    },
    selectListBox: {
        height: 45,
        marginLeft: 0,
    },
    selectListDropdown: {
        marginLeft: 0,
        width: 300,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
    },
})
