import { Card, Button } from 'react-bootstrap';
import Link from 'next/link';
import dateHelper from '../helper/dateHelper';

export default function ItemCard({item, isEdit = true, isAdd = false, onAdd}) {
	return (
		<Card>
			<Card.Body>
				<Card.Title>{item.name}</Card.Title>
				<Card.Text>barcode: {item.barcode}</Card.Text>
				<Card.Text>price: {item.price}</Card.Text>
				<Card.Text>stock: {item.stock}</Card.Text>
				<Card.Text>Expiry Date: {dateHelper.dateObjToControl(new Date(item.expiryDates[0]))}</Card.Text>
				{ isEdit
					? <Link href={`/items/${item._id}`}>
							<Button variant="warning">Edit</Button>
						</Link>
					: ''
				}
				{ isAdd
					? <Button onClick={onAdd}>Add</Button>
					: ''
				}
			</Card.Body>
		</Card>
	)
}
