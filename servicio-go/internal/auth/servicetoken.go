package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	serviceName         = "realtime-service"
	serviceTokenTimeout = 60 * time.Second
)

func NewServiceToken(secret string) (string, error) {
	now := time.Now()
	claims := Claims{
		Role: RoleService,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   serviceName,
			Issuer:    serviceName,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(serviceTokenTimeout)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}
