import { Pressable, StyleSheet, Text, View } from 'react-native'

import { getPackageStatusLabel } from '../inventoryPresentation'

export default function PackageListItem({ packageItem, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Package ${packageItem.packageCode}, ${getPackageStatusLabel(packageItem.status)}`}
            accessibilityHint="Abre os detalhes e a localização do package"
            onPress={onPress}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <View style={styles.heading}>
                <Text style={styles.code}>{packageItem.packageCode}</Text>
                <Text style={styles.status}>{getPackageStatusLabel(packageItem.status)}</Text>
            </View>
            <Text style={styles.secondary}>Tipo: {packageItem.packagingType}</Text>
            <Text style={styles.secondary}>
                {packageItem.currentLocationId
                    ? `Local: ${packageItem.currentLocationId}`
                    : 'Sem localização atual'}
            </Text>
            <Text style={styles.secondary}>Versão: {packageItem.version}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: { minHeight: 112, marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
    pressed: { opacity: 0.72 },
    heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    code: { flex: 1, marginRight: 12, color: '#092955', fontSize: 17, fontWeight: '700' },
    status: { color: '#334155', fontSize: 13, fontWeight: '600' },
    secondary: { marginTop: 5, color: '#475569', fontSize: 13 },
})
