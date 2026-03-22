import React, { useState, useEffect } from 'react';

const ReceiptContext = React.createContext();

export default ReceiptContext;

export function ReceiptProviderWrapper({ children }) {
	const [unsentReceipts, setUnsentReceipts] = useState([]); // going to be an array of array objects
	const [unsentUNIX, setUnsentUNIX] = useState([]);
	const [datedReceipts, setDatedReceipts] = useState([]);
	const [localStorageSpace, setLocalStorageSpace] = useState(0);

	useEffect(() => {
		const localUnsentReceipts = JSON.parse(localStorage.getItem('unsentReceipts')) || [];
		const localUnsentUNIX = JSON.parse(localStorage.getItem('unsentUNIX')) || [];
		setUnsentReceipts(localUnsentReceipts);
		setUnsentUNIX(localUnsentUNIX);
	}, []);

	useEffect(() => {
		localStorage.setItem('unsentReceipts', JSON.stringify(unsentReceipts));
		localStorage.setItem('unsentUNIX', JSON.stringify(unsentUNIX));
		setLocalStorageSpace(getLocalStorageSpaceUsed())
	}, [unsentReceipts, unsentUNIX])

	useEffect(() => {
		const oneMb = 1000;
		if (localStorageSpace > oneMb) {
			alert('Local Storage is full, send stored Receipts to DB');
		}
	}, [localStorageSpace])

	const unsetUnsentItems = () => {
		localStorage.removeItem('unsentReceipts');
		localStorage.removeItem('unsentUNIX');
		setUnsentReceipts([]);
		setUnsentUNIX([]);
	}

	function getLocalStorageSpaceUsed() {
		let lsTotal = 0
		let key;
	   	let keySpace;
		for (key in localStorage) {
		    if (!localStorage.hasOwnProperty(key)) {
		        continue;
		    }
		    keySpace = ((localStorage[key].length + key.length) * 2);
		    lsTotal += keySpace;
		};
		console.log("Local Storage = " + (lsTotal / 1024).toFixed(2) + " KB");
		return (lsTotal / 1024).toFixed(2);
	}

	return (
		<ReceiptContext.Provider 
			value={
				{
					unsentReceipts, 
					setUnsentReceipts,
					datedReceipts,
					setDatedReceipts,
					unsentUNIX,
					setUnsentUNIX,
					unsetUnsentItems
				}
			}
		>
			{ children }
		</ReceiptContext.Provider>
	)
}

