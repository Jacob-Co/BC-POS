const router = require('express').Router();
const auth = require('../controller/auth');
const ItemController = require('../controller/item');

router.post('/', auth.verify, (req, res) => {
	const itemDetails = req.body;
	itemDetails.user = auth.decode(req.headers.authorization).id
	// returns item object
	ItemController.createItem(itemDetails).then(result => res.send(result));
});

router.post('/no-barcode', auth.verify, (req, res) => {
	const itemDetails = req.body;
	itemDetails.user = auth.decode(req.headers.authorization).id
	// returns item object
	ItemController.createItemWithoutBarcode(itemDetails).then(result => res.send(result));
})

router.get('/all', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	// return array of item objects
	ItemController.getAllItems(userId).then(result => res.send(result));
})

router.get('/invalid-barcodes', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	ItemController.getInvalidBarcodes(userId).then(result => res.send(result));
})

router.get('/csv-inventory', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	ItemController.getInventoryCSV(userId).then(result => res.send(result));
} )

router.patch('/:itemId', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const itemId = req.params.itemId;
	const edits = req.body.edits;
	const password = req.body.password;
	const params = {
		userId,
		itemId,
		edits,
		password
	}
	// return edited item object
	ItemController.editItem(params).then(result => res.send(result));
})

router.delete('/:itemId', auth.verify, (req, res) => {
	const userId = auth.decode(req.headers.authorization).id;
	const itemId = req.params.itemId;
	const params = {
		userId,
		itemId
	}
	// return true if deleted and false otherwise
	ItemController.deleteItem(params).then(result => res.send(result));
})

module.exports = router;