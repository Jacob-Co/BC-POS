import { Fragment, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Form, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

import ItemHelper from '../../helper/itemHelper';

import ItemContext from '../../contexts/ItemContext';
import UserContext from '../../contexts/UserContext';

export default function index() {
	const router = useRouter();
	const { items, setItems } = useContext(ItemContext);
	const { user } = useContext(UserContext);
	const [item, setItem] = useState({});
	const [name, setName] = useState('');
	const [barcode, setBarcode] = useState('');
	const [price, setPrice] = useState('');
	const [stock, setStock] = useState('');
	const [isSending, setIsSending] = useState(false);

	async function handleCreateItem(e) {
		e.preventDefault();
		setIsSending(true);
		let existingItemByBarcode;
		if (barcode !== '') {
			existingItemByBarcode = ItemHelper
				.findItemByBarcode({ barcode, items})
		}
		const existingItemByName = ItemHelper.findItemByName({ items, name });

		if (existingItemByBarcode !== undefined) {
			return Swal.fire({
				title: 'Barcode Already Taken!',
				text: 'If you are going to place a barcode,' + 
					' it must be unique,',
				icon: 'error'
			});
		}

		if (existingItemByName !== undefined || name === '') {
			return Swal.fire({
				title: 'Name Empty or Already Taken!',
				text: 'Name must be unique and non empty',
				icon: 'error'
			});
		}

		// item helper create new item
		const token = user.token
		const res = await ItemHelper.postNewItem({
			name,
			price,
			stock,
			barcode: (barcode === '') ? null : barcode
		}, token);

		if (res === false) {
			return Swal.fire({
				title: 'An Error Occured!',
				text: 'Please check your internet and try again.',
				icon: 'error'
			});
		}

		await setItems();

		const isCreatingAnother = await Swal.fire({
			title: 'Success!',
			text: 'Manually Create Another Item?',
			confirmButtonText: 'Yes',
			confirmButtonColor: '#4BB543',
			showDenyButton: true,
			denyButtonText: 'No',
			reverseButtons: true,
			icon: 'success'
		});

		if (isCreatingAnother.isConfirmed) {
			setName('');
			setBarcode('');
			setPrice(0);
			setStock(0);
		} else {
			router.push('/items/new');
		}
		setIsSending(false);
	}

	return (
		<Fragment>
			<h4>Manually Create New Item</h4>
			<Form onSubmit={handleCreateItem}>
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
						placeholder="Not Required"
						onChange={(e) => setBarcode(e.target.value)}
					/>
				</Form.Group>

				<Form.Group>
					<Form.Label>Price</Form.Label>
					<Form.Control
						type="number"
						placeholder="0"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
					/>
				</Form.Group>

				<Form.Group>
					<Form.Label>Stock</Form.Label>
					<Form.Control
						type="number"
						placeholder="0"
						value={stock}
						onChange={(e) => setStock(e.target.value)}
					/>
				</Form.Group>

				<Button type="submit" disabled={isSending}>Create</Button>
			</Form>
			<Button 
				className="mt-2"
				onClick={() => router.push('/items/new')}
				variant="danger"
			>
				Back to Scanner
			</Button>
		</Fragment>
	)
}