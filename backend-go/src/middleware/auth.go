package middleware

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const ClaimsKey = "claims"

// Claims mirrors the JS JWT payload: { id, email, isAdmin, date }.
type Claims struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"isAdmin"`
	Date    int64  `json:"date"`
	jwt.RegisteredClaims
}

func secret() []byte {
	// Must match JS: process.env.SECRET + 'v4.1.2'
	return []byte(os.Getenv("SECRET") + "v4.1.2")
}

// Auth is a Gin middleware that validates the Bearer JWT and stores claims in the context.
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(200, gin.H{"result": "no-token"})
			c.Abort()
			return
		}

		tokenStr := stripBearer(authHeader)
		claims, err := parseToken(tokenStr)
		if err != nil {
			c.JSON(200, gin.H{"result": "invalid-token"})
			c.Abort()
			return
		}

		c.Set(ClaimsKey, claims)
		c.Next()
	}
}

// AdminAuth extends Auth by also requiring isAdmin == true.
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(200, gin.H{"result": "no-token"})
			c.Abort()
			return
		}

		claims, err := parseToken(stripBearer(authHeader))
		if err != nil {
			c.JSON(200, gin.H{"result": "invalid-token"})
			c.Abort()
			return
		}

		if !claims.IsAdmin {
			c.JSON(403, gin.H{"result": "forbidden"})
			c.Abort()
			return
		}

		c.Set(ClaimsKey, claims)
		c.Next()
	}
}

// CreateToken signs a new JWT for the given user — matches JS createAccessToken.
func CreateToken(userID, email string, isAdmin bool) (string, error) {
	claims := Claims{
		ID:      userID,
		Email:   email,
		IsAdmin: isAdmin,
		Date:    time.Now().UnixMilli(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret())
}

// DecodeHeader parses the Authorization header and returns the claims (no DB round-trip).
func DecodeHeader(authHeader string) (*Claims, error) {
	return parseToken(stripBearer(authHeader))
}

func parseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secret(), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return claims, nil
}

func stripBearer(header string) string {
	if strings.HasPrefix(header, "Bearer ") {
		return header[7:]
	}
	return header
}
