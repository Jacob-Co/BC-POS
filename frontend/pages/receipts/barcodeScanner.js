import { Fragment, useContext, useState, useEffect } from 'react';
import { Spinner, Button, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const ReactSwal = withReactContent(Swal);


import UserContext from '../../contexts/UserContext';
import ItemContext from '../../contexts/ItemContext';
import ReceiptContext from '../../contexts/ReceiptContext';

import ActiveReceipt from '../../components/ActiveReceipt';
import ManualReceiptSelection from '../../components/ManualReceiptSelection';
import ItemHelper from '../../helper/itemHelper';
import ReceiptHelper from '../../helper/receiptHelper';

export default function index() {
	const { unsentReceipts, setUnsentReceipts, unsentUNIX, setUnsentUNIX } = useContext(ReceiptContext);
	const { user } = useContext(UserContext);
	const { items } = useContext(ItemContext);
	const [receipt, setReceipt] = useState(JSON.parse(localStorage.getItem('receipt')) || []);
	const [isBarcodeComplete, setIsBarcodeComplete] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const [scannedKey, setScannedKey] = useState('');
	const [barcode, setBarcode] = useState('');

	useEffect(() => {
		localStorage.setItem('receipt', JSON.stringify(receipt));
	}, [receipt])

	useEffect(() => {
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				setIsBarcodeComplete(true);
			} else {
				if (!(e.key.match(/[0-9]/))) return;
				setScannedKey(e.key);
				setIsScanning(true);
			}
		})
	}, [])

	useEffect(() => {
		if (isScanning === true) {
			setBarcode(barcode + scannedKey);
			setIsScanning(false);
		}
	}, [isScanning])

	useEffect(() => {
		if (isBarcodeComplete === true) {
			onScanHandler(barcode);
			setIsBarcodeComplete(false);
		}
	}, [isBarcodeComplete])

	function createReceiptItem(item) {
		if (ReceiptHelper.isItemInReceipt({ receipt, item }) === true) {
			setReceipt(receipt.map(rItem => {
				if (rItem.item._id === item._id) {
					rItem.quantity += 1;
					rItem.total = rItem.quantity * (rItem.item.price - rItem.offPrice);
				}
				return rItem;

			}));
			return;
		}
		const newReceiptItem = ReceiptHelper.createBasicReceiptItem({ item });
		setReceipt(receipt.concat(newReceiptItem));
	}

	async function manuallyCreateReceiptItem(item) {
		if (ReceiptHelper.isItemInReceipt({ receipt, item }) === true) {
			await Swal.fire(
				'Item already in receipt!',
				'If you want to edit quantity, use the edit button.',
				'error'
			);
			return;
		}
		const newReceiptItem = await ReceiptHelper.createReceiptItem({ item });
		if (newReceiptItem.error !== true) {
			setReceipt(receipt.concat(newReceiptItem));
		}
	}

	function editReceiptItem(newReceiptItem) {
		let counter;
		for (counter = 0; counter < receipt.length; counter++) {
			if (receipt[counter].item._id === newReceiptItem.item._id) {
				break;
			}
		}
		const updatedReceipt = receipt.slice();
		updatedReceipt[counter] = newReceiptItem;
		setReceipt(updatedReceipt);
	}

	function deleteReceiptItem(receiptItemId) {
		const editedReceipt = receipt.filter(receiptItem => receiptItem.item._id !== receiptItemId);
		setReceipt(editedReceipt);
	}

	async function finalizeReceipt() {
		if (receipt.length === 0) {
			Swal.fire('Receipt is empty.', 'Add items then try again.', 'error');
			return;
		}


		const receiptObj = ReceiptHelper.convertToReceiptObj(receipt, undefined, user.token)
			.receipt;

		const res = await ReceiptHelper.sendReceipt(receiptObj, user.token);

		if (res === true) {
			Swal.fire('Saved to DB!', 'Let\'s scan more!', 'success');
			localStorage.removeItem('receipt');
			setReceipt([]);
		} else {
			const res = await Swal.fire({
				title: 'Bad or No Internect Connection',
				icon: 'error',
				text: 'You can try again or set aside for later.',
				confirmButtonText: 'Store Locally',
				showDenyButton: true,
				denyButtonText: 'Try Again'
			});

			if (res.isConfirmed === true) {
				setUnsentReceipts(unsentReceipts.concat([receipt]));
				setUnsentUNIX(unsentUNIX.concat(receiptObj.date));
				localStorage.removeItem('receipt');
				setReceipt([]);
			}
		}
	}

	async function onScanHandler(barcode) {
		if (barcode === '' || barcode === undefined || barcode === null) return;
		const token = user.token;
		const item = ItemHelper.findItemByBarcode({ items, token, barcode });
		if (item === undefined) {
			await Swal.fire(
				`Item with barcode ${barcode} does not exist`,
				'Please try again',
				'error'
			);
			setBarcode('');
			return;
		}
		setBarcode('');
		createReceiptItem(item);
	}

	return (
		<Fragment>
			<h3>Create Receipts</h3>
			<div>
				<Button
					as="div"
					onClick={() => {
						ReactSwal.fire(
							<ManualReceiptSelection 
								items={items}
								onAdd={manuallyCreateReceiptItem}
							/>
						)
					}}
				>
					Manually Add Receipt Item
				</Button>
			</div>
			<Form.Control
				className="text-muted"
				disabled
				value={barcode === '' ? 'Barcode Appears Here' : barcode}
			/>
			<div>
				<ActiveReceipt 
					receipt={receipt}
					editReceiptItem={editReceiptItem}
					finalizeReceipt={finalizeReceipt}
					deleteReceiptItem={deleteReceiptItem}
					onChangeAmount={() => setBarcode(barcode.slice(0, -1))}
				/>
			</div>
		</Fragment>
	)
}
