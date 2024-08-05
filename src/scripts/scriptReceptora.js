import { newReceiverIndentification, newReceiverName } from "../screens/menu-sections/CadastrarReceptora";
import { newReceiverBreed } from "../screens/menu-sections/CadastrarReceptora";
import { newReceiverIndentification } from "../screens/menu-sections/CadastrarReceptora";

async function sendReceiverInfo() {

    const receiverData = {
        name: newReceiverName,
        breed: newReceiverBreed,
        identification: newReceiverIndentification,
    }

    const response = await fetch('http://localhost:3000/articles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiverData), 
    })

    alert(`Salvo com sucesso!`)
} 