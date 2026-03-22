import { Fragment, useEffect, useState, useContext } from 'react';
import { Spinner, Button } from 'react-bootstrap';

import ItemContext from '../../contexts/ItemContext';
import ItemCard from '../../components/ItemCard'; 

export default function invalid() {
	const { items, invalidBarcodeItems, setInvalidBarcodeItems } = 
		useContext(ItemContext);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// if (invalidBarcodeItems.length !== 0) return setIsLoading(false);
		loadInvalidBarcodeItems();
	}, [])

	async function loadInvalidBarcodeItems() {
			await setInvalidBarcodeItems();
			setIsLoading(false);
	}

	return (
		<Fragment>
			<h3>Invalid Barcodes</h3>
			{/* <Button onClick={loadInvalidBarcodeItems}> */}
			{/* 	Refresh Invalid Barcodes */}
			{/* </Button> */}
			{ isLoading
				? <div className="text-center">
						<Spinner animation="border" variant="primary"/>
						This might take up to {` ${displayLoadTime(items.length * 3)}`}
					</div>
				: <Fragment>
						{ invalidBarcodeItems.length === 0
							? <h5>No invalid barcodes</h5>
							: invalidBarcodeItems.map(item => {
									return (<ItemCard item={item} key={item._id} />)
								})
						}
					</Fragment>
			}
		</Fragment>
	)
}

function displayLoadTime(time) {
	if (time > 60) {
		return `${Math.ceil(time / 60)} minutes`
	} else {
		return `${time} seconds`
	}
}