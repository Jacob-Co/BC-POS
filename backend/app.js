const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/user');
const itemRoutes = require('./routes/item');
const receiptRoutes = require('./routes/receipt');

let mongoConnection;

if (process.env.NODE_ENV === 'test') {
	mongoConnection = process.env.MONGO_CONNECTION_STRING_TEST;
} else {
	mongoConnection = process.env.MONGO_CONNECTION_STRING;
}

mongoose.connect(mongoConnection, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
});

mongoose.connection.once('open',
	() => console.log('Now connected to MongoDB Atlas.'));

app.use(cors({
	origins: process.env.FRONTEND_API,
	optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users',userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/receipts', receiptRoutes);

app.listen(process.env.PORT || 3001, () => {
	console.log(`API is now online on port ${process.env.PORT || 3001}`)
});

module.exports = app;