import { StyleSheet } from 'react-native'

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    scrollContainer: {
        flex: 1,
        padding: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoContainer: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    label: {
        fontWeight: 'bold',
    },
    value: {
        color: '#555',
    },
    oocytesTitle: {
        marginTop: 20,
    },
    oocytesContainer: {
        marginBottom: 20,
    },
    oocytesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    oocytesItem: {
        flex: 1,
        alignItems: 'center',
    },
    cultivationTitle: {
        marginTop: 20,
    },
    cultivationContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 20,
    },
    cultivationItem: {
        flex: 1,
        alignItems: 'center',
    },
})
