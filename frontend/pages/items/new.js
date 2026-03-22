import { Fragment, useContext, useState } from 'react';
import Link from 'next/link';
import { Spinner, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content'
const ReactSwal = withReactContent(Swal)

import UserContext from '../../contexts/UserContext';
import ItemContext from '../../contexts/ItemContext';

import ScannerWrapper from '../../components/Scanner';
import ItemHelper from '../../helper/itemHelper';

export default function index() {
	const { user } = useContext(UserContext);
	const router = useRouter();
	const { setItems, items } = useContext(ItemContext);
	const [ isLoading, setIsLoading ] = useState(false);
	const [currentReader, setCurrentReader] = useState('ean_reader');

	const [currentBarcode, setCurrentBarcode] = useState(null); // used as a safeguard when adding items
	// the barcode has to return 3 consecutive barcode which are the same for the rest of the createNewItemByBarcode to execute
	const [correctBarcodeAttempts, setCorrectBarcodeAttempts] = useState(0);
	// record of consecutive correct barcodes

	async function createNewItemByBarcode(barcode) {
		if (currentBarcode === null ||
			correctBarcodeAttempts === 0 || 
			correctBarcodeAttempts === 3 || 
				// means that the previous barcode already went through
			currentBarcode !== barcode) 
		{
			setCurrentBarcode(barcode);
			setCorrectBarcodeAttempts(1);
			return;
		}

		if (currentBarcode === barcode) {
			setCorrectBarcodeAttempts(correctBarcodeAttempts + 1);
			if (correctBarcodeAttempts < 2) return;

			// > 2 becuase setCorrectBarcodeAttemps is delayed
			// a 2 means that there were already 3 recoreded correct attempts
		}


		const token = user.token;
		const existingItem = ItemHelper
			.findItemByBarcode({ items, token, barcode });
		if (existingItem !== undefined) {
			const res = await ReactSwal.fire({
				title: 'Duplicate Detected',
				text: `${existingItem.name} is already in the list of items`,
				icon: 'error',
				confirmButtonColor: '#ffbf00',
				confirmButtonText: <span className="text-dark">Edit</span>,
				showCancelButton: true
			})
			if (res.isConfirmed === true) {
				return router.push(`/items/${existingItem._id}`);
			}
			return;
		}
		setIsLoading(true);
		await ItemHelper.createItem({ barcode, token, setItems });
		setIsLoading(false);
	}

	return (
		<Fragment>
			<div className="d-flex">
				<h3>Scan New Items</h3>
				<Button href="/items/addItemBS" className="ml-5">
					Go Barcode Scanner
				</Button>
			</div>
			{ isLoading === true
				? <div className="text-center">
						<Spinner animation="border" variant="primary"/>
					</div>
				: <div>
						<Link href="/items/manual">
							<Button>
								Manually Add Item
							</Button>
						</Link>
					</div>
			}
			<ScannerWrapper 
				currentReader={currentReader}
				setCurrentReader={setCurrentReader}
				scanFunction={createNewItemByBarcode}
			/>
		</Fragment>
	)
}