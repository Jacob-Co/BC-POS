import { Fragment, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { Spinner, Button, Form } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content'
const ReactSwal = withReactContent(Swal)

import UserContext from '../../contexts/UserContext';
import ItemContext from '../../contexts/ItemContext';

import ItemHelper from '../../helper/itemHelper';

export default function index() {
	const { user } = useContext(UserContext);
	const router = useRouter();
	const { setItems, items } = useContext(ItemContext);
	const [ isLoading, setIsLoading ] = useState(false);

	const [currentBarcode, setCurrentBarcode] = useState(null); // used as a safeguard when adding items
	// the barcode has to return 3 consecutive barcode which are the same for the rest of the createNewItemByBarcode to execute
	const [correctBarcodeAttempts, setCorrectBarcodeAttempts] = useState(0);
	// record of consecutive correct barcodes

	const [isBarcodeComplete, setIsBarcodeComplete] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const [scannedKey, setScannedKey] = useState('');
	const [barcode, setBarcode] = useState('');
	const [barcodeCheckArr, setBarcodeCheckArr] = useState([]);

	useEffect(() => {
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				setIsBarcodeComplete(true);
			} else {
				if (!(e.key.match(/[0-9]/))) return;
				setScannedKey(e.key);
				setIsScanning(true);
			}
		})
	}, [])

	useEffect(() => {
		if (isScanning === true) {
			setBarcode(barcode + scannedKey);
			setIsScanning(false);
		}
	}, [isScanning])

	useEffect(async () => {
		if (isBarcodeComplete === true) {
			await createNewItemByBarcode(barcode);
			setBarcode('');
			setIsBarcodeComplete(false);
		}
	}, [isBarcodeComplete])

	async function createNewItemByBarcode(barcode) {
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
			return setBarcodeCheckArr([]);
		}

		if (barcodeCheckArr.length === 0) {
			return setBarcodeCheckArr(barcodeCheckArr.concat(barcode));
		} else if (barcodeCheckArr.length === 1) {
			if (barcodeCheckArr[0] === barcode) {
				return setBarcodeCheckArr(barcodeCheckArr.concat(barcode));
			} else {
				setBarcodeCheckArr([]);
				await Swal.fire({
					title: 'Mismatching barcodes',
					icon: 'error'
				});
				return;
			}
		} else if (barcodeCheckArr.length === 2) {
			if (barcodeCheckArr[0] === barcode) {
				setBarcodeCheckArr([]);
			} else {
				setBarcodeCheckArr([]);
				await Swal.fire({
					title: 'Mismatching barcodes',
					icon: 'error'
				});
				return;
			}
		}

		setIsLoading(true);
		await ItemHelper.createItem({ barcode, token, setItems });
		setIsLoading(false);
	}

	return (
		<Fragment>
			<h3>Scan New Items</h3>
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
						<h5 className="mt-3">Scan the barcode 3 times</h5>
						<Form.Control 
							type="input"
							disabled
							value={barcodeCheckArr[0] !== undefined ? barcodeCheckArr[0] : ''}
							placeholder="Main Barcode"
						/>
						<Form.Control 
							type="input"
							disabled
							value={barcodeCheckArr[1] !== undefined ? barcodeCheckArr[1] : ''}
							placeholder="Confirmatory Barcode 1"
						/>
						<Form.Control 
							type="input"
							disabled
							value={barcodeCheckArr[2] !== undefined ? barcodeCheckArr[2] : ''}
							placeholder="Confirmatory Barcode 2"
						/>
						<Button 
							variant="warning"
							onClick={() => {
								setBarcodeCheckArr([])
							}}
							as="div"
						>
							Reset
						</Button>
					</div>
			}
		</Fragment>
	)
}