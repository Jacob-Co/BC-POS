const ItemDB = require('../models/Item');

module.exports.createItem = async (itemDetails) => {
	const newItem = new ItemDB(itemDetails)
	try {
		await newItem.save();
		return true;
	} catch(err) {
		throw err;
	}
}

module.exports.getItems = async (query) => {
	try {
		const items = await ItemDB.find(query);
		return items;
	} catch(err) {
		throw err
	}
}

module.exports.editItem = async (query, edits) => {
	try {
		const editedItem = await ItemDB.findOneAndUpdate(query, edits, { new: true });
		return true;
	} catch(err) {
		throw err;
	}
}

module.exports.deleteItem = async (query) => {
	try {
		await ItemDB.deleteOne(query);
		return true;
	} catch(err) {
		throw err;
	}
}

module.exports.getItem = async (query) => {
	try {
		const item = await ItemDB.findOne(query);
		return item;
	} catch (err) {
		throw err;
	}
}
