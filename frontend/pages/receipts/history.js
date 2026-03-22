import { Fragment, useEffect, useState, useContext } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import Swal from 'sweetalert2';

import UserContext from '../../contexts/UserContext';
import ReceiptHelper from '../../helper/receiptHelper';
import DateHelper from '../../helper/dateHelper';

export default function history() {
	const [dateControl, setDateControl] = useState(DateHelper.dateObjToControl(new Date()));
	const { user } = useContext(UserContext);
	const [receipts, setReceipts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		(async() => {
			setIsLoading(true);
			await initializeReceipts();
			setIsLoading(false);
		})();
	}, [dateControl])

	async function initializeReceipts() {
		const token = user.token;
		const startUNIX = DateHelper.dateControlToUNIX(dateControl);
		const endUNIX = DateHelper.dateControlToEODUNIX(dateControl);
		const data = await ReceiptHelper.
			getReceipts(startUNIX, endUNIX, token);
		console.log(data);
		setReceipts(data);
	}

	async function onDelete(receipt) {
		const swalRes = await Swal.fire({
			title: `Delete Receipt with ` + 
				`Total: ${receipt.totalPrice}`,
			icon: 'question',
			confirmButtonColor: '#d0312d',
			confirmButtonText: 'Delete',
			showCancelButton: true,
			reverseButtons: true
		});

		let password = await Swal.fire({
			input: 'password',
			title: 'Place Admin Code:'
		});

		if (swalRes.isConfirmed) {
			setIsLoading(true);
			const res = await ReceiptHelper
				.deleteReceipt(receipt._id, user.token, password.value);
			if (res === true) {
				await Swal.fire({
					title: 'Successfully Deleted',
					icon: 'success'
				});
				await initializeReceipts();
			} else {
				await Swal.fire({
					title: 'Something Went Wrong',
					text: 'Please try again',
					icon: 'error'
				});
			}
		}
		setIsLoading(false);
	}

	return (
		<Fragment>
			<Form.Control 
				type="date"
				value={dateControl}
				onChange={(e) => setDateControl(e.target.value)}
			/>
			<Link href={`/receipts/manual?date=${dateControl}`}>
				<Button variant="warning">Hard Code Receipt</Button>
			</Link>
			{ isLoading === true
				? <div className="text-center">
						<Spinner 
							animation="border"
							variant="primary"
						/>
					</div>
				: <div>
						{receipts.map((receipt, idx) => {
							return (<Card key={receipt._id} className="my-3">
								<Card.Body>
									<Card.Title>
										{`[${idx +1}] ${new Date(receipt.date).toLocaleString().split(', ')[1]}`}
									</Card.Title>
									{ receipt.items.map((itemObj,idx) => {
										return (
											<Card.Text key={itemObj._id}>
												{`${idx + 1}) ${itemObj.item.name}`}	
												<span className="d-block text-muted">
													{`${itemObj.quantity}pcs. x ${itemObj.item.price} = ${itemObj.quantity * itemObj.item.price}`}
												</span>
											</Card.Text>
										)
									})}
									<Card.Text>
										{`Total: ${receipt.totalPrice}`}
									</Card.Text>
									<Button variant="danger"
										onClick={async () => onDelete(receipt)}
									>
										Delete
									</Button>
								</Card.Body>
							</Card>)
						})}
					</div>
			}
		</Fragment>
	)
}

// cards for each receipt
// header should be number and time
// get receipts given day range
// 