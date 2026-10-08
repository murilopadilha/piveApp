import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    formatAnimalDate,
    getAnimalName,
    getAnimalSexLabel,
    getAnimalStatusLabel,
} from '../animalPresentation'

export default function AnimalListItem({ animal, onOpen }) {
    const name = getAnimalName(animal)

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${getAnimalSexLabel(animal.sex)}`}
            accessibilityHint="Abre a identidade e o histórico do animal"
            onPress={onOpen}
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.headingRow}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.status}>
                    {getAnimalStatusLabel(animal.status)}
                </Text>
            </View>
            <Text style={styles.secondary}>
                {getAnimalSexLabel(animal.sex)}
            </Text>
            <Text style={styles.secondary}>
                Nascimento: {formatAnimalDate(animal.birthDate)}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 96,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    pressed: {
        opacity: 0.72,
    },
    headingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    name: {
        flex: 1,
        color: '#092955',
        fontSize: 17,
        fontWeight: '700',
        marginRight: 12,
    },
    status: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
    },
    secondary: {
        color: '#475569',
        fontSize: 14,
        marginTop: 4,
    },
})
