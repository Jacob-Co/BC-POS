import { Fragment, useEffect, useContext } from 'react';
import { useRouter } from 'next/router'
import { Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';

import ReceiptContext from '../../contexts/ReceiptContext';
import UserContext from '../../contexts/UserContext';
import ItemContext from '../../contexts/ItemContext';

import ReceiptHelper from '../../helper/receiptHelper';

export default function unsent() {
	const { unsentReceipts, unsentUNIX, unsetUnsentItems } = useContext(ReceiptContext);
	const { user } = useContext(UserContext);
	const { setItems } = useContext(ItemContext);
	const router = useRouter();

	useEffect(() => {
		sendUnsentReceipts()
	}, []);

	async function sendUnsentReceipts() {
		let counter = 0;
		console.log('unsentReceipts', unsentReceipts)
		const receiptObjs = unsentReceipts.map(receipt => {
			const receiptObj = ReceiptHelper
				.convertToReceiptObj(receipt, unsentUNIX[counter], user.token)
				.receipt;
			counter += 1;
			return receiptObj
		})
		const res = await ReceiptHelper.sendReceipts(receiptObjs, user.token);
		if (res === true) {
			Swal.fire({ icon: 'success', title: 'Recorded on DB!'});
			unsetUnsentItems();
			await setItems();
		} else {
			Swal.fire({ icon: 'error', title: 'Failed to connect, try again.'});
		}
		router.push('/');
	}

	return (
		<div className="text-center">
			<Spinner animation="border" variant="primary"/>
		</div>
	)
}