// for routing and authentication
const router = require('express').Router();
const auth = require('../controller/auth');
const ReceiptController = require('../controller/receipt');

router.post('/', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const receipt = req.body;
	ReceiptController.recordReceipt({ receipt, userId }).then(result => res.send(result));
});

router.post('/hardCode', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const receipt = req.body.receipt;
	const password = req.body.password;
	ReceiptController.hardCodeReceipt({ receipt, userId, password })
		.then(result => res.send(result));
})

router.post('/multiple', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const receipts = req.body;
	// returns an array of unrecroded recepit objects
	ReceiptController.recordReceipts({ userId, receipts }).then(result => res.send(result));
});

router.get('/dates/:startUNIX/:endUNIX', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const startUNIX = req.params.startUNIX;
	const endUNIX = req.params.endUNIX;
	const params = {
		userId,
		startUNIX,
		endUNIX
	}
	// returns an array of receipt objects
	ReceiptController.getReceiptsByDate(params).then(result => res.send(result));
});

router.get('/sales/:UNIX', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const UNIX = req.params.UNIX;
	ReceiptController.getSales({ UNIX, userId }).then(result => res.send(result));
});

router.get('/unresolved', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	ReceiptController.getUnresolved(userId).then(result => res.send(result));
});

router.patch('/:receiptId', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const receiptId = req.params.receiptId;
	const edits = req.body.edits;
	const password = req.body.password
	ReceiptController.editReceipt({ userId, receiptId, edits, password })
		.then(result => res.send(result));
});

router.delete('/:receiptId', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const receiptId = req.params.receiptId;
	const password = req.body.password;
	ReceiptController.deleteReceipt(receiptId, userId, password)
		.then(result => res.send(result));
})

module.exports = router;
