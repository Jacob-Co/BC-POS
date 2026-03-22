const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: [true, 'First name is required'],
	},
	lastName: {
		type: String,
		required: [true, 'Last name is required']
	},
	password: {
		type: String
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		unique: true
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
	loginType: {
		type: String, // either email or google
		required: [true, 'Login type is required']
	},
	lastUsedToken: String,
	itemPassword: String,
	receiptPassword: String,
})

module.exports = mongoose.model('User', userSchema);