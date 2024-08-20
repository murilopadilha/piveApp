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
    fontFamily: 'Kanit-'
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
    height: 7, 
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
    padding: 3,
    width: 80,
    borderRadius: 8,
    marginLeft: 5,
    marginRight: 5,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  listButtonSearch: {
    backgroundColor: '#092955',
    padding: 4,
    width: 55,
    borderRadius: 8,
    marginTop: 3,
    marginBottom: 10,
    marginLeft: 5,
    textAlign: 'center'
  },
  listButtonTextEdit: {
    color: '#FFFFFF',
    marginLeft: 2,
    textAlign: "center",
  },
  listButtonDelete: {
    borderColor: '#ccc',
    padding: 3,
    width: 30,
    borderRadius: 8,
    marginLeft: 5,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  listButtonTextDelete: {
    color: '#FFFFFF',
    textAlign: 'center'
  },
  listButtons: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#092955',
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
  search: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }, 
  inputSelect: {
    borderColor: '#092955',
    borderWidth: 3,
    borderRadius: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 10,
  },
  scheduleButton: {
    backgroundColor: '#092955',
    width: 70,
    height: 30,
    borderRadius: 8,
    marginLeft: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 2,
    paddingRight: 2,
    marginBottom: 20,
    marginTop: 10,
  },
  scheduleText: {
    color: '#FFFFFF',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  calendarContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  calendar: {
    width: 350,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  headerStyle: {
    backgroundColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#092955',
  },
  selectListBox: {
    width: '90%',
    maxWidth: 352, 
    height: 45,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#092955',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
    paddingTop: 9,
  },
  selectListInput: {
    fontSize: 14,
    color: '#000',
  },
  selectListDropdown: {
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#092955',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
  },
  detailsContainer: {
    marginBottom: 70,
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    width: 350
  },
  detailItem: {
    padding: 10,
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
  },
  detailsText: {
    paddingLeft: 5,
    paddingBottom: 3,
    fontSize: 16,
    color: '#333',
  },
  searchPive: {
    marginTop: 5,
    marginLeft: 20,
    display: 'flex',
    flexDirection: 'row',
  },
  selectListBoxPive: {
    width: '90%',
    maxWidth: 100, 
    height: 40,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#092955',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    paddingTop: 6,
    paddingLeft: 5,
  },
  selectListDropdownPive: {
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#092955',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    width: 100,
  },
  listPive: {
    marginLeft: 20,
    width: '90%',
    height: '65%',
    display: 'flex',
    flexDirection: 'column',
  },
  listItemPive: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    height: 90,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})