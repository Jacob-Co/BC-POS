import { Fragment } from 'react';
import { Card, Button } from 'react-bootstrap';

export default function ReceiptCard({
		receiptItem, handleEdit, handleDelete
	}) {
	return (
		<div className="d-flex justify-content-between">
			<div>
				<div className="text-strong">{receiptItem.item.name}</div>
				<div className="text-muted">
					{receiptItem.item.price - receiptItem.offPrice}{receiptItem.offPrice > 0 ? '(disc)' : ''} php 
					x {receiptItem.quantity} pcs.
				</div>
			</div>
			<div className="d-flex flex-column align-items-end">
				<div className="d-flex">
					<div
						className="mr-3" 
						onClick={() => handleEdit(receiptItem)}
					>
						<span style={{cursor: 'pointer'}}>&#x270E;</span>
					</div>
					<div 
						onClick={() => handleDelete(receiptItem)}
					>
						<span style={{cursor: 'pointer'}}>&#10006;</span>
					</div>
				</div>
				<div>
					{(receiptItem.item.price - receiptItem.offPrice) 
						* receiptItem.quantity} php
				</div>
			</div>
		</div>
	)
}