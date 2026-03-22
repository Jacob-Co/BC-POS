package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Item struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name             string             `bson:"name" json:"name"`
	Barcode          string             `bson:"barcode" json:"barcode"`
	IsValidBarcode   bool               `bson:"isValidBarcode" json:"isValidBarcode"`
	IsBarcodeChecked bool               `bson:"isBarcodeChecked" json:"isBarcodeChecked"`
	Price            float64            `bson:"price" json:"price"`
	Stock            float64            `bson:"stock" json:"stock"`
	User             primitive.ObjectID `bson:"user" json:"user"`
	OffPrice         float64            `bson:"offPrice" json:"offPrice"`
	ExpiryDates      []int64            `bson:"expiryDates" json:"expiryDates"`
}
