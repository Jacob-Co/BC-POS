package auth

import "testing"

type dbTest struct {
	data map[string]string
}

func (db *dbTest) Save(user User) bool {
	_, ok := db.data[user.Name]
	if ok {
		return false
	}
	db.data[user.Name] = user.Password

	return true
}

func (db *dbTest) Validate(user User) bool {
	password, ok := db.data[user.Name]
	if !ok {
		return false
	}
	return password == user.Password
}

type authTokenizerTest struct {
	mockUser        User
	mockParseResult bool
}

func (aT *authTokenizerTest) CreateToken(user User) string {
	return "string"
}

func (aT *authTokenizerTest) ParseToken(token string) (*User, bool) {
	return &aT.mockUser, aT.mockParseResult
}

func makeTestAuth() *Auth {
	db := dbTest{make(map[string]string)}
	tk := authTokenizerTest{}
	return MakeAuth(&db, &tk)
}

func TestCreateUser(t *testing.T) {
	t.Run("Should return true is user does not exist", func(t *testing.T) {
		a := makeTestAuth()
		user := User{
			"jacob",
			"carrot",
		}
		res := a.CreateUser(user)
		if !res {
			t.Error("Expected true")
		}
	})

	t.Run("Should return false is user exists", func(t *testing.T) {
		a := makeTestAuth()
		user := User{
			"jacob",
			"carrot",
		}
		a.CreateUser(user)
		res := a.CreateUser(user)
		if res {
			t.Error("Expected false")
		}
	})
}

func TestLogin(t *testing.T) {
	t.Run("Should return token if user exists and matches", func(t *testing.T) {
		a := makeTestAuth()
		user := User{
			"jacob",
			"carrot",
		}
		a.CreateUser(user)
		token, _ := a.Login(user)

		if token == "" {
			t.Error("Want string token")
		}
	})

	t.Run("Should return WrongCredentialsErr if user does not exist", func(t *testing.T) {
		a := makeTestAuth()
		user := User{
			"jacob",
			"carrot",
		}
		_, err := a.Login(user)

		if err != ErrWrongCredentials {
			t.Errorf("Want WrongCredentialsErr, go %s", err)
		}
	})

	t.Run("Should return WrongCredentialsErr if user exists but does not match", func(t *testing.T) {
		a := makeTestAuth()
		user := User{
			"jacob",
			"carrot",
		}
		a.CreateUser(user)
		user.Password = "wrong"
		_, err := a.Login(user)

		if err != ErrWrongCredentials {
			t.Errorf("Want WrongCredentialsErr, go %s", err)
		}
	})
}

func TestValidateToken(t *testing.T) {
	t.Run("Should return user name if token is valid", func(t *testing.T) {
		a := makeTestAuth()
		user := User{
			"jacob",
			"carrot",
		}
		a.CreateUser(user)
		token, _ := a.Login(user)

		if token == "" {
			t.Errorf("Want token string")
		}
	})

	t.Run("Should return InvalidToken if token is invalid", func(t *testing.T) {
		a := makeTestAuth()
		token := "me"
		_, err := a.ValidateToken(token)

		if err != ErrInvalidToken {
			t.Errorf("Want %s, Got %s", ErrInvalidToken, err)
		}
	})
}
