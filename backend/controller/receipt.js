const ReceiptDataAccess = require('../data-access/receipt');
const UserDataAccess = require('../data-access/user');
const bcrypt = require('bcryptjs');

const ItemController = require('./item');

async function recordReceipt({ userId, receipt }) {
	try {
		const duplicate = await ReceiptDataAccess
			.getReceipt({ sendCode: receipt.sendCode });

		if (duplicate !== null) return { result: true }

		await receipt.items.forEach(async (item) => {
			const itemId = item.item;
			const quantitySold = item.quantity * -1;
			const edits = { $inc: { stock: quantitySold } };
			await ItemController.editItemNoPassword({ userId, itemId, edits});
		});

		receipt.user = userId;
		await ReceiptDataAccess.createReceipt(receipt)
		return { result: true }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.recordReceipt = recordReceipt;

module.exports.hardCodeReceipt = async ({ userId, receipt, password }) => {
	const user = await UserDataAccess.getUser({ _id: userId });

		if (!!user.receiptPassword) {
			const doesPasswordsMatch = 
				bcrypt.compareSync(password, user.receiptPassword);
			if (!doesPasswordsMatch) return { result: false }
		}
	
	return await recordReceipt({ userId, receipt });
}

module.exports.recordReceipts = async ({ userId, receipts}) => {
	try {
		receipts.forEach(async receipt => {
			await recordReceipt({ userId, receipt});
		});
		return { result: true }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.getSales = async ({ userId, UNIX }) => {
	const itemPriceHash = {};
	const itemCountHash = {};
	let total = 0;

	try {
		const query = {
			date: {
				$gte: UNIX,
				$lt: Number(UNIX) + (24 * 60 * 60 * 1000) // adding 24 hours in miliseconds
			},
			user: userId
		}
		const receipts = await ReceiptDataAccess.getReceipts(query);
		receipts.forEach(receipt => {
			total += receipt.totalPrice;
			receipt.items.forEach(receiptItem => {
				const itemName = receiptItem.item.name;
				if (itemPriceHash[itemName] === undefined) {
					itemPriceHash[itemName] = receiptItem.item.price;
				}

				if (itemCountHash[itemName] === undefined) {
					itemCountHash[itemName] = 0;
				}

				itemCountHash[itemName] += receiptItem.quantity;
			})
		});
		return { result: { total, itemPriceHash, itemCountHash } }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.getReceiptsByDate = async ({ userId, startUNIX, endUNIX }) => {
	try {
		const query = { 
			date: { 
					$gte: startUNIX, 
					$lte: endUNIX 
			},
			user: userId
		}
		const receipts = await ReceiptDataAccess.getReceipts(query);
		return { result: receipts }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.getUnresolved = async (userId) => {
	try {
		const query = {
			user: userId,
			isResolved: false
		};
		const receipts = await ReceiptDataAccess.getReceipts(query);
		return { result: receipts }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.editReceipt = async ({ userId, receiptId, edits, password }) => {
	try {
		const user = await UserDataAccess.getUser({ _id: userId });

		if (!!user.receiptPassword) {
			const doesPasswordsMatch = 
				bcrypt.compareSync(password, user.receiptPassword);
			if (!doesPasswordsMatch) return { result: false }
		}

		const query = {
			user: userId,
			_id: receiptId
		}
		const res = await ReceiptDataAccess.editReceipt(query, edits);
		return { result: true }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.deleteReceipt = async (receiptId, userId, password) => {
	try {
		const user = await UserDataAccess.getUser({ _id: userId });

		if (!!user.receiptPassword) {
			const doesPasswordsMatch = 
				bcrypt.compareSync(password, user.receiptPassword);
			if (!doesPasswordsMatch) return { result: false }
		}

		const receipt = await ReceiptDataAccess.getReceipt({
			user: userId,
			_id: receiptId
		})
		await receipt.items.forEach(async (item) => {
			const itemId = item.item;
			const quantitySold = item.quantity;
			const edits = { $inc: { stock: quantitySold } };
			await ItemController.editItemNoPassword({ userId, itemId, edits});
		});

		const query = {
			_id: receiptId,
			user: userId
		}
		const res = await ReceiptDataAccess.deleteReceipt(query);
		return { result: true }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}
