
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content'
const ReactSwal = withReactContent(Swal)
import { Form } from 'react-bootstrap';
import FetchHelper from './fetchHelper';

const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;

function findItemByBarcode({ barcode, token, items }) {
    return items.find(item => item.barcode === barcode);
}

function findItemByName({ name, items}) {
    return items.find(item => item.name.toLowerCase() === name.toLowerCase());
}

async function createItem({ barcode, token, setItems }) {
    const titles = ['Barcode', 'Name', 'Price', 'Stock', 'Double Check'];
    const steps = ['1', '2', '3', '4', '5'];
    const values = [barcode];

    const swalFirstStep = Swal.mixin({
        confirmButtonText: 'Forward',
        denyButtonText: 'Cancel',
        progressSteps: steps,
        input: 'text',
        inputAttributes: {
          required: true
        },
        reverseButtons: true,
        validationMessage: 'This field is required'
    })

    const swalQueueStep = Swal.mixin({
        confirmButtonText: 'Forward',
        cancelButtonText: 'Back',
        progressSteps: steps,
        input: 'text',
        inputAttributes: {
          required: true
        },
        reverseButtons: true,
        validationMessage: 'This field is required'
    });

    const doubleCheckStep = ReactSwal.mixin({
        confirmButtonText: 'Done',
        cancelButtonText: 'Back',
        progressSteps: steps,
        reverseButtons: true,
        showCancelButton: true,
        title: 'Double Check Form',
    })

    let currentStep;

    for (currentStep = 0; currentStep < steps.length;) {
        let result;
        if (titles[currentStep] === 'Double Check') {
            result = await doubleCheckStep.fire({
                title: <Form>
                        <Form.Group>
                            <Form.Label>Barcode</Form.Label>
                            <Form.Control
                                type="input"
                                defaultValue={values[0]}
                                id="barcode"
                            />
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="input"
                                defaultValue={values[1]}
                                id="name"
                            />
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="input"
                                defaultValue={values[2]}
                                id="price"
                            />
                            <Form.Label>Stock</Form.Label>
                            <Form.Control
                                type="input"
                                defaultValue={values[3]}
                                id="stock"
                            />
                        </Form.Group>
                    </Form>
                ,
                preConfirm: () => {
                    const barcode = Swal.getPopup().querySelector('#barcode')
                        .value;
                    const name = Swal.getPopup().querySelector('#name')
                        .value;
                    let price = Swal.getPopup().querySelector('#price')
                        .value;
                    let stock = Swal.getPopup().querySelector('#stock')
                        .value;
                    const isNotNumbers = !!price.match(/[^(0-9),. ]/) 
                        || !!stock.match(/[^(0-9),. ]/);
                    if (!barcode || !name || !price || !stock) {
                        Swal.showValidationMessage(`Please fill out all`)
                    } 

                    if (isNotNumbers) {
                        Swal.showValidationMessage(`Price and stock should only be numbers`)
                    }

                    values[1] = name;

                    const nonNumbersRegex = /[^(0-9)]/g;
                    price = price.replace(nonNumbersRegex, '');
                    stock = stock.replace(nonNumbersRegex, '');
                    return { barcode, name, price, stock }
                }
            });
        } else {
            if (currentStep === 0) {
                result = await swalFirstStep.fire({
                    title: `${titles[currentStep]} `,
                    inputValue: values[currentStep],
                    showDenyButton: true,
                    currentProgressStep: currentStep
                });
            } else {
                result = await swalQueueStep.fire({
                    title: `${titles[currentStep]} `,
                    inputValue: values[currentStep],
                    showCancelButton: currentStep > 0,
                    currentProgressStep: currentStep
                });
            }
        }

        if (result.value) {
            values[currentStep] = result.value
            currentStep++
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            currentStep--
        } else {
            break
        }
    }

    if (currentStep === steps.length) {
        const itemObj = values[currentStep - 1];
        const res = await postNewItem(itemObj, token);
        if (res === true) await setItems();
    }
}

async function postNewItem(itemObj, token) {
    const barcodeAPI = itemObj.barcode === null ? 'no-barcode' : ''
    const route = `${backendAPI}/api/items/${barcodeAPI}`;
    console.log(route);
    const newItemRes = await FetchHelper.baseFetch(route, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemObj)
    });

    if (newItemRes.result == true) {
        Swal.fire(
            `Successfully added ${itemObj.name}`,
            'success'
        );
    } else {
        Swal.fire(
            'Something went wrong, please try again',
            'error'
        );
    }
    return newItemRes.result;
}

async function getInventoryObject(token) {
    const route = `${backendAPI}/api/items/csv-inventory`;
    const res = await FetchHelper.baseFetch(route, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return res.result
}

async function getItems(token) {
    const itemsRes = await FetchHelper.baseFetch(`${backendAPI}/api/items/all`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return itemsRes.result;
}

async function getInvalidBarcodes(token) {
    const itemsRes = await FetchHelper.baseFetch(`${backendAPI}/api/items/invalid-barcodes`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return itemsRes.result;
}

async function editItem(token, edits, itemId, password) {
    console.log('test')
    const route = `${backendAPI}/api/items/${itemId}`;
    const res = await FetchHelper.fetchWithTimeout(route, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ edits, password })
    });
    return res.result
}

export default { 
    createItem,
    findItemByBarcode,
    findItemByName,
    getInventoryObject,
    postNewItem,
    getItems,
    getInvalidBarcodes,
    editItem,
}

