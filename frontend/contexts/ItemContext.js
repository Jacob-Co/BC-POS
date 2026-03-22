import React, { useState, useEffect, useContext } from 'react';
import UserContext from './UserContext';
import ItemHelper from '../helper/itemHelper';

const ItemContext = React.createContext();

export default ItemContext;

export function ItemsProviderWrapper({ children }) {
	const { user } = useContext(UserContext);
	const [items, privateSetItems] = useState([]);
	const [invalidBarcodeItems, privateSetInvalidBarcodeItems] = useState([]);
	const [isItemContextSet, setIsItemContextSet] = useState(false);

	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API || '';

	useEffect(() => {
		setItems();
	}, [ user ]);

	function unsetItems() {
		privateSetItems([]);
	}

	async function setItems() {
		const token = user.token
		if (token === null) return;
		const items = await ItemHelper.getItems(token);

		if (items !== false) {
			privateSetItems(items);
		} else {
			console.log('Error fetching items');
		}
	}

	async function setInvalidBarcodeItems() {
		const token = user.token
		if (token === null) return;
		const invalidBarcodeItems = await ItemHelper.getInvalidBarcodes(token);

		if (invalidBarcodeItems !== false) {
			privateSetInvalidBarcodeItems(invalidBarcodeItems);
		} else {
			console.log('Error fetching items');
		}
	}

	return (
		<ItemContext.Provider value={
			{
				items,
				setItems,
				unsetItems,
				isItemContextSet,
				invalidBarcodeItems,
				setInvalidBarcodeItems
			}
		}>
			{ children }
		</ItemContext.Provider>
	)
}
