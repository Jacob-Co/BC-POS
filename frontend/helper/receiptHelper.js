import { Fragment, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const ReactSwal = withReactContent(Swal);
import { Form, Button, DropdownButton } from 'react-bootstrap';

import ReceiptCard from '../components/ReceiptCard';
import FetchHelper from './fetchHelper';

const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;

function createBasicReceiptItem({ item }) {
	return {
		item,
		quantity: 1,
		total: item.price,
		offPrice: 0
	}
}

async function createReceiptItem({ item }) {
	// Swal to ask how many

	const confirmItem = await Swal.fire({
		icon: 'question',
		title: `${item.name}\nPrice: <span class="text-primary">${item.price}</span>`,
		text: `Please confirm the item`,
		showDenyButton: true,
		denyButtonText: 'Wrong Item',
		confirmButtonText: 'Confirm',
		confirmButtonColor: '#4BB543',
		reverseButtons: true,
	})

	if (confirmItem.isConfirmed !== true) {
		return {error: true};
	} 

	const itemCount = await Swal.fire({
		title: `How many ${item.name}`,
		html: '<input type="number" id="quantity" value=1>',
  		showCancelButton: true,
  		showDenyButton: true,
  		denyButtonText: 'Discount',
  		denyButtonColor: '#C29200',
  		confirmButtonText: 'Confirm',
  		confirmButtonColor: '#4BB543',
  		reverseButtons: true,
  		preDeny: () => {
  			return Number(Swal.getPopup().querySelector('#quantity').value);
  		},
  		preConfirm: () => {
  			return Number(Swal.getPopup().querySelector('#quantity').value);
  		}
	})

	if (itemCount.isDismissed === true) {
		return {error: true};
	}

	const quantity = itemCount.value;
	let offPrice = 0;

	if (itemCount.isDenied === true) {
		const discountPrice = await Swal.fire({
			title: 'Put Discounted Price',
			text: `Original Price: ${item.price}`,
			input: 'number',
			inputValue: item.price,
			inputAttribute: {
				required: true
			}
		});
		offPrice = item.price - discountPrice.value;
	}

	return {
		item: item,
		quantity: quantity,
		total: quantity * (item.price - offPrice),
		offPrice
	}
}

function isItemInReceipt({ receipt, item }) {
	return !!receipt.find(receiptItem => receiptItem.item._id === item._id);
}

function convertToReceiptObj(receipt, unix, token, isManual) {
	unix = unix || new Date().getTime();

	const receiptObj = {}
		let total = 0;
		receiptObj.items = receipt.map(receiptItem => {
			total += Number(receiptItem.total);
			return { 
				item: receiptItem.item._id,
				quantity: receiptItem.quantity,
				offPrice:  receiptItem.offPrice
			}
		});
		receiptObj.totalPrice = total;
		receiptObj.date = unix;
		receiptObj.transactionMode = 'physical';
		if (isManual) {
			receiptObj.sendCode = token + (new Date().getTime());
		} else {
			receiptObj.sendCode = token + unix;
		}

	return { receipt: receiptObj};
}

// start of fetches

async function sendReceipt(receiptObj, token) {
	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;
	try {
		const sentRes = await FetchHelper
			.fetchWithTimeout(`${backendAPI}/api/receipts`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(receiptObj)
			});
		return sentRes.result;
	} catch (err) {
		return 'Time Out';
	}
	
}

async function hardCodeReceipt(receiptObj, token) {
	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;
	try {
		const sentRes = await FetchHelper
			.fetchWithTimeout(`${backendAPI}/api/receipts/hardCode`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(receiptObj)
			});
		return sentRes.result;
	} catch (err) {
		return 'Time Out';
	}
	
}

async function sendReceipts(receipts, token) {
	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;
	try {
		const sentRes = await FetchHelper
			.fetchWithTimeout(`${backendAPI}/api/receipts/multiple`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(receipts)
			});
		return sentRes.result;
	} catch (err) {
		return 'Time Out';
	}
}

async function getSales(UNIX, token) {
	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;
	const route = `${backendAPI}/api/receipts/sales/${UNIX}`
	try {
		const sales = await FetchHelper.fetchWithTimeout(route, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		return sales.result;
	} catch (err) {
		return 'Time Out';
	}
}

async function getReceipts(startUNIX, endUNIX, token) {
	const route = `${backendAPI}/api/receipts/dates/${startUNIX}/${endUNIX}`;

	try {
		const receipts = await FetchHelper.fetchWithTimeout(route, {
			headers: {
					'Authorization': `Bearer ${token}`
			}
		});
		return receipts.result;	
	} catch (err) {
		return 'Time Out';
	}
}

async function deleteReceipt(receiptId, token, password) {
		const route = `${backendAPI}/api/receipts/${receiptId}`;
	try {
		const deleteRes = await FetchHelper.fetchWithTimeout(route, {
			method: 'DELETE',
			headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
			},
			body: JSON.stringify({ password })
		});
		return deleteRes.result;	
	} catch (err) {
		return 'Time Out';
	}
}

export default { 
	createBasicReceiptItem,
	createReceiptItem,
	isItemInReceipt,
	sendReceipt,
	convertToReceiptObj,
	sendReceipts,
	getSales,
	getReceipts,
	deleteReceipt,
	hardCodeReceipt
}
