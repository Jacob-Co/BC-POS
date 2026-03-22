package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// ReceiptItem is the embedded item reference stored in the DB (item field = ObjectID).
type ReceiptItem struct {
	Item     primitive.ObjectID `bson:"item" json:"item"`
	Quantity float64            `bson:"quantity" json:"quantity"`
	OffPrice float64            `bson:"offPrice" json:"offPrice"`
}

// Receipt is the DB model.
type Receipt struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Items           []ReceiptItem      `bson:"items" json:"items"`
	TotalPrice      float64            `bson:"totalPrice" json:"totalPrice"`
	Date            int64              `bson:"date" json:"date"`
	Comment         string             `bson:"comment" json:"comment"`
	ActionTaken     string             `bson:"actionTaken" json:"actionTaken"`
	IsResolved      bool               `bson:"isResolved" json:"isResolved"`
	TransactionMode string             `bson:"transactionMode" json:"transactionMode"`
	User            primitive.ObjectID `bson:"user" json:"user"`
	SendCode        string             `bson:"sendCode,omitempty" json:"sendCode,omitempty"`
}

// PopulatedReceiptItem replaces the item ObjectID with the full Item document.
type PopulatedReceiptItem struct {
	Item     Item    `bson:"item" json:"item"`
	Quantity float64 `bson:"quantity" json:"quantity"`
	OffPrice float64 `bson:"offPrice" json:"offPrice"`
}

// PopulatedReceipt is returned in API responses — items contain full Item objects.
type PopulatedReceipt struct {
	ID              primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
	Items           []PopulatedReceiptItem `bson:"items" json:"items"`
	TotalPrice      float64                `bson:"totalPrice" json:"totalPrice"`
	Date            int64                  `bson:"date" json:"date"`
	Comment         string                 `bson:"comment" json:"comment"`
	ActionTaken     string                 `bson:"actionTaken" json:"actionTaken"`
	IsResolved      bool                   `bson:"isResolved" json:"isResolved"`
	TransactionMode string                 `bson:"transactionMode" json:"transactionMode"`
	User            primitive.ObjectID     `bson:"user" json:"user"`
	SendCode        string                 `bson:"sendCode,omitempty" json:"sendCode,omitempty"`
}
