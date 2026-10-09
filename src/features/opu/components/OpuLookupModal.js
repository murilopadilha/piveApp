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

const SEARCH_DELAY_MS = 400

export default function OpuLookupModal({
    visible,
    title,
    query,
    itemLabel,
    isItemDisabled = () => false,
    onQueryChange,
    onSelect,
    onClose,
}) {
    const [text, setText] = React.useState('')

    React.useEffect(() => {
        if (!visible) {
            setText('')
            onQueryChange('')
            return undefined
        }

        const timeout = setTimeout(() => onQueryChange(text.trim()), SEARCH_DELAY_MS)

        return () => clearTimeout(timeout)
    }, [onQueryChange, text, visible])

    const items = query.data?.pages.flatMap(page => page.items) ?? []

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
                        {title}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Fechar seleção de ${title}`}
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Text style={styles.closeText}>Fechar</Text>
                    </Pressable>
                </View>
                <TextInput
                    accessibilityLabel={`Buscar ${title}`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setText}
                    placeholder="Buscar"
                    placeholderTextColor="#64748B"
                    style={styles.search}
                    value={text}
                />
                {query.isPending ? (
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel={`Carregando ${title}`}
                        style={styles.centered}
                    >
                        <ActivityIndicator color="#092955" size="large" />
                    </View>
                ) : query.error ? (
                    <View style={styles.centered}>
                        <Text style={styles.message}>
                            Não foi possível carregar as opções.
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => void query.refetch()}
                            style={styles.retryButton}
                        >
                            <Text style={styles.retryText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        contentContainerStyle={items.length === 0
                            ? styles.emptyList
                            : styles.list}
                        data={items}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={(
                            <Text style={styles.message}>Nenhuma opção encontrada.</Text>
                        )}
                        ListFooterComponent={query.isFetchingNextPage ? (
                            <ActivityIndicator color="#092955" style={styles.footer} />
                        ) : null}
                        onEndReached={() => {
                            if (query.hasNextPage && !query.isFetchingNextPage) {
                                void query.fetchNextPage()
                            }
                        }}
                        onEndReachedThreshold={0.4}
                        renderItem={({ item }) => {
                            const disabled = isItemDisabled(item)

                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Selecionar ${itemLabel(item)}`}
                                    accessibilityState={{ disabled }}
                                    disabled={disabled}
                                    onPress={() => onSelect(item)}
                                    style={({ pressed }) => [
                                        styles.option,
                                        disabled && styles.disabled,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Text style={styles.optionText}>{itemLabel(item)}</Text>
                                </Pressable>
                            )
                        }}
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
    title: { flex: 1, color: '#092955', fontSize: 22, fontWeight: '700' },
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
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    option: {
        minHeight: 52,
        justifyContent: 'center',
        marginBottom: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    optionText: { color: '#0F172A', fontSize: 16 },
    message: { color: '#475569', fontSize: 15, textAlign: 'center' },
    retryButton: {
        minHeight: 48,
        justifyContent: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: '#092955',
    },
    retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    footer: { marginVertical: 20 },
    pressed: { opacity: 0.72 },
    disabled: { opacity: 0.45 },
})
