import { Fragment, useContext, useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

import UserContext from '../contexts/UserContext';
import ItemHelper from '../helper/itemHelper';

export default function inventoryButton() {
	const { user } = useContext(UserContext);
	const [url, setUrl] = useState('#');
	const [fileName, setFilename] = useState('');

	async function downloadCSVInventory() {
		const inventoryObj = await ItemHelper.getInventoryObject(user.token);
		const blob = new Blob([inventoryObj.csvString]);
		const fileDownloadUrl = URL.createObjectURL(blob);
		setUrl(fileDownloadUrl);
		setFilename(inventoryObj.date + '.csv');
	}
	 useEffect(() => {
	 	downloadCSVInventory();
	 }, [])

	return (
		<Fragment>
			<Button onClick={downloadCSVInventory}>
				<a 
	             download={fileName}
	             href={url}
	             className="text-white"
          		>
          			Get CSV Inventory
      			</a>
				
			</Button>

		</Fragment>
	)
}