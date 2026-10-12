package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const claimsKey = "claims"

func abort(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{"error": code, "message": message})
}

func Authenticate(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			abort(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
			return
		}
		scheme, token, found := strings.Cut(header, " ")
		if !found || !strings.EqualFold(scheme, "Bearer") || token == "" {
			abort(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token")
			return
		}
		claims, err := ParseToken(secret, token)
		if err != nil {
			abort(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token")
			return
		}
		c.Set(claimsKey, claims)
		c.Next()
	}
}

func RequireRoles(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get(claimsKey)
		claims, ok := value.(*Claims)
		if !exists || !ok {
			abort(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
			return
		}
		for _, role := range roles {
			if claims.Role == role {
				c.Next()
				return
			}
		}
		abort(c, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
	}
}
