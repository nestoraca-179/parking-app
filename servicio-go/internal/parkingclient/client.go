package parkingclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"realtime-service/internal/auth"
	"realtime-service/internal/hub"
)

const requestTimeout = 5 * time.Second

type Client struct {
	baseURL    string
	jwtSecret  string
	httpClient *http.Client
}

func New(baseURL, jwtSecret string) *Client {
	return &Client{
		baseURL:    baseURL,
		jwtSecret:  jwtSecret,
		httpClient: &http.Client{Timeout: requestTimeout},
	}
}

func (c *Client) FetchSpaces(ctx context.Context) ([]hub.Space, error) {
	token, err := auth.NewServiceToken(c.jwtSecret)
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/internal/parking/spaces", nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+token)
	response, err := c.httpClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("parking service responded with status %d", response.StatusCode)
	}
	spaces := make([]hub.Space, 0)
	if err := json.NewDecoder(response.Body).Decode(&spaces); err != nil {
		return nil, err
	}
	return spaces, nil
}
