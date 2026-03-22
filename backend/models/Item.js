const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Name is required']
	},
	barcode: {
		type: String,
		default: ""
	},
	isValidBarcode: {
		type: Boolean,
		default: false
	},
	isBarcodeChecked: {
		type: Boolean,
		default: false
	},
	price: {
		type: Number,
		required: [true, 'Price is required']
	},
	stock: {
		type: Number,
		required: [true, 'Stock is required']
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'A user/ownser is required']
	},
	offPrice: {
		type: Number,
		default: 0
	},
	expiryDates: [Number] // UNIX codes
});

module.exports = mongoose.model('Item', itemSchema);
