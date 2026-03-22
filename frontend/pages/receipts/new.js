import { Fragment, useContext, useState, useEffect } from 'react';
import { Spinner, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const ReactSwal = withReactContent(Swal);


import UserContext from '../../contexts/UserContext';
import ItemContext from '../../contexts/ItemContext';
import ReceiptContext from '../../contexts/ReceiptContext';

import ScannerWrapper from '../../components/Scanner';
import ActiveReceiptPopUp from '../../components/ActiveReceiptPopUp';
import ManualReceiptSelection from '../../components/ManualReceiptSelection';
import ItemHelper from '../../helper/itemHelper';
import ReceiptHelper from '../../helper/receiptHelper';

export default function index() {
	const { unsentReceipts, setUnsentReceipts, unsentUNIX, setUnsentUNIX } = useContext(ReceiptContext);
	const { user } = useContext(UserContext);
	const { items } = useContext(ItemContext);
	const [ isLoading, setIsLoading ] = useState(false);
	const [receipt, setReceipt] = useState(JSON.parse(localStorage.getItem('receipt')) || []);
	const [currentReader, setCurrentReader] = useState('ean_reader');
	const [scanTries, setScanTries] = useState(0); // given 5 attempts

	useEffect(() => {
		localStorage.setItem('receipt', JSON.stringify(receipt));
	}, [receipt])

	async function createReceiptItem(item) {
		if (ReceiptHelper.isItemInReceipt({ receipt, item }) === true) {
			await Swal.fire(
				'Item already in receipt!',
				'If you want to edit quantity, open receipt display',
				'error'
			);
			return;
		}
		setIsLoading(true);
		const newReceiptItem = await ReceiptHelper.createReceiptItem({ item });
		if (newReceiptItem.error !== true) {
			setReceipt(receipt.concat(newReceiptItem));
		}
		setIsLoading(false);
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
		setIsLoading(true);

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
		setIsLoading(false);
	}

	async function onScanHandler(barcode) {
		const token = user.token;
		const item = ItemHelper.findItemByBarcode({ items, token, barcode });
		if (item === undefined) {
			setScanTries(scanTries + 1)
			if (scanTries >= 4) { // 5 tries to find an item
				setIsLoading(true);
				await Swal.fire(
					`Item with barcode ${barcode} does not exist`,
					'Please try again',
					'error'
				);
				setIsLoading(false);
				return setScanTries(0);
			}
			return;
		}
		setIsLoading(true);
		setScanTries(0);
		await createReceiptItem(item);
		setIsLoading(false);
	}

	return (
		<Fragment>
			<div className="d-flex">
				<h3>Create Receipts</h3>
				<Button href="/receipts/barcodeScanner" className="ml-5">
					Go Barcode Scanner
				</Button>
			</div>
			{ isLoading === true
				? <div className="text-center">
						<Spinner animation="border" variant="primary"/>
					</div>
				: <Fragment>
						<div>
							<Button
								onClick={() => {
									ReactSwal.fire(
										<ActiveReceiptPopUp 
											receipt={receipt}
											editReceiptItem={editReceiptItem}
											finalizeReceipt={finalizeReceipt}
											deleteReceiptItem={deleteReceiptItem}
										/>
									)
								}}
								variant="warning"
							>
								View Current Receipt
							</Button>
						</div>
						<div>
							<Button
								onClick={() => {
									ReactSwal.fire(
										<ManualReceiptSelection 
											items={items}
											onAdd={createReceiptItem}
										/>
									)
								}}
							>
								Manually Add Receipt Item
							</Button>
						</div>
						
					</Fragment> 
			}
			<ScannerWrapper 
							currentReader={currentReader}
							setCurrentReader={setCurrentReader}
							scanFunction={onScanHandler}
						/>
		</Fragment>
	)
}
