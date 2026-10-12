package auth

import (
	"errors"

	"github.com/golang-jwt/jwt/v5"
)

const (
	RoleAdmin    = "ADMIN"
	RoleOperator = "OPERATOR"
	RoleService  = "SERVICE"
)

var ErrInvalidToken = errors.New("invalid token")

type Claims struct {
	Role     string `json:"role"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func ParseToken(secret, raw string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(
		raw,
		claims,
		func(token *jwt.Token) (any, error) { return []byte(secret), nil },
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithExpirationRequired(),
	)
	if err != nil || !token.Valid || claims.Subject == "" {
		return nil, ErrInvalidToken
	}
	switch claims.Role {
	case RoleAdmin, RoleOperator, RoleService:
		return claims, nil
	default:
		return nil, ErrInvalidToken
	}
}
