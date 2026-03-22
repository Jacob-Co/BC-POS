// for routing and authentication
const router = require('express').Router();
const auth = require('../controller/auth');
const UserController  = require('../controller/user');

router.post('/', (req, res) => {
	const userDetails = req.body;
	// return a boolean
	UserController.register(userDetails).then(result => res.send(result));
});

router.post('/login', (req, res) => {
	const loginCredentials = req.body;
	// sends a token stirng or false
	UserController.login(loginCredentials).then(result => res.send(result));
});

router.post('/google-login', (req, res) => {
	const googleToken = req.body.googleToken;
	// sends a token string or false
	UserController.googleLogin(googleToken).then(result => res.send(result));
})

router.get('/details', auth.verify, (req, res) => {
	// sends user object or false
	res.send({ result: auth.decode(req.headers.authorization) });
})

router.patch('/password', auth.verify, async (req, res) => {
	const userId = auth.decode(req.headers.authorization).id
	const type = req.body.passwordType || 'normal'; // can be 'item' or 'receipt'
	const newPassword = req.body.newPassword;

	try {
		await UserController.editPassword({ type, newPassword, userId });
		res.send({ result: true});
	} catch(err) {
		console.error(err);
		res.send( { result: false });
	}
})

router.delete('/', auth.verify, async (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const password = req.body.password;
	try {
		const result = await UserController.deleteUser({ userId, password });
		res.send({ result });
	} catch (err) {
		console.error(err);
		res.send({ result: false });
	}
})

module.exports = router;
