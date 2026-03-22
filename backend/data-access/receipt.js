const ReceiptDB = require('../models/Receipt');

module.exports.createReceipt = async (receipt) => {
	try {
		const newReceipt = new ReceiptDB(receipt);
		await newReceipt.save();
		return true;
	} catch(err) {
		throw err;
	}
}

module.exports.getReceipt = async (query) => {
	try {
		return await ReceiptDB.findOne(query).populate('items.item');
	} catch(err) {
		throw err;
	}
}

module.exports.getReceipts = async (query) => {
	try {
		return await ReceiptDB.find(query).populate('items.item');
	} catch(err) {
		throw err;
	}
}

module.exports.deleteReceipt = async (query) => {
	try {
		await ReceiptDB.findOneAndDelete(query);
		return true;
	} catch(err) {
		throw err;
	}
}

module.exports.editReceipt = async (query, edits) => {
	try {
		await ReceiptDB.findOneAndUpdate(query, edits);
		return true;
	} catch (err) {
		throw err;
	}
}
