import { Fragment } from 'react';
import { Card } from 'react-bootstrap';

export default function ReceiptCard({
		item, quantity, total, offPrice
	}) {
	return (
		<Card>
			<Card.Body>
				<Card.Header>{item.name}</Card.Header>
				<Card.Text>
					price: {offPrice > 0 
						? <Fragment>
								<span className="text-danger">
									{item.price - offPrice}
								</span>
								<span className="text-muted">
									{` (${item.price})`}
								</span>
							</Fragment> 
						: item.price
					}
				</Card.Text>
				<Card.Text>
					qty: {quantity}
				</Card.Text>
				<Card.Text>
					<div>total: <span className="text-info">{`${total}`}</span></div>
				</Card.Text>
			</Card.Body>
		</Card>
	)
}
