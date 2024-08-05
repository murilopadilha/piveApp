import { StyleSheet } from 'react-native'

export default StyleSheet.create({
    app:{
        margin: 0,
        padding: 0,
    },
    divTitle:{
      backgroundColor: "#2E4BA8",
      padding: 25,
      shadowColor: '#000',
      shadowOpacity: 1,
      shadowRadius: 2,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      
    },
    titleText:{
      fontSize: 20,
      marginRight: 50,
      color: '#fff',
      fontFamily: ''
    },
    input: {
      width: 200,
      height: 40,
      borderColor: '#2E4BA8',
      borderWidth: 3,
      borderRadius: 8,
      marginBottom: 10,
      paddingLeft: 15,
    },
    label: {
      margin: 10,
    },
    text: {
      color: '#000',
      marginBottom: 10
    },
    content: {
        margin: 30
    },
    button: {
        width: 85,
        height: 40,
        borderRadius: 50,
        backgroundColor: '#2E4BA8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 200,
        marginLeft: 125,
    }, 
    buttonText: {
        color: '#fff'
    },
    menuContent: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      margin: 20,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      height: '100%'
  },
  menuContentButton: {
    backgroundColor: '#dcdcdc',
    marginTop: 20,
    margin: 5,
    width: 150,
    height: 150,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textButtonMenu: {
    textAlign: 'center',
  },
  imgsMenu: {
    width: 125,
    height: 125,
  },
  bottomBorder: {
    height: 7, // Espessura da borda inferior
  },
  dateComponent: {
    width: 350
  }
})