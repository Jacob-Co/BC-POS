import { Fragment, useContext, useState, useEffect } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const ReactSwal = withReactContent(Swal);

import ItemContext from '../../contexts/ItemContext';
import UserContext from '../../contexts/UserContext';
import ActiveReceiptPopUp from '../../components/ActiveReceiptPopUp';
import ManualReceiptSelection from '../../components/ManualReceiptSelection';
import DateHelper from '../../helper/dateHelper';
import ReceiptHelper from '../../helper/receiptHelper';

export default function manual() {
	const router = useRouter();

	const { items } = useContext(ItemContext);
	const { user } = useContext(UserContext);
	const [receipt, setReceipt] = useState(JSON
		.parse(localStorage.getItem('manual_receipt')) || []
	);
	const [dateControl, setDateControl] = useState(DateHelper
		.dateObjToControl(new Date())
	);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		console.log(router.query.date);
		setDateControl(router.query.date);
	}, [])

	useEffect(() => {
		localStorage.setItem('manual_receipt', JSON.stringify(receipt));
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

	function deleteReceiptItem(receiptItemId) {
		const editedReceipt = receipt.filter(receiptItem => {
			return receiptItem.item._id !== receiptItemId
		});
		setReceipt(editedReceipt);
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

	async function finalizeReceipt() {
		if (receipt.length === 0) {
			Swal.fire('Receipt is empty.', 'Add items then try again.', 'error');
			return;
		}
		setIsLoading(true);

		const receiptObj = ReceiptHelper.convertToReceiptObj(
			receipt, 
			DateHelper.dateControlToUNIX(dateControl),
			user.token,
			true
		);

		let adminCode = await Swal.fire({
			input: 'password',
			title: 'Place Admin Code:'
		});

		receiptObj.password = adminCode.value;

		const res = await ReceiptHelper.hardCodeReceipt(receiptObj, user.token);

		if (res === true) {
			Swal.fire('Saved to DB!', 'Let\'s scan more!', 'success');
			localStorage.removeItem('receipt');
			setReceipt([]);
		} else {
			const res = await Swal.fire({
				title: 'Bad Internect Connection or Wrong Admin Code',
				icon: 'error',
				confirmButtonText: 'Try Again',
			});
		}
		setIsLoading(false);
	}

	return (
		<Fragment>
			<h3>Hardcode Receipts</h3>
			<Button variant="warning"
				onClick={() => ReactSwal.fire(
					<ActiveReceiptPopUp 
						receipt={receipt}
						deleteReceiptItem={deleteReceiptItem}
						editReceiptItem={editReceiptItem}
						finalizeReceipt={finalizeReceipt}
					/>
				)}
			>
				View Receipt
			</Button>
			{ isLoading
				? <div className="text-center">
						<Spinner animation="border" variant="primary" />
					</div>
				: <Fragment>
					<Form.Control
							type="date"
							value={dateControl}
							onChange={(e) => setDateControl(e.target.value)}
						/>
						<ManualReceiptSelection 
							items={items}
							onAdd={createReceiptItem}
						/>
					</Fragment>
			}
		</Fragment>
	)
}