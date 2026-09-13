import { ActivityIndicator, View } from 'react-native'

export default function ListFooterLoader({ loading }) {
    if (!loading) return null

    return (
        <View>
            <ActivityIndicator size={25} color="#092955" />
        </View>
    )
}
