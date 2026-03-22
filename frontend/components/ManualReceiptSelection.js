import { Fragment, useState, useEffect } from 'react';
import { Form, Card, Button } from 'react-bootstrap';

// filter
// items, onAdd

export default function ManualReceiptSelection({ items, onAdd }) {
	const [filterWord, setFilterWord] = useState('');
	const [barcodeFilter, setBarcodeFilter] = useState('');
	const [displayItems, setDisplayItems] = useState([]);

	useEffect(() => {
		const isFilterWordEmpty = filterWord === '';
		const isBarcodeFilterEmpty = barcodeFilter === ''

		if (isFilterWordEmpty && isBarcodeFilterEmpty) {
			return setDisplayItems([]);
		}

		let filteredItems = items;

		if (!isFilterWordEmpty) {
			filteredItems = filteredItems.filter(item => {
				return item.name.toLowerCase()
					.includes(filterWord.toLowerCase());
			});
		}

		if (!isBarcodeFilterEmpty) {
			filteredItems = filteredItems.filter(item => {
				if (item.barcode === null) return false;
				return item.barcode.toLowerCase()
					.includes(barcodeFilter.toLowerCase());
			})
		}
		
		setDisplayItems(filteredItems);
	}, [filterWord, barcodeFilter]);

	return (
		<Fragment>
			<Form>
				<Form.Control 
					type="input"
					placeholder="Filter By Name"
					value={filterWord}
					onChange={(e) => setFilterWord(e.target.value)}
				/>
				<Form.Control 
					type="number"
					placeholder="Filter By Barcode"
					value={barcodeFilter}
					onChange={(e) => setBarcodeFilter(e.target.value.toString())}
				/>
			</Form>
			{displayItems.map(item => {
				return (
					<Card key={item._id} className="mb-3">
						<Card.Body>
							<Card.Title>{item.name}</Card.Title>
							<Card.Title>price: {item.price}</Card.Title>
							<Button 
								variant="success"
								onClick={() => onAdd(item)}
							>
								Add
							</Button>
						</Card.Body>
					</Card>
				)
			})}
		</Fragment>
	)
}