package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	FirstName       string             `bson:"firstName" json:"firstName"`
	LastName        string             `bson:"lastName" json:"lastName"`
	Password        string             `bson:"password,omitempty" json:"password,omitempty"`
	Email           string             `bson:"email" json:"email"`
	IsAdmin         bool               `bson:"isAdmin" json:"isAdmin"`
	LoginType       string             `bson:"loginType" json:"loginType"`
	LastUsedToken   string             `bson:"lastUsedToken,omitempty" json:"lastUsedToken,omitempty"`
	ItemPassword    string             `bson:"itemPassword,omitempty" json:"itemPassword,omitempty"`
	ReceiptPassword string             `bson:"receiptPassword,omitempty" json:"receiptPassword,omitempty"`
}
