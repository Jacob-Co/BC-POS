const UserController = require('./user');

const jwt = require('jsonwebtoken');
require('dotenv').config();
const secret = process.env.SECRET + 'v4.1.2';

module.exports.createAccessToken = (user) => {
	const data = {
		id: user._id,
		email: user.email,
		isAdmin: user.isAdmin,
		date: (new Date()).getTime()
	}

	return jwt.sign(data, secret, {});
}

// middleware
module.exports.verify = (req, res, next) => {
	let token = req.headers.authorization;

	if (typeof token !== 'undefined') {
		token = token.slice(7, token.length);

		return jwt.verify(token, secret, async (err, data) => {
			// const userId = decode(`bearer ${token}`).id;
			// const prevToken = await UserController.getLastUsedToken(userId);
			// if (err || prevToken !== token) {
			if (err) {
				console.error(err);
				return res.send({ result: 'invalid-token' })
			} else {
				return next();
			}
		})
	} else {
		console.error('No token received')
		return res.send({ result: 'no-token' });
	}
}


function decode(token) {
	if (typeof token !== 'undefined') {
		token = token.slice(7, token.length)

		return jwt.verify(token, secret, (err, data) => {
			return (err) ? null : jwt.decode(token, { complete: true }).payload
		})
	} else {
		return null;
	}
}

module.exports.decode = decode;