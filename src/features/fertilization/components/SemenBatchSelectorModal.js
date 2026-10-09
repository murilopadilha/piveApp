import React from 'react'
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useSemenBatchesQuery } from '../../semen/hooks/useSemenQueries'
import SemenBatchListItem from './SemenBatchListItem'

const SEARCH_DELAY_MS = 400

export default function SemenBatchSelectorModal({
    organizationId,
    visible,
    onSelect,
    onClose,
}) {
    const [text, setText] = React.useState('')
    const [query, setQuery] = React.useState('')

    React.useEffect(() => {
        if (!visible) {
            setText('')
            setQuery('')
            return undefined
        }

        const timeout = setTimeout(() => setQuery(text.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [text, visible])

    const batchesQuery = useSemenBatchesQuery({
        organizationId,
        query,
        enabled: visible,
    })
    const batches = batchesQuery.data?.pages.flatMap(page => page.items) ?? []

    return (
        <Modal
            animationType="slide"
            onRequestClose={onClose}
            presentationStyle="pageSheet"
            visible={visible}
        >
            <SafeAreaView style={styles.screen}>
                <View style={styles.header}>
                    <Text accessibilityRole="header" style={styles.title}>
                        Selecionar lote de sêmen
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Fechar seleção de lote de sêmen"
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Text style={styles.closeText}>Fechar</Text>
                    </Pressable>
                </View>
                <TextInput
                    accessibilityLabel="Buscar lote de sêmen"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setText}
                    placeholder="Código do lote"
                    placeholderTextColor="#64748B"
                    style={styles.search}
                    value={text}
                />
                {batchesQuery.isPending ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Carregando lotes de sêmen"
                        style={styles.centered}
                    >
                        <ActivityIndicator color="#092955" size="large" />
                    </View>
                ) : batchesQuery.error ? (
                    <View accessibilityRole="alert" style={styles.centered}>
                        <Text style={styles.message}>Não foi possível carregar os lotes.</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => void batchesQuery.refetch()}
                            style={styles.retryButton}
                        >
                            <Text style={styles.retryText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        contentContainerStyle={batches.length === 0
                            ? styles.emptyList
                            : styles.list}
                        data={batches}
                        keyExtractor={batch => batch.id}
                        ListEmptyComponent={(
                            <Text style={styles.message}>Nenhum lote encontrado.</Text>
                        )}
                        ListFooterComponent={batchesQuery.isFetchingNextPage ? (
                            <ActivityIndicator color="#092955" style={styles.footer} />
                        ) : null}
                        onEndReached={() => {
                            if (
                                batchesQuery.hasNextPage &&
                                !batchesQuery.isFetchingNextPage
                            ) {
                                void batchesQuery.fetchNextPage()
                            }
                        }}
                        onEndReachedThreshold={0.4}
                        renderItem={({ item }) => (
                            <SemenBatchListItem
                                batch={item}
                                disabled={item.status !== 'ACTIVE'}
                                onPress={() => onSelect(item)}
                            />
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F1F2F4' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    title: { flex: 1, color: '#092955', fontSize: 21, fontWeight: '700' },
    closeButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
    closeText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    search: {
        minHeight: 48,
        margin: 16,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: 16,
    },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    list: { paddingTop: 4, paddingBottom: 40 },
    emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    message: { color: '#475569', fontSize: 15, textAlign: 'center' },
    retryButton: { minHeight: 44, justifyContent: 'center', marginTop: 16, paddingHorizontal: 20, borderRadius: 22, backgroundColor: '#092955' },
    retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    footer: { marginVertical: 20 },
})
