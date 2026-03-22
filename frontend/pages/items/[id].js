import { Fragment, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Form, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

import ItemContext from '../../contexts/ItemContext';
import UserContext from '../../contexts/UserContext';
import ItemHelper from '../../helper/itemHelper';
import DateHelper from '../../helper/dateHelper';

export default function index() {
	const router = useRouter();
	const itemId = router.query.id;
	const { items, setItems } = useContext(ItemContext);
	const { user } = useContext(UserContext);
	const [item, setItem] = useState({});
	const [name, setName] = useState('');
	const [barcode, setBarcode] = useState('');
	const [price, setPrice] = useState(0);
	const [stock, setStock] = useState(0);
	const [ expiryDate, setExpiryDate ] = useState();

	const [isValid, setIsValid] = useState(false);

	useEffect(() => {
		if (items.length <= 0) return;
		const targetItem = items.find(item => item._id === itemId)
		setItem(targetItem);
		setName(targetItem.name);
		if (targetItem.barcode !== null) {
			setBarcode(targetItem.barcode);
		}
		setPrice(targetItem.price);
		setStock(targetItem.stock);
		if (!!targetItem.expiryDates && targetItem.expiryDates.length > 0) {
			setExpiryDate(DateHelper
				.dateObjToControl(new Date(targetItem.expiryDates[0])))
		} 
	}, [items])

	useEffect(() => {
		if (name !== '' && !!name.match(/[a-z]/i)) {
			setIsValid(true);
		} else {
			setIsValid(false);
		};
	}, [name])

	async function handleEdit(e) {
		e.preventDefault();
		const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;
		const token = user.token;

		const filteredItems = items.filter(item => item._id !== itemId);

		let exisitingItemByName = ItemHelper
			.findItemByName({ name, items: filteredItems });
		let exisitingItemByBarcode;
		if (barcode !== '' && barcode !== null) {
			exisitingItemByBarcode = ItemHelper
				.findItemByBarcode({ barcode, items: filteredItems});
		}

		if (exisitingItemByBarcode !== undefined ||
			exisitingItemByName !== undefined) 
		{
			return Swal.fire
				('Duplication Error', 'Name or barcode might already exist', 'error');
		}

		const password = await Swal.fire({
			input: 'password',
			title: 'Input Admin Code'
		})

		try {
			// convert time to UNIX here and place in object
			let newExpiryDates = [];
			if (expiryDate !== undefined) {
				newExpiryDates = [DateHelper.dateControlToUNIX(expiryDate)];
			}
			

			const editItemRes = await ItemHelper.editItem(
				token, 
				{
					name,
					price,
					stock,
					barcode,
					isBarcodeChecked: false,
					isValidBarcode: false,
					expiryDates: newExpiryDates
				}, 
				item._id,
				password.value
			);

			if (editItemRes === false) {
				return Swal.fire('Wrong Admin Code or An Error Occured', 'Please try again.', 'error');
			}
			Swal.fire('Successfully Edited', 'Changed were saved on the database.', 'success');
			await setItems();
			router.back();
		} catch (err) {
			Swal.fire('Request Timed Out', 'You might not be connected to the internet', 'error');
		}
	}

	return (
		<Fragment>
			<Form onSubmit={handleEdit}>
				<Form.Group>
					<Form.Label>Name</Form.Label>
					<Form.Control
						type="input"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</Form.Group>

				<Form.Group>
					<Form.Label>Barcode</Form.Label>
					<Form.Control
						type="input"
						value={barcode}
						onChange={(e) => setBarcode(e.target.value)}
					/>
				</Form.Group>

				<Form.Group>
					<Form.Label>Price</Form.Label>
					<Form.Control
						type="number"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
					/>
				</Form.Group>

				<Form.Group>
					<Form.Label>Stock</Form.Label>
					<Form.Control
						type="number"
						value={stock}
						onChange={(e) => setStock(e.target.value)}
					/>
				</Form.Group>

				<Form.Group>
					<Form.Label>Expiry Date</Form.Label>
					<Form.Control
						type="date"
						value={expiryDate}
						onChange={(e) => setExpiryDate(e.target.value)}
					/>
				</Form.Group>

				<Button type="submit" disabled={!isValid}>Confirm Edit</Button>
			</Form>
			<Button 
				className="mt-2"
				onClick={() => router.back()}
				variant="danger"
			>
				Back
			</Button>
		</Fragment>
	)
}