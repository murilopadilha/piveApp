import { StyleSheet } from 'react-native'

export default StyleSheet.create({
    app:{
        margin: 0,
        padding: 0,
    },
    menu: {
      backgroundColor: '#F1F2F4',
    },
    divTitle:{
      backgroundColor: "#092955",
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
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
      color: '#FFFFFF',
      fontFamily: ''
    },
    input: {
      width: 200,
      height: 40,
      borderColor: '#092955',
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
        backgroundColor: '#092955',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 200,
        marginLeft: 125,
    }, 
    buttonText: {
        color: '#FFFFFF'
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
    backgroundColor: '#FFFFFF',
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
    width: 350,
  },
  dateInput: {
    borderColor: '#092955',
    borderWidth: 3,
    borderRadius: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  dateText: {
    textAlign: 'center',
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  listText: {
    fontSize: 16,
    color: '#000'
  }, contentList: {
    margin: 5
  },
  listButtonEdit: {
    backgroundColor: '#092955',
    padding: 4,
    width: 50,
    borderRadius: 8,
    marginBottom: 3
  },
  listButtonTextEdit: {
    color: '#FFFFFF',
    marginLeft: 2
  },
  listButtonDelete: {
    backgroundColor: '#c13',
    padding: 4,
    width: 50,
    borderRadius: 8,
  },
  listButtonTextDelete: {
    color: '#FFFFFF'
  },
  listButtons: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  listItemDonor: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  listButtonsDonor: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 2,
  },
  listButtonDeleteDonor: {
    backgroundColor: '#c13',
    padding: 4,
    width: 50,
    borderRadius: 8,
    marginLeft: 3
  },
  listButtonEditDonor: {
    backgroundColor: '#092955',
    padding: 4,
    width: 50,
    borderRadius: 8,
    marginBottom: 3
  },
})