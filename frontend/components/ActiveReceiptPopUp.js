import { Fragment, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const ReactSwal = withReactContent(Swal);
import { Button, Form } from 'react-bootstrap';

import ReceiptCardPopUp from './ReceiptCardPopUp';

export default function ActiveReceipt({ 
	receipt,
	editReceiptItem,
	finalizeReceipt,
	deleteReceiptItem
}) {
	const [amountReceived, setAmountReceived] = useState('');

	let overallTotal = 0;
	receipt.forEach(receiptItem => overallTotal += Number(receiptItem.total));
	// all layout only
	return (
		<Fragment>
			<h3>Overall Total: { overallTotal } </h3>
			<Form.Control
				type="number"
				placeholder="Amount Received"
				value={amountReceived}
				onChange={(e) => setAmountReceived(Number(e.target.value))}
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
			<Button 
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
			{receipt.map(receiptItem => {
				return (
					<Fragment key={receiptItem.item._id}>
						<ReceiptCardPopUp 
							item={receiptItem.item}
							quantity={receiptItem.quantity}
							total={receiptItem.total}
							offPrice={receiptItem.offPrice}
						/>
						<div>
							<Button 
							variant="warning"
							className="w-50"
							onClick={async () => {
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
					                		quantity: Number(quantity),
					                		total: Number(total),
					                	}
					                	await editReceiptItem(updatedItem);
						                }
						            });
								}}
							>
								Edit
							</Button>
							<Button 
								variant="danger"
								className="w-50"
								onClick={ async () => {
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

									return
								}}
							>
								Delete
							</Button>	
						</div>
						
					</Fragment>
				)
			})}
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
                    value={price}
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
                    value={quantity * price}
                    disabled
                    id="total"
                />
            </Form.Group>
		</Form>
	)
}

