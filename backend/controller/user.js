const UserDataAccess = require('../data-access/user');
const bcrypt = require('bcryptjs');
const auth = require('./auth');
const { OAuth2Client } = require('google-auth-library');
const googleClientId = process.env.GOOGLE_CLIENT_ID;

module.exports.register = async (userInfo) => {
	if (userInfo.loginType === 'email') {
		if (userInfo.password === undefined) {
			console.error('Email loginType requires a password');
			return { result: false }
		}
		userInfo.password = bcrypt.hashSync(userInfo.password, 10);	
	}
	
	try {
		const userCreationResult = await UserDataAccess.createNewUser(userInfo);
		return { result: userCreationResult }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

module.exports.login = async (loginCredentials) => {
	try {
		const user = await UserDataAccess
			.getUser({ email: loginCredentials.email} );

		if (user !== null) {
			const isPasswordMatched = 
				bcrypt.compareSync(loginCredentials.password, user.password);

			if (isPasswordMatched === true) {
				const token = auth.createAccessToken(user);
				await updateUserToken(token, user._id);
				return { result: token };
			}
		}

		return { result: false }
	} catch (err) {
		console.error(err);
		return { result: false }
	}
}

async function updateUserToken(token, userId) {
	const query = { _id: userId };
	const edits = { lastUsedToken: token }
	return await UserDataAccess.editUser(query, edits);
}

module.exports.getLastUsedToken = async (userId) => {
	const user = await UserDataAccess.getUser({ _id: userId });
	return user.lastUsedToken;
}

module.exports.googleLogin = async (googleToken) => {
	let googleUser;
	try {
		googleUser = await getGooglePayload(googleToken);
	

		if (googleUser.email_verified !== true) return { result: false };

		let user;
		user = await UserDataAccess.getUser({ email: googleUser.email });
		if (user === null) {
			const userInfo = {
				firstName: googleUser.given_name,
				lastName: googleUser.family_name,
				email: googleUser.email,
				loginType: 'google'
			}
			await UserDataAccess.createNewUser(userInfo);
			user = await UserDataAccess.getUser({ email: googleUser.email });
		} else if (user.loginType !== 'google') {
			return { result: false }
		}

		const token = auth.createAccessToken(user);
		return { result: token }
	} catch(err) {
		console.error(err);
		return { result: false }
	}
}

async function getGooglePayload(googleToken) {
	if (googleToken === undefined) return { result: false };

	try {
		const googleClient = new OAuth2Client(googleClientId);
		const googleData = await googleClient.verifyIdToken({
			idToken: googleToken,
			audience: googleClientId
		});
		return googleData.payload;
	} catch(err) {
		throw err;
	}
}

module.exports.editPassword = async (passwordInfo) => {
	const query = {
		_id: passwordInfo.userId
	}

	const hashedPassword = bcrypt.hashSync(passwordInfo.newPassword, 10);

	const edits = {}

	switch (passwordInfo.type) {
		case 'item':
			edits.itemPassword = hashedPassword;
			break;
		case 'receipt':
			edits.receiptPassword = hashedPassword;
			break;
		default:
			edits.password = hashedPassword;
	}

	return await UserDataAccess.editUser(query, edits);
}

module.exports.deleteUser = async ({ userId, passwrod }) => {
	const user = await UserDataAccess.getUser({ _id: userId });
	const isPasswordMatched = bcrypt.compareSync(password, user.password);

	if (!isPasswordMatched) return false;

	return await UserDataAccess.deleteUser({ _id: userId });
}
