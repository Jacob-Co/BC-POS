import { Fragment, useContext, useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';

import ItemContext from '../../contexts/ItemContext';
import ItemCard from '../../components/ItemCard';

import InventoryButton from '../../nonRoutedPages/InventoryButton';

export default function index() {
	const [filterWord, setFilterWord] = useState('');
	const [barcodeFilter, setBarcodeFilter] = useState('');
	const [displayItems, setDisplayItems] = useState(items || []);
	const [expiryFilter, setExpiryFilter] = useState('none')
	const { items, setItems } = useContext(ItemContext);

	useEffect(() => {
		setItems();
	}, [])

	useEffect(() => {
		items.sort((i1, i2) => {
			if (i1.name < i2.name) return -1;
			if (i1.name > i2.name) return 1;
			return 0;
		})
		setDisplayItems(items);
	}, [items]);

	useEffect(() => {
		let sortByExpiry = (item1, item2) => {
			return item1.expiryDates[0] - item2.expiryDates[0];
		}

		let hasExpiryDate = (item) => item.expiryDates && item.expiryDates.length > 0;
		let isExpired = (item) => item.expiryDates[0] < new Date().getTime();
		switch(expiryFilter) {
			case 'none':
				setDisplayItems(items);
				break;
			case 'soon to expire':
				setDisplayItems(items.filter(item => hasExpiryDate(item) && !isExpired(item)).sort(sortByExpiry));
				break;
			case 'expired':
				setDisplayItems(items.filter(item => hasExpiryDate(item) && isExpired(item)).sort(sortByExpiry))
				break;
		}
	}, [expiryFilter])

	useEffect(() => {
		const isFilterWordEmpty = filterWord === '';
		const isBarcodeFilterEmpty = barcodeFilter === ''

		if (isFilterWordEmpty && isBarcodeFilterEmpty) {
			return setDisplayItems(items);
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
	}, [filterWord, barcodeFilter, items]);

	return (
		<Fragment>
			<InventoryButton />
			<Form>
				<Form.Control 
					onChange = {(e) => setExpiryFilter(e.target.value) }
					as="select"
					custom
				>
					<option value="none">No Expiry Date Filter</option>
					<option value="soon to expire">Soon to Expire</option>
					<option value="expired">Expired</option>
				</Form.Control>
				<Form.Control 
					type="input"
					placeholder="Search Filter By Name"
					value={filterWord}
					onChange={(e) => setFilterWord(e.target.value)}
				/>
				<Form.Control 
					type="number"
					placeholder="Search Filter By Barcode"
					value={barcodeFilter}
					onChange={(e) => setBarcodeFilter(e.target.value.toString())}
				/>
			</Form>
			{ displayItems.map(item => {
				return (
					<ItemCard item={item} key={item._id}/>
				)
			})}
		</Fragment>
	)
}