package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"bc-pos-backend/internal/middleware"
	"bc-pos-backend/internal/models"
)

// POST /api/users  — register a new user
func RegisterUser(c *gin.Context) {
	var userInfo models.User
	if err := c.ShouldBindJSON(&userInfo); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if userInfo.LoginType == "email" {
		if userInfo.Password == "" {
			c.JSON(200, gin.H{"result": false})
			return
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(userInfo.Password), 10)
		if err != nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
		userInfo.Password = string(hashed)
	}

	if err := dataStore.CreateUser(userInfo); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

// POST /api/users/login  — email + password login, returns JWT
func LoginUser(c *gin.Context) {
	var creds struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&creds); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	user, err := dataStore.FindUserByEmail(creds.Email)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	token, err := middleware.CreateToken(user.ID.Hex(), user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	_ = dataStore.SetUserLastUsedToken(user.ID.Hex(), token)
	c.JSON(200, gin.H{"result": token})
}

// POST /api/users/google-login  — validates a Google ID token, returns JWT
func GoogleLogin(c *gin.Context) {
	var body struct {
		GoogleToken string `json:"googleToken"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	payload, err := verifyGoogleToken(body.GoogleToken)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if payload["email_verified"] != "true" {
		c.JSON(200, gin.H{"result": false})
		return
	}

	email, _ := payload["email"].(string)
	user, err := dataStore.FindUserByEmail(email)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if user == nil {
		newUser := models.User{
			FirstName: fmt.Sprintf("%v", payload["given_name"]),
			LastName:  fmt.Sprintf("%v", payload["family_name"]),
			Email:     email,
			LoginType: "google",
		}
		if err := dataStore.CreateUser(newUser); err != nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
		user, err = dataStore.FindUserByEmail(email)
		if err != nil || user == nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
	} else if user.LoginType != "google" {
		c.JSON(200, gin.H{"result": false})
		return
	}

	token, err := middleware.CreateToken(user.ID.Hex(), user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": token})
}

// GET /api/users/details  — returns the decoded JWT payload (no DB call)
func GetUserDetails(c *gin.Context) {
	claims, _ := c.Get(middleware.ClaimsKey)
	c.JSON(200, gin.H{"result": claims})
}

// PATCH /api/users/password  — change login/item/receipt password
func EditPassword(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	var body struct {
		PasswordType string `json:"passwordType"`
		NewPassword  string `json:"newPassword"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}
	if body.PasswordType == "" {
		body.PasswordType = "normal"
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), 10)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	field := "password"
	if body.PasswordType == "item" {
		field = "itemPassword"
	}
	if body.PasswordType == "receipt" {
		field = "receiptPassword"
	}

	if err := dataStore.SetUserPassword(claims.ID, field, string(hashed)); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

// DELETE /api/users  — delete the authenticated user (requires password confirmation)
func DeleteUser(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	var body struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	user, err := dataStore.FindUserByID(claims.ID)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if err := dataStore.DeleteUserByID(claims.ID); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

// GET /api/users/all  — admin only: list every registered user (passwords excluded)
func GetAllUsers(c *gin.Context) {
	users, err := dataStore.ListUsersWithoutSecrets()
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": users})
}

// verifyGoogleToken calls Google's tokeninfo endpoint and returns the token payload.
func verifyGoogleToken(idToken string) (map[string]interface{}, error) {
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google tokeninfo returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}

	if clientID := os.Getenv("GOOGLE_CLIENT_ID"); clientID != "" {
		if aud, _ := payload["aud"].(string); aud != clientID {
			return nil, fmt.Errorf("token audience mismatch")
		}
	}

	return payload, nil
}
