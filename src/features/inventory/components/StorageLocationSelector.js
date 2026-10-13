import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function StorageLocationSelector({
    locations,
    selectedId,
    onSelect,
    onLoadMore,
    hasNextPage = false,
    loadingMore = false,
    activeOnly = false,
    allowClear = false,
    disabled = false,
}) {
    return (
        <View accessibilityRole="radiogroup" style={styles.container}>
            {allowClear ? (
                <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel="Todos os locais"
                    accessibilityState={{ selected: selectedId == null, disabled }}
                    disabled={disabled}
                    onPress={() => onSelect(null)}
                    style={[styles.option, selectedId == null && styles.selected]}
                >
                    <Text style={styles.optionText}>Todos</Text>
                </Pressable>
            ) : null}
            {locations.map((location) => {
                const unavailable = disabled || (activeOnly && location.status !== 'ACTIVE')
                const selected = location.id === selectedId

                return (
                    <Pressable
                        key={location.id}
                        accessibilityRole="radio"
                        accessibilityLabel={`Local ${location.code}${location.name ? `, ${location.name}` : ''}`}
                        accessibilityState={{ selected, disabled: unavailable }}
                        disabled={unavailable}
                        onPress={() => onSelect(location.id)}
                        style={[
                            styles.option,
                            selected && styles.selected,
                            unavailable && styles.disabled,
                        ]}
                    >
                        <Text style={styles.optionText}>
                            {location.code}{location.name ? ` — ${location.name}` : ''}
                        </Text>
                        <Text style={styles.meta}>
                            {location.typeCode} · {location.status}
                        </Text>
                    </Pressable>
                )
            })}
            {hasNextPage ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Carregar mais locais"
                    accessibilityState={{ busy: loadingMore, disabled: loadingMore }}
                    disabled={loadingMore}
                    onPress={onLoadMore}
                    style={styles.loadMore}
                >
                    <Text style={styles.loadMoreText}>
                        {loadingMore ? 'Carregando...' : 'Carregar mais locais'}
                    </Text>
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { marginTop: 8 },
    option: { minHeight: 50, justifyContent: 'center', marginBottom: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF' },
    selected: { borderColor: '#092955', backgroundColor: '#DBEAFE' },
    disabled: { opacity: 0.45 },
    optionText: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
    meta: { marginTop: 2, color: '#64748B', fontSize: 12 },
    loadMore: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
    loadMoreText: { color: '#092955', fontSize: 14, fontWeight: '700' },
})
