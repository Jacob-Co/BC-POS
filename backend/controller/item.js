const ItemDataAccess = require('../data-access/item');
const UserDataAccess = require('../data-access/user');
const puppeteer = require('puppeteer');
const bcrypt = require('bcryptjs');

module.exports.createItem = async (itemDetails) => {
	try {
		const user = itemDetails.user;
		const barcode = itemDetails.barcode;
		const name = itemDetails.name;

		const sameNameItem = await ItemDataAccess.getItem({ user, name });
		const sameBarcodeItem = await ItemDataAccess.getItem({ user, barcode });

		if (sameNameItem !== null || sameBarcodeItem !== null) {
			return { result: false }
		}

		const res = await ItemDataAccess.createItem(itemDetails);
		return { result: res }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.createItemWithoutBarcode = async (itemDetails) => {
	try {
		const user = itemDetails.user;
		const name = itemDetails.name;

		const sameNameItem = await ItemDataAccess.getItem({ user, name });

		if (sameNameItem !== null) {
			return { result: false }
		}

		const res = await ItemDataAccess.createItem(itemDetails);
		return { result: res }
	} catch (err) {
		console.error(err);
		return { result: false }
	}	
}

module.exports.getAllItems = async (userId) => {
	try {
		const items = await ItemDataAccess.getItems({ user: userId });
		return { result: items }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
	
}

module.exports.editItemNoPassword = async ({ userId, itemId, edits }) => {
	try {
		const query = { user: userId, _id: itemId};
		const res = await ItemDataAccess.editItem(query, edits);
		return { result: res }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.editItem = async ({userId, itemId, edits, password}) => {
	try {
		const query = { user: userId, _id: itemId};

		const user = await UserDataAccess.getUser({ _id: userId });

		if (!!user.itemPassword) {
			const matchedPasswords = 
				bcrypt.compareSync(password, user.itemPassword);
			if (!matchedPasswords) return { result: false }
		}

		const res = await ItemDataAccess.editItem(query, edits);
		return { result: res }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.deleteItem = async ({ userId, itemId }) => {
	try {
		const query = { user: userId, _id: itemId };
		const res = await ItemDataAccess.deleteItem(query);
		return { result: res }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

function addLeadingZero(num) {
	return (num.toString().length === 1) ? `0${num}` : `${num}`;
}

module.exports.getInventoryCSV = async(userId) => {
	try {
		const items = await ItemDataAccess.getItems({ user: userId });
		let date = new Date();
		const dateString = `${date.getFullYear()}${addLeadingZero(date.getMonth() + 1)}` +
			`${addLeadingZero(date.getDate())}`
		let csvString = `Product Name,Stock,Price, Expiry Date\n`
		items.forEach(item => csvString +=
`${item.name},${item.stock},${item.price},${formatExpiryDate(item.expiryDates[0])}\n`);
		return { result: { csvString, date: dateString } }
	} catch(err) {
		console.error(err);
		return { result: false }
	}
}

function formatExpiryDate(unix) {
  if (unix) {
    return (new Date(unix)).toLocaleDateString();
  } else {
    return '';
  }
}

module.exports.getInvalidBarcodes = async (userId) => {
	try {
		const query = {
		user: userId,
			barcode: {
				$ne: null
			},
			isValidBarcode: {
				$ne: true
			}
		}
		const items = await ItemDataAccess.getItems(query);
		const invalidBarcodes = [];
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox'
			]
		});
		const page = await browser.newPage();

		for (let i = 0; i < items.length; i++) {
			const barcode = items[i].barcode;
			const eanLength = 13;
			const upcLength = 12;
			if (barcode.length > eanLength || barcode.length < upcLength ) {
				invalidBarcodes.push(items[i]);
				continue;
			}

			if (items[i].isValidBarcode === false && items[i].isBarcodeChecked === true) {
				invalidBarcodes.push(items[i]);
				continue;
			}

			await page.goto(`https://www.google.com/search?q=barcode+${barcode}`);
			const hasResults = await page.evaluate(() => {
				if (document.querySelector('#result-stats') === null) {
					return false;
				}
				return true
			});

			const editQuery = {user: userId, _id: items[i]._id}
			let edits;

			if (hasResults === true) {
				edits = {isValidBarcode: true, isBarcodeChecked: true}
			} else if (hasResults === false) {
				edits = {isBarcodeChecked: true} 
				invalidBarcodes.push(items[i])
			}

			await ItemDataAccess.editItem(editQuery, edits);
		}


		return { result: invalidBarcodes }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}
