// Package auth, for authenticating, token generation and validation
package auth

import "errors"

type User struct {
	Name     string
	Password string
}

var (
	ErrWrongCredentials = errors.New("wrong Credentials")
	ErrInvalidToken     = errors.New("invalid Token")
)

type IDataLayer interface {
	Save(user User) bool
	Validate(user User) bool
}

type IAuthTokenizer interface {
	CreateToken(user User) string
	ParseToken(token string) (*User, bool)
}

type Auth struct {
	db        IDataLayer
	tokenizer IAuthTokenizer
}

func MakeAuth(db IDataLayer, tk IAuthTokenizer) *Auth {
	return &Auth{db: db, tokenizer: tk}
}

func (a *Auth) CreateUser(user User) bool {
	return a.db.Save(user)
}

func (a *Auth) Login(user User) (string, error) {
	if !a.db.Validate(user) {
		return "", ErrWrongCredentials
	}
	return a.tokenizer.CreateToken(user), nil
}

func (a *Auth) ValidateToken(token string) (*User, error) {
	user, ok := a.tokenizer.ParseToken(token)
	
	if !ok {
		return nil, ErrInvalidToken
	}

	return user, nil
}
