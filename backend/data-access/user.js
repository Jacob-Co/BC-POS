const UserDB = require('../models/User');

module.exports.createNewUser = async (userDetails) => {
	const newUser = new UserDB (userDetails);
	try {
		const userCreationResult = await newUser.save();
		return true;
	} catch (err) {
		throw err
	}
}

module.exports.getUser = async (query) => {
	try {
		const user = await UserDB.findOne(query);
		return user;
	} catch (err) {
		throw err
	}
}

module.exports.editUser = async (query, edits) => {
	try {
		const user = await UserDB.findOneAndUpdate(query, edits);
		return true;
	} catch(err) {
		throw err
	}
}

module.exports.deleteUser = async (query) => {
	try {
		await UserDB.findOneAndDelete(query);
		return true;
	} catch (err) {
		throw err;
	}
}
