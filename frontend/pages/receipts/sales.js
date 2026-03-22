import { Fragment, useState, useContext, useEffect } from 'react';
import { Table, Form } from 'react-bootstrap';

import UserContext from '../../contexts/UserContext';
import ReceiptHelper from '../../helper/receiptHelper';

export default function sales() {
	const { user } = useContext(UserContext);
	const [dateControl, setDateControl] = useState(dateObjToControl(new Date()));
	const [salesObj, setSalesObj] = useState({});
	const [salesBody, setSalesBody] = useState();

	useEffect(() => {
		async function setSales() {
			const res = await ReceiptHelper.
				getSales(dateControlToUNIX(dateControl), user.token);
			console.log(res);
			setSalesObj(res);
		}

		setSales();
	}, [dateControl]);

	useEffect(() => {
		if (salesObj.itemCountHash === undefined) return;
		const items = Object.keys(salesObj.itemCountHash);
		const itemPriceHash = salesObj.itemPriceHash;
		const itemCountHash = salesObj.itemCountHash;
		setSalesBody(items.map(item => {
			return (
				<tr key={item}>
					<td>{item}</td>
					<td>{itemPriceHash[item]}</td>
					<td>{itemCountHash[item]}</td>
					<td>{itemCountHash[item] * itemPriceHash[item] }</td>
				</tr>
			)
		}))
	}, [salesObj])

	return (
		<Fragment>
			<Form>
				<Form.Control
					type="date"
					value={dateControl}
					onChange={(e) => {
						setDateControl(e.target.value);
					}}
				/>
			</Form>
			<h3>Total Sales: {salesObj.total}</h3>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Item</th>
						<th>Price</th>
						<th>Count</th>
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					{salesBody}
				</tbody>
			</Table>
		</Fragment>
	)
}

function dateObjToControl(dateObj) {
	const year = dateObj.getFullYear();
	const month = addPrecedingZero(dateObj.getMonth() + 1); // month in Date month is 0 index
	const date = addPrecedingZero(dateObj.getDate());

	return `${year}-${month}-${date}`
}

function addPrecedingZero(num) {
	return (num.toString().length >= 2) ? num.toString() : `0${num}`
}

function dateControlToUNIX(dateControl) {
	const [year, month, date] = dateControl.split('-');
	console.log(new Date(Number(year), Number(month - 1), Number(date)).getTime());
	// month is -1 because Date month is 0 index

	return new Date(Number(year), Number(month - 1), Number(date)).getTime();
}