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

import {
    getAnimalName,
    getAnimalSexLabel,
    getAnimalStatusLabel,
} from '../../animals/animalPresentation'

const SEARCH_DELAY_MS = 400

export const isEligibleRecipientAnimal = animal => (
    animal?.sex === 'FEMALE' && animal?.status === 'ACTIVE'
)

export default function RecipientAnimalSelector({
    visible,
    query,
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

    const animals = query.data?.pages.flatMap(page => page.items) ?? []

    return (
        <Modal
            animationType="slide"
            onRequestClose={onClose}
            presentationStyle="pageSheet"
            visible={visible}
        >
            <SafeAreaView style={styles.screen}>
                <View style={styles.header}>
                    <Text accessibilityRole="header" style={styles.title}>Animal receptora</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Fechar seleção de Animal receptora"
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Text style={styles.closeText}>Fechar</Text>
                    </Pressable>
                </View>
                <TextInput
                    accessibilityLabel="Buscar Animal receptora"
                    accessibilityHint="Busca no diretório geral por nome ou identificador ativo"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    onChangeText={setText}
                    placeholder="Nome ou identificador"
                    placeholderTextColor="#64748B"
                    style={styles.search}
                    value={text}
                />
                <Text style={styles.guidance}>
                    O backend confirma elegibilidade. Machos e Animals inativas não podem ser selecionados.
                </Text>
                {query.isPending ? (
                    <View accessibilityRole="progressbar" accessibilityLabel="Carregando Animals" style={styles.centered}>
                        <ActivityIndicator color="#092955" size="large" />
                    </View>
                ) : query.error ? (
                    <View accessibilityRole="alert" style={styles.centered}>
                        <Text style={styles.message}>Não foi possível carregar os animais.</Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Tentar carregar animais novamente"
                            accessibilityState={{
                                busy: query.isFetching,
                                disabled: query.isFetching,
                            }}
                            disabled={query.isFetching}
                            onPress={() => void query.refetch()}
                            style={styles.retry}
                        >
                            <Text style={styles.retryText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        contentContainerStyle={animals.length ? styles.list : styles.empty}
                        data={animals}
                        keyExtractor={animal => animal.id}
                        ListEmptyComponent={<Text style={styles.message}>Nenhum Animal encontrado.</Text>}
                        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#092955" style={styles.footer} /> : null}
                        onEndReached={() => {
                            if (query.hasNextPage && !query.isFetchingNextPage) {
                                void query.fetchNextPage()
                            }
                        }}
                        onEndReachedThreshold={0.4}
                        renderItem={({ item }) => {
                            const disabled = !isEligibleRecipientAnimal(item)
                            const name = getAnimalName(item)

                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Selecionar ${name}, ${getAnimalSexLabel(item.sex)}, ${getAnimalStatusLabel(item.status)}`}
                                    accessibilityState={{ disabled }}
                                    disabled={disabled}
                                    onPress={() => onSelect(item)}
                                    style={({ pressed }) => [styles.option, disabled && styles.disabled, pressed && styles.pressed]}
                                >
                                    <Text style={styles.optionTitle}>{name}</Text>
                                    <Text style={styles.optionText}>{getAnimalSexLabel(item.sex)} · {getAnimalStatusLabel(item.status)}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
    title: { flex: 1, color: '#092955', fontSize: 22, fontWeight: '700' },
    closeButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
    closeText: { color: '#092955', fontSize: 15, fontWeight: '700' },
    search: { minHeight: 48, margin: 16, marginBottom: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 16 },
    guidance: { marginHorizontal: 18, marginBottom: 10, color: '#475569', fontSize: 13, lineHeight: 18 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    option: { minHeight: 66, justifyContent: 'center', marginBottom: 8, padding: 14, borderRadius: 10, backgroundColor: '#FFFFFF' },
    optionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
    optionText: { marginTop: 4, color: '#475569', fontSize: 14 },
    message: { color: '#475569', fontSize: 15, textAlign: 'center' },
    retry: { minHeight: 44, justifyContent: 'center' },
    retryText: { color: '#092955', fontSize: 14, fontWeight: '700' },
    footer: { marginVertical: 20 },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.72 },
})
