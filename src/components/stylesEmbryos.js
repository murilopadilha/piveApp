import { StyleSheet } from 'react-native'

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
        flex: 1,
        textAlign: 'center',
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
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 20,
    },
    cultivationItem: {
        flex: 1,
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)[',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#F1F2F4',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
    },
    optionContainer: {
        width: '100%',
        marginBottom: 20,
    },
    optionLabel: {
        fontWeight: 'bold',
        marginBottom: 10,
    },
    optionButtons: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    optionButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 5,
    },
    optionButtonSelected: {
        backgroundColor: '#092955',
    },
    optionButtonSelectedText: {
        color: '#fff',
    },
    optionButtonText: {
        color: '#555',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    navigationButton: {
        backgroundColor: '#092955',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    navigationButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: '#E0E0E0',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#555',
        fontWeight: 'bold',
    },
    selectListDropdown: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        maxHeight: 150,
        fontWeight: 'bold',
    },
    buttonSearchFiv: {
        paddingTop: 5,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 5
    }
})