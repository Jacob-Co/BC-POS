import { Fragment, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const ReactSwal = withReactContent(Swal);
import { Button, Form, ListGroup } from 'react-bootstrap';

import ReceiptCard from './ReceiptCard';

export default function ActiveReceipt({ 
	receipt,
	editReceiptItem,
	finalizeReceipt,
	deleteReceiptItem,
	onChangeAmount
}) {
	const [amountReceived, setAmountReceived] = useState('');

	let overallTotal = 0;
	receipt.forEach(receiptItem => overallTotal += Number(receiptItem.total));
	// all layout only

	async function handleEdit(receiptItem) {
		await ReactSwal.fire({
	        title: <EditReceiptItemForm receiptItem={receiptItem}/>,
	        showCancelButton: true,
	        confirmButtonText: 'Confirm Changes',
	        preConfirm: async () => {
	        	const quantity = Swal.getPopup()
	        		.querySelector('#quantity').value; // returns a string
	        	const total = Swal.getPopup().querySelector('#total')
	        		.value; // returns a string
	        	const updatedItem = {
	        		item: receiptItem.item,
	        		offPrice: receiptItem.offPrice,
	        		quantity: Number(quantity),
	        		total: Number(total),
	        	}
        		await editReceiptItem(updatedItem);
           }
    	});
	}

	async function handleDelete(receiptItem) {
			const res = await ReactSwal.fire({
				icon: 'question',
				title: 'Confirm Delete',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				confirmButtonText: 'Delete',
				reverseButtons: true
			})

			if (res.isConfirmed === true) {
				deleteReceiptItem(receiptItem.item._id);
			}
	}

	return (
		<Fragment>
			<div className="d-flex justify-content-between">
				<h3>Overall Total: { overallTotal } </h3>
				<Button
					as="div"
					variant="success"
					onClick={async () => {
						const res = await Swal.fire({
							title: 'Is the receipt final?',
							showCancelButton: true,
							confirmButtonText: `Yes`
						});
						if (res.isConfirmed === true) {
							await finalizeReceipt();
						}
					}}
				>
					Finalize
				</Button>
			</div>
			<Form.Control
				type="number"
				placeholder="Amount Received"
				value={amountReceived}
				onChange={(e) => {
					if (onChangeAmount !== undefined) onChangeAmount();
					const amount = e.target.value;
					setAmountReceived( amount > 0 ? Number(e.target.value) : '');
				}}
			/>
			<Form.Control
				type="number"
				placeholder="Change"
				value={((amountReceived - overallTotal) > 0) 
						? amountReceived - overallTotal
						: ''
				}
				disabled
			/>
			<ListGroup>
				{receipt.map(receiptItem => {
					return (
						<Fragment key={receiptItem.item._id}>
							<ListGroup.Item>
								<ReceiptCard 
									receiptItem={receiptItem}
									handleDelete={handleDelete}
									handleEdit={handleEdit}
								/>
							</ListGroup.Item>
						</Fragment>
					)
				})}
			</ListGroup>
		</Fragment>
	)
}



function EditReceiptItemForm({ receiptItem }) {
	const [quantity, setQuantitry] = useState(receiptItem.quantity);
	const price = receiptItem.item.price;

	return (
		<Form>
			<h3>{receiptItem.item.name}</h3>
			<Form.Group>
                <Form.Label>Price</Form.Label>
                <Form.Control
                    type="number"
                    value={price - receiptItem.offPrice}
                    disabled
                />
            </Form.Group>
			<Form.Group>
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantitry(e.target.value)}
                    id="quantity"
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>Total</Form.Label>
                <Form.Control
                    type="number"
                    value={quantity * (price - receiptItem.offPrice)}
                    disabled
                    id="total"
                />
            </Form.Group>
		</Form>
	)
}

