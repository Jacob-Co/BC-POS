const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
	items: [
		{
			item: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Item',
				required: [true, 'Id of item is required']
			},
			quantity: {
				type: Number,
				required: [true, 'Quantity is required']
			},
			offPrice: {
				type: Number,
				default: 0
			}
		}
	],
	totalPrice: {
		type: Number,
		required: [true, 'Total price is required']
	},
	date: {
		type: Number, // is in UNIX format
		required: [true, 'Date is reqiured']
	},
	comment: {
		type: String,
		default: ''
	},
	actionTaken: {
		type: String,
		default: ''
	},
	isResolved: {
		type: Boolean,
		default: true
	},
	transactionMode: {
		type: String, //online or physical
		required: [true, 'Transaction mode is required']
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'A user/owner is required']
	},
	sendCode: {
		type: String,
		unique: true
	}
});

module.exports = mongoose.model('Receipt', receiptSchema);